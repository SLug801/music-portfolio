import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || 'jw7581171@gmail.com';
const TO_EMAIL = process.env.TO_EMAIL || GMAIL_USER;

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { name, email, type, message, attachments, links, filelink } = payload || {};
  if (!name || !email || !message) {
    return Response.json({ error: '필수 항목이 비었습니다.' }, { status: 400 });
  }

  // 작은 파일: base64 메일 첨부
  const mailAttachments = Array.isArray(attachments)
    ? attachments
        .filter((a) => a && a.filename && a.content)
        .map((a) => ({
          filename: a.filename,
          content: a.content,
          encoding: 'base64',
          contentType: a.contentType || undefined,
        }))
    : [];

  // 큰 파일: 드라이브(Blob) 업로드 링크
  const fileLinks = Array.isArray(links)
    ? links.filter((l) => l && l.url).map((l) => ({ name: l.name || '파일', url: l.url }))
    : [];

  if (!process.env.GMAIL_APP_PASSWORD) {
    return Response.json({ error: '메일 발송이 아직 설정되지 않았습니다.' }, { status: 503 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const linkBlock =
      (fileLinks.length ? '\n\n[업로드 파일 링크]\n' + fileLinks.map((l) => `- ${l.name}: ${l.url}`).join('\n') : '') +
      (filelink ? `\n\n[첨부 링크]\n${filelink}` : '');

    await transporter.sendMail({
      from: `"홈페이지 문의" <${GMAIL_USER}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[외주 문의] ${type || '상담'} - ${name}`,
      text:
        `이름/회사명: ${name}\n` +
        `회신 이메일: ${email}\n` +
        `프로젝트 유형: ${type || '-'}\n` +
        `메일 첨부: ${mailAttachments.length}개 / 업로드 링크: ${fileLinks.length}개\n\n` +
        `내용:\n${message}` +
        linkBlock,
      attachments: mailAttachments,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('메일 발송 실패:', err);
    return Response.json({ error: '메일 발송에 실패했습니다.' }, { status: 500 });
  }
}
