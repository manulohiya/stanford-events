/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.stanford.edu' },
      { protocol: 'https', hostname: 'hai.stanford.edu' },
    ],
  },
};

module.exports = nextConfig;
