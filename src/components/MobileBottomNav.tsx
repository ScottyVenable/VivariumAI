'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, Plus, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '#', label: 'Search', icon: Search },
  { href: '#', label: 'Create', icon: Plus, isPrimary: true },
  { href: '#', label: 'Notifications', icon: Bell },
  { href: '#', label: 'Profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-black/95 px-2 pb-[max(env(safe-area-inset-bottom),0.6rem)] pt-2 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5 items-center gap-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.href !== '#' && (pathname === item.href || pathname.startsWith('/timeline/'));

          return (
            <li key={item.label} className="flex justify-center">
              <Link
                href={item.href}
                aria-label={item.label}
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-2xl text-zinc-500 transition',
                  item.isPrimary
                    ? 'h-12 w-12 rounded-full border border-zinc-700 bg-white text-black hover:bg-zinc-100'
                    : 'border border-transparent hover:bg-zinc-900 hover:text-white',
                  isActive && !item.isPrimary && 'text-white'
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
