import { Request, Response } from 'express';

type Client = { id: string; res: Response };
const streams = new Map<string, Set<Client>>();

export function sseAttach(req: Request, res: Response, batchId: string) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const client: Client = { id: Math.random().toString(36).slice(2), res };
  if (!streams.has(batchId)) streams.set(batchId, new Set());
  streams.get(batchId)!.add(client);

  const hb = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {}
  }, 15000);

  const cleanup = () => {
    clearInterval(hb);
    streams.get(batchId)?.delete(client);
    if (streams.get(batchId)?.size === 0) streams.delete(batchId);
  };
  res.on('close', cleanup);
  res.on('finish', cleanup);
}

export function ssePush(batchId: string, event: string, data: any) {
  const set = streams.get(batchId);
  if (!set) return;
  const payload = `event ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of set) {
    try {
      c.res.write(payload);
    } catch {}
  }
}
