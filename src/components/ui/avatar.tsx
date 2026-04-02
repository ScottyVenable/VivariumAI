import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 40, className }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!src || src === '/avatars/default.svg') {
    return (
      <div
        className={cn(
          'rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold select-none',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-full overflow-hidden flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        unoptimized
      />
    </div>
  );
}
