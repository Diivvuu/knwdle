// src/lib/pagination.ts

/** Encode a stable cursor (createdAt,id) to base64url JSON */
export function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id })
  ).toString('base64url');
}

/** Decode a base64url JSON cursor back to { createdAt: Date, id: string } */
export function decodeCursor(raw?: string | null) {
  if (!raw) return null;
  try {
    const { createdAt, id } = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8')
    );
    const dt = new Date(createdAt);
    if (!createdAt || !id || Number.isNaN(dt.getTime())) return null;
    return { createdAt: dt, id: String(id) };
  } catch {
    return null;
  }
}

/** Clamp a limit safely with defaults */
export function clampLimit(n: unknown, def = 20, max = 100) {
  const x = Number.parseInt(String(n ?? def), 10);
  return Number.isNaN(x) || x <= 0 ? def : Math.min(x, max);
}

/**
 * Build a Prisma WHERE clause for stable cursor pagination on (createdAt, id).
 * Use with orderBy = [{ createdAt: sortDir }, { id: sortDir }]
 */
export function buildCursorWhere(
  cursor: ReturnType<typeof decodeCursor> | null,
  sortDir: 'asc' | 'desc' = 'desc'
) {
  if (!cursor) return undefined;
  return {
    OR: [
      {
        createdAt:
          sortDir === 'desc'
            ? { lt: cursor.createdAt }
            : { gt: cursor.createdAt },
      },
      {
        AND: [
          { createdAt: cursor.createdAt },
          {
            id: sortDir === 'desc' ? { lt: cursor.id } : { gt: cursor.id },
          },
        ],
      },
    ],
  } as const;
}


export function stableOrder(sortDir: 'asc' | 'desc' = 'desc') {
  // return a mutable array instead of a readonly tuple
  return [
    { createdAt: sortDir },
    { id: sortDir },
  ] as Array<Record<string, 'asc' | 'desc'>>;
}