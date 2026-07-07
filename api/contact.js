// Vercel 서버리스 함수: 문의 폼 → 내 Gmail로 발송
// ⚠️ 아직 "연동 대기" 상태입니다. 실제로 작동시키려면:
//   1) Gmail 2단계 인증 켜고 "앱 비밀번호" 발급
//   2) Vercel 프로젝트 Settings → Environment Variables 에 아래 3개 등록
//        GMAIL_USER          : 보내는 Gmail 주소 (예: me@gmail.com)
//        GMAIL_APP_PASSWORD  : 위에서 발급한 16자리 앱 비밀번호 (공백 없이)
//        TO_EMAIL            : 받을 주소 (안 넣으면 GMAIL_USER로 감)
//   3) 프론트 폼을 mailto → fetch('/api/contact') 로 교체
//   4) 재배포
const nodemailer = require('nodemailer');

// 발신/수신 Gmail 주소 (비밀번호가 아니라 그냥 주소라서 코드에 둬도 안전)
const GMAIL_USER = process.env.GMAIL_USER || 'jw7581171@gmail.com';
const TO_EMAIL = process.env.TO_EMAIL || GMAIL_USER;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, type, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: '필수 항목이 비었습니다.' });
  }

  // 앱 비밀번호(환경변수)가 아직 없으면 = 연동 전. 안전하게 막아둠
  if (!process.env.GMAIL_APP_PASSWORD) {
    return res.status(503).json({ error: '메일 발송이 아직 설정되지 않았습니다.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"홈페이지 문의" <${GMAIL_USER}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[외주 문의] ${type || '상담'} - ${name}`,
      text:
        `이름/회사명: ${name}\n` +
        `회신 이메일: ${email}\n` +
        `프로젝트 유형: ${type || '-'}\n\n` +
        `내용:\n${message}`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('메일 발송 실패:', err);
    return res.status(500).json({ error: '메일 발송에 실패했습니다.' });
  }
};
