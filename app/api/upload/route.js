import { AwsClient } from 'aws4fetch';

// Cloudflare R2 (S3 호환) — 브라우저 직접 업로드용 presigned PUT URL 발급
// 필요한 환경변수:
//   R2_ACCOUNT_ID        : Cloudflare 계정 ID
//   R2_ACCESS_KEY_ID     : R2 API 토큰의 Access Key ID
//   R2_SECRET_ACCESS_KEY : R2 API 토큰의 Secret Access Key
//   R2_BUCKET            : 버킷 이름
//   R2_PUBLIC_BASE       : 공개 URL 베이스 (예: https://pub-xxxx.r2.dev  또는 커스텀 도메인)

export async function POST(request) {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_BASE) {
    return Response.json({ error: '파일 스토리지가 아직 설정되지 않았습니다. (R2 환경변수 필요)' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '잘못된 요청' }, { status: 400 });
  }
  const { filename } = body || {};
  if (!filename) {
    return Response.json({ error: 'filename이 필요합니다.' }, { status: 400 });
  }

  // 안전한 키 생성 (공백·한글·특수문자 제거 + 고유 접두어)
  const safe = String(filename).replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_');
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;

  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    region: 'auto',
    service: 's3',
  });

  const endpoint = new URL(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`);
  endpoint.searchParams.set('X-Amz-Expires', '600'); // 10분 유효

  try {
    const signed = await client.sign(endpoint.toString(), {
      method: 'PUT',
      aws: { signQuery: true },
    });

    const publicUrl = `${R2_PUBLIC_BASE.replace(/\/$/, '')}/${key}`;
    return Response.json({ uploadUrl: signed.url, publicUrl, key });
  } catch (error) {
    console.error('R2 presign 실패:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
