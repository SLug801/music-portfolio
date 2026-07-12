import './globals.css';

export const metadata = {
  title: 'BGM & Music Composer',
  description: '외주 작곡, BGM, 음악 포트폴리오',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
