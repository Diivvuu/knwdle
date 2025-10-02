export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        memberships?: { orgId: string; role: string };
      };
    }
  }
}
