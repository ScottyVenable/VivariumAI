import { NextRequest, NextResponse } from 'next/server';
import { runTick, startTickLoop, stopTickLoop, isTickLoopRunning, getActiveTimelineId } from '@/lib/tick';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    running: isTickLoopRunning() && getActiveTimelineId() === id,
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await _req.json().catch(() => ({})) as { running?: boolean };

    if (body.running === true) {
      startTickLoop(id);
      return NextResponse.json({ running: true });
    }

    if (body.running === false) {
      stopTickLoop();
      return NextResponse.json({ running: false });
    }

    // No body or unknown → run a single manual tick
    const result = await runTick(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Tick error:', err);
    return NextResponse.json({ error: 'Tick failed' }, { status: 500 });
  }
}
