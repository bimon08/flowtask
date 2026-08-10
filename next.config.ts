/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  fallbacks: {
    document: '/offline.html',
  },
});

const nextConfig = withPWA({
  reactStrictMode: true,
  // Empty turbopack config to silence the webpack/turbopack mismatch error.
  // next-pwa uses webpack; Turbopack is enabled by default in Next.js 16.
  turbopack: {},
});

module.exports = nextConfig;
