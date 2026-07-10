/** @type {import('next').NextConfig} */
const nextConfig = {
  // 포팅한 명령형 JS(useEffect 안 DOM 조작)가 개발모드에서 두 번 실행되지 않도록
  reactStrictMode: false,
};

export default nextConfig;
