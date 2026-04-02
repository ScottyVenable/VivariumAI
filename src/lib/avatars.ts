import { prisma } from './db';
import path from 'path';
import fs from 'fs';

function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function initializeImagePool(): Promise<void> {
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  let imageFiles: string[] = [];
  if (fs.existsSync(avatarsDir)) {
    imageFiles = fs.readdirSync(avatarsDir)
      .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f) && f !== 'default.svg');
  }

  const existing = await prisma.imagePool.findUnique({ where: { id: 'singleton' } });
  
  if (!existing) {
    await prisma.imagePool.create({
      data: {
        id: 'singleton',
        availableImages: JSON.stringify(imageFiles),
        usedImages: JSON.stringify([]),
      },
    });
  }
}

export async function claimAvatar(): Promise<string> {
  const pool = await prisma.imagePool.findUnique({ where: { id: 'singleton' } });
  
  if (!pool) {
    await initializeImagePool();
    return '/avatars/default.svg';
  }

  let available: string[] = JSON.parse(pool.availableImages);
  let used: string[] = JSON.parse(pool.usedImages);

  if (available.length === 0) {
    if (used.length === 0) return '/avatars/default.svg';
    available = fisherYatesShuffle(used);
    used = [];
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const claimed = available[randomIndex];
  available.splice(randomIndex, 1);
  used.push(claimed);

  await prisma.imagePool.update({
    where: { id: 'singleton' },
    data: {
      availableImages: JSON.stringify(available),
      usedImages: JSON.stringify(used),
    },
  });

  return `/avatars/${claimed}`;
}
