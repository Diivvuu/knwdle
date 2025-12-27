import { NextFunction, Request, Response } from 'express';

export function requireAudienceAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { orgId, audienceId } = req.params;
    const userId = (req as any).user?.id;

    if (!orgId || !audienceId) {
      return res.status(400).json({ error: 'Missing orgId or audienceId' });
    }

    //org admin shortcut
    const orgAdmin = await prisma?.orgMembership.findFirst({
      where: {
        orgId,
        userId,
        audienceId: null,
        role: 'admin',
      },
      select: { id: true },
    });
    if (orgAdmin) return next();

    //audience scoped access
    const hasAccess = await prisma?.orgMembership.findFirst({
      where: {
        orgId,
        userId,
        audienceId,
      },
      select: { id: true },
    });

    if (!hasAccess) {
    return res.status(403).json({ error: 'No access to this audience' });
    }
  };
}
