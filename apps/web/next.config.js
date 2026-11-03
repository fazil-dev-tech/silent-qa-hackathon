/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/shop',
        destination: '/shop/index.html',
      },
      {
        source: '/shop/',
        destination: '/shop/index.html',
      },
    ];
  },
};

export default nextConfig;
