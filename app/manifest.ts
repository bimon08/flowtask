import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlowTask',
    short_name: 'FlowTask',
    description: 'Frictionless micro-task tracking — hours, days, one week.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#111111',
    theme_color: '#111111',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
