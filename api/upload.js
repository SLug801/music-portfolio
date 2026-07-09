// Vercel Blob 클라이언트 업로드용 서버리스 함수
// 큰 파일은 이 함수가 발급한 토큰으로 브라우저에서 Blob 스토리지에 직접 업로드됩니다.
// ⚠️ 작동하려면 Vercel 대시보드에서 Blob 스토어를 만들어야 합니다.
//    (Storage → Create → Blob → 프로젝트 연결) → BLOB_READ_WRITE_TOKEN 환경변수 자동 추가
const { handleUpload } = require('@vercel/blob/client');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: '파일 스토리지가 아직 설정되지 않았습니다. (Blob 스토어 생성 필요)' });
  }

  // Vercel 함수가 JSON 바디를 문자열로 줄 때 대비
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { /* ignore */ }
  }

  try {
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN, // OIDC 대신 정적 토큰 강제 사용
      request: req,
      body,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        maximumSizeInBytes: 500 * 1024 * 1024, // 파일당 최대 500MB
      }),
      onUploadCompleted: async () => {
        // 업로드 완료 콜백 (필요 시 로깅). 로컬에서는 호출되지 않음.
      },
    });
    return res.status(200).json(jsonResponse);
  } catch (err) {
    console.error('업로드 토큰 발급 실패:', err);
    return res.status(400).json({ error: err.message });
  }
};
