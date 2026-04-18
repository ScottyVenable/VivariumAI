'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, Plus, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: null, label: 'Search', icon: Search },
  { href: null, label: 'Create', icon: Plus, isPrimary: true },
  { href: null, label: 'Notifications', icon: Bell },
  { href: null, label: 'Profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-900 bg-black/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur md:hidden"
      aria-label="Main navigation"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-center gap-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.href !== null && (pathname === item.href || pathname.startsWith('/timeline/'));
          const isDisabled = item.href === null;

          if (isDisabled) {
            return (
              <li key={item.label} className="flex justify-center">
                <span
                  aria-label={`${item.label} (coming soon)`}
                  aria-disabled="true"
                  role="link"
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 cursor-not-allowed',
                    item.isPrimary && 'border border-zinc-800 bg-zinc-900 text-zinc-600'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </li>
            );
          }

          return (
            <li key={item.label} className="flex justify-center">
              <Link
                href={item.href}
                aria-label={item.label}
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors',
                  item.isPrimary
                    ? 'border border-zinc-700 bg-zinc-100 text-black hover:bg-white'
                    : 'hover:bg-zinc-900 hover:text-zinc-200',
                  isActive && !item.isPrimary && 'text-zinc-100'
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