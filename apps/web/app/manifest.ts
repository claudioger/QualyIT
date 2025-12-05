import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QualyIT - Gestión de Calidad',
    short_name: 'QualyIT',
    description: 'Sistema de gestión de calidad para hotelería',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    lang: 'es-AR',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Tareas del día',
      },
    ],
    shortcuts: [
      {
        name: 'Mis Tareas',
        url: '/',
        icons: [{ src: '/icons/tasks-shortcut.png', sizes: '96x96' }],
      },
      {
        name: 'Dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard-shortcut.png', sizes: '96x96' }],
      },
    ],
  };
}
