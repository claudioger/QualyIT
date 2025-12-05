'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, LayoutDashboard, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    icon: Home,
    label: 'Inicio',
  },
  {
    href: '/tasks',
    icon: CheckSquare,
    label: 'Tareas',
  },
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/team',
    icon: Users,
    label: 'Equipo',
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Config',
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-area-inset-bottom">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
