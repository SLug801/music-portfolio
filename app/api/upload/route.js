import { handleUpload } from '@vercel/blob/client';

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: '파일 스토리지가 아직 설정되지 않았습니다. (Blob 스토어 필요)' }, { status: 503 });
  }

  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      body,
      request,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        maximumSizeInBytes: 1024 * 1024 * 1024, // 파일당 최대 1GB
      }),
      onUploadCompleted: async () => {
        // 업로드 완료 콜백 (필요 시 로깅). 로컬에서는 호출되지 않음.
      },
    });
    return Response.json(jsonResponse);
  } catch (error) {
    console.error('handleUpload 실패:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
