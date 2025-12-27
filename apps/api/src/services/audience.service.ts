import { AudienceLevel } from '../generated/prisma';
import { badRequest, notFound } from '../lib/https';
import { AudienceRepo } from '../repositories/audience.repo';

export const AudienceService = {
  async create(orgId: string, body: any) {
    const existing = await AudienceRepo.findByName(orgId, body.name);

    if (existing) {
      throw badRequest('Audience name must be unique withing organisation');
    }

    let parentId: string | null = body.parentId ?? null;
    let level: AudienceLevel = parentId ? 'LEAF' : 'PARENT';

    if (parentId) {
      const parent = await AudienceRepo.findById(orgId, parentId);
      if (!parent) throw badRequest('Invalid parent audience');
    }

    return AudienceRepo.create({
      orgId,
      name: body.name,
      type: body.type,
      parentId,
      isExclusive: body.isExclusive ?? false,
      meta: body.meta ?? {},
      level,
    });
  },

  async list(orgId: string, query: any) {
    if (query.tree === 'true') {
      return AudienceRepo.listTree(orgId);
    }

    return AudienceRepo.listFlat({
      orgId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
    });
  },

  async get(orgId: string, audienceId: string) {
    const audience = await AudienceRepo.findById(orgId, audienceId);
    if (!audience) throw notFound('Audience not found');
    return audience;
  },

  async update(orgId: string, audienceId: string, body: any) {
    const audience = await AudienceRepo.findById(orgId, audienceId);
    if (!audience) throw notFound('Audience not found');

    // Prevent toggling exclusivity after creation
    if (
      Object.prototype.hasOwnProperty.call(body, 'isExclusive') &&
      body.isExclusive !== audience.isExclusive
    ) {
      throw badRequest('Student exclusivity cannot be changed after creation');
    }

    if (body.name && body.name !== audience.name) {
      const exists = await AudienceRepo.findByName(orgId, body.name);
      if (exists) throw badRequest('Audience name must be unique');
    }

    return AudienceRepo.update(audienceId, {
      name: body.name,
      // keep original exclusivity
      isExclusive: audience.isExclusive,
      meta: body.meta,
    });
  },

  async remove(orgId: string, audienceId: string) {
    const audience = await AudienceRepo.findById(orgId, audienceId);
    if (!audience) throw notFound('Audience not found');

    const children = await AudienceRepo.countChildren(audienceId);
    if (children > 0) {
      throw badRequest('Cannot delete audience with child audiences');
    }

    const members = await AudienceRepo.countMembers(audienceId);
    if (members) {
      throw badRequest('Cannot delete audience with members');
    }

    await AudienceRepo.delete(audienceId);
  },
};
