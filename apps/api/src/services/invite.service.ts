// src/services/invite.service.ts
import crypto from 'crypto';
import { ParentRole } from '../generated/prisma';
import { InviteRepo } from '../repositories/invite.repo';
import { MembershipRepo } from '../repositories/membership.repo';
import { sendMail, wrapHtml } from '../lib/mailer';
import { MailTemplates } from '../lib/mail-templates';
import { badRequest, forbidden, notFound, HttpError } from '../lib/https';
import { RoleRepo } from '../repositories/role.repo';
import { UserRepo } from '../repositories/user.repo';

// If this is missing, fail fast at boot (infra/config issue).
const AUTH_ORIGIN = process.env.AUTH_ORIGIN!;
if (!AUTH_ORIGIN) throw new Error('AUTH_ORIGIN not configured');

// ---- Result types (only OK variants now; errors are thrown via HttpError) ----
export type CreateInviteOk = { ok: true; invite: any };
export type AcceptOk = { ok: true; orgId: string; unitId?: string | null };

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}
export function generateJoinCode() {
  return `KNW-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export const InvitesService = {
  async createInvite(params: {
    orgId: string;
    requesterEmail: string;
    email: string;
    role?: ParentRole;
    roleId?: string;
    unitId?: string;
    meta?: any;
  }): Promise<CreateInviteOk> {
    const email = params.email.trim().toLowerCase();
    if (email === params.requesterEmail.toLowerCase()) {
      throw badRequest('You cannot invite yourself.');
    }

    // resolve custom role (if provided)
    let roleId: string | null = null;
    let parentRoleFromCustom: ParentRole | null = null;
    if (params.roleId) {
      const custom = await RoleRepo.findroleById(params.orgId, params.roleId);
      if (!custom) throw badRequest('Custom role not found in org');
      roleId = custom.id;
      parentRoleFromCustom = custom.parentRole;
    }

    const effectiveRole: ParentRole | null =
      params.role ?? parentRoleFromCustom ?? null;
    if (!effectiveRole) throw badRequest('Provide role or roleId');

    if (
      params.role &&
      parentRoleFromCustom &&
      params.role !== parentRoleFromCustom
    ) {
      throw badRequest("role must match custom role's parentRole");
    }

    // already a member?
    const existingUser = await UserRepo.findUserWithMembership(
      email,
      params.orgId
    );
    if (existingUser) {
      const already =
        existingUser.memberships && existingUser.memberships.length > 0;
      if (already) {
        // 409 conflict is more correct here; still uses your HttpError.
        throw new HttpError(
          409,
          'User is already a member of this organisation'
        );
      }
    }

    // duplicate pending?
    const dup = await InviteRepo.findDuplicatePending(
      params.orgId,
      email,
      params.unitId ?? null
    );
    if (dup) {
      // 409 conflict with extra context for callers that want it
      const e = new HttpError(
        409,
        'A pending invite already exists for this email (and unit).'
      );
      // @ts-expect-error – tack on context (your global error formatter can expose this safely if desired)
      e.extra = {
        inviteId: dup.id,
        expiresAt: dup.expiresAt,
        joinCode: dup.joinCode ?? undefined,
      };
      throw e;
    }

    // create + email
    const token = generateToken();
    const joinCode = generateJoinCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    const inv = await InviteRepo.create({
      orgId: params.orgId,
      email,
      role: effectiveRole,
      roleId,
      unitId: params.unitId ?? null,
      token,
      joinCode,
      expiresAt,
      meta: params.meta,
    });

    const link = `${AUTH_ORIGIN}/join/${token}`;
    const t = MailTemplates.invite(link, joinCode);
    await sendMail(
      email,
      t.subject,
      wrapHtml({ title: t.subject, bodyHtml: t.html })
    );

    return { ok: true, invite: inv } as const;
  },

  async listInvites(opts: {
    orgId: string;
    where: any;
    orderBy: any[];
    limit: number;
  }): Promise<any[]> {
    const rows = await InviteRepo.list(
      opts.where,
      opts.orderBy,
      opts.limit + 1
    );
    return rows;
  },

  async deleteInvite(inviteId: string) {
    await InviteRepo.delete(inviteId);
  },

  async acceptByToken(
    user: { id: string; email: string },
    token: string
  ): Promise<AcceptOk> {
    const invite = await InviteRepo.findByToken(token);
    if (!invite) throw notFound('Invite not found');
    if (invite.expiresAt < new Date())
      throw new HttpError(410, 'Invite expired');

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw forbidden('Invite is for another email');
    }

    if (invite.unitId) {
      await MembershipRepo.upsertUnitScoped({
        orgId: invite.orgId,
        userId: user.id,
        unitId: invite.unitId,
        role: invite.role,
        roleId: invite.roleId ?? undefined,
      });
    } else {
      await MembershipRepo.updateOrgScopedOrCreate({
        orgId: invite.orgId,
        userId: user.id,
        role: invite.role,
        roleId: invite.roleId ?? undefined,
      });
    }
    if (!invite.acceptedBy) await InviteRepo.markAccepted(invite.id, user.id);
    return { ok: true, orgId: invite.orgId, unitId: invite.unitId } as const;
  },

  async acceptByJoinCode(
    user: { id: string; email: string },
    code: string
  ): Promise<AcceptOk> {
    const invite = await InviteRepo.findByJoinCode(code);
    if (!invite) throw notFound('Code not found');
    if (invite.expiresAt < new Date())
      throw new HttpError(410, 'Invite expired');

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw forbidden('Invite is for another email');
    }

    if (invite.unitId) {
      await MembershipRepo.upsertUnitScoped({
        orgId: invite.orgId,
        userId: user.id,
        unitId: invite.unitId,
        role: invite.role,
        roleId: invite.roleId ?? undefined,
      });
    } else {
      await MembershipRepo.updateOrgScopedOrCreate({
        orgId: invite.orgId,
        userId: user.id,
        role: invite.role,
        roleId: invite.roleId ?? undefined,
      });
    }
    if (!invite.acceptedBy) await InviteRepo.markAccepted(invite.id, user.id);
    return { ok: true, orgId: invite.orgId, unitId: invite.unitId } as const;
  },

  async getInvitePreview(token: string, requestedEmail : string) {
    const inv = await InviteRepo.findPreviewByToken(token);
    if (!inv) throw notFound('Invite not found');

    if (inv.expiresAt && inv.expiresAt < new Date()) {
      throw new HttpError(410, 'Invite expired');
    }

    if (inv.email.toLowerCase() !== requestedEmail.toLowerCase()) { 
      throw forbidden('This invite is for another email')
    }

    return {
      orgId: inv.org.id,
      orgName: inv.org.name,
      unitName: inv.unit?.name ?? null,
      invitedEmail: inv.email,
      parentRole: inv.role,
      roleName: inv.roleRef?.name ?? null,
      expiresAt: inv.expiresAt?.toISOString(),
    };
  },
};
