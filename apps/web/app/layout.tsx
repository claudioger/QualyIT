import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { esES } from '@clerk/localizations';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'QualyIT - Gestión de Calidad',
    template: '%s | QualyIT',
  },
  description: 'Sistema de gestión de calidad para hotelería. Controla tareas operativas, reporta problemas y mejora el cumplimiento de tu organización.',
  keywords: ['gestión de calidad', 'hotelería', 'tareas operativas', 'checklist', 'compliance', 'control de calidad'],
  authors: [{ name: 'QualyIT' }],
  creator: 'QualyIT',
  publisher: 'QualyIT',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QualyIT',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'QualyIT',
    title: 'QualyIT - Gestión de Calidad para Hotelería',
    description: 'Sistema de gestión de calidad para hotelería. Controla tareas operativas, reporta problemas y mejora el cumplimiento de tu organización.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QualyIT - Gestión de Calidad',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QualyIT - Gestión de Calidad',
    description: 'Sistema de gestión de calidad para hotelería',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563eb',
};

// Check if Clerk is configured
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!hasClerkKey) {
    // During build without Clerk credentials, render without auth
    return <>{children}</>;
  }
  return <ClerkProvider localization={esES}>{children}</ClerkProvider>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviderWrapper>
      <html lang="es" suppressHydrationWarning>
        <head>
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <QueryProvider>
            <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
          </QueryProvider>
        </body>
      </html>
    </AuthProviderWrapper>
  );
}
