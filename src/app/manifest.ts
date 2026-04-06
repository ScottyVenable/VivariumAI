import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VivariumAI',
    short_name: 'Vivarium',
    description: 'A mobile-ready multi-agent social simulation.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/vivarium-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/vivarium-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
