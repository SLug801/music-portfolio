import './globals.css';

export const metadata = {
  title: '유정열 | Game Music Composer',
  description: '게임 음악 작곡가 유정열의 포트폴리오. 게임 BGM, 사운드 이펙트, 편곡 외주 및 커미션.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
