// Vercel Blob 클라이언트 업로드용 함수 (Web 표준 Request/Response 방식)
// 최신 handleUpload는 Web Request 객체를 요구하므로 ESM(.mjs) + Request 시그니처 사용.
// ⚠️ Vercel 대시보드에서 Blob 스토어 생성 → BLOB_READ_WRITE_TOKEN 필요.
import { handleUpload } from '@vercel/blob/client';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: '파일 스토리지가 아직 설정되지 않았습니다. (Blob 스토어 필요)' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN, // OIDC 대신 정적 토큰 강제
      body,
      request,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        maximumSizeInBytes: 500 * 1024 * 1024, // 파일당 최대 500MB
      }),
      onUploadCompleted: async () => {
        // 업로드 완료 콜백 (로컬에서는 호출되지 않음)
      },
    });
    return Response.json(jsonResponse);
  } catch (error) {
    console.error('handleUpload 실패:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
