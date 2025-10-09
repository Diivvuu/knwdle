export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        memberships?: { orgId: string; role: string };
      };
    }
  }
}
