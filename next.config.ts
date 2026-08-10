import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,           // always register SW (dev + prod)
  workboxOptions: {
    disableDevLogs: true,
  },
  fallbacks: {
    document: '/offline.html',
  },
});

const nextConfig = withPWA({
  reactStrictMode: true,
});

export default nextConfig;
