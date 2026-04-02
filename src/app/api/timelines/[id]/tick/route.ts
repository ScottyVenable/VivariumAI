import { NextRequest, NextResponse } from 'next/server';
import { runTick } from '@/lib/tick';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await runTick(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Tick error:', err);
    return NextResponse.json({ error: 'Tick failed' }, { status: 500 });
  }
}
