import { NextRequest, NextResponse } from 'next/server';
import {
  runTickWithStatus,
  startTickLoop,
  stopTickLoop,
  isTickLoopRunning,
  getActiveTimelineId,
  getTickRuntimeStatus,
} from '@/lib/tick';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const status = getTickRuntimeStatus(id);
  return NextResponse.json({
    running: isTickLoopRunning() && getActiveTimelineId() === id,
    llm: status,
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
    const result = await runTickWithStatus(id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Tick error:', err);
    return NextResponse.json({ error: 'Tick failed' }, { status: 500 });
  }
}
