'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/store';
import { toast } from 'sonner';
import { createOrg } from '@workspace/state';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Building2,
  Target,
  BookOpen,
  GraduationCap,
  Laptop,
  Briefcase,
  Heart,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { TeamSizePicker } from '@/_components/team-size-picker';
import { OrgTypePicker } from '@workspace/ui/components/app/type-picker';

type OrgTypeKey =
  | 'SCHOOL'
  | 'COACHING_CENTER'
  | 'TUITION_CENTER'
  | 'COLLEGE'
  | 'UNIVERSITY'
  | 'EDTECH'
  | 'TRAINING'
  | 'NGO'
  | '';

const ORG_TEMPLATES = [
  {
    key: 'SCHOOL',
    name: 'School',
    icon: Building2,
    tagline: 'Classes, teachers & parents',
  },
  {
    key: 'COACHING_CENTER',
    name: 'Coaching Center',
    icon: Target,
    tagline: 'Focused test prep batches',
  },
  {
    key: 'TUITION_CENTER',
    name: 'Tuition Center',
    icon: BookOpen,
    tagline: 'Neighborhood tutoring setup',
  },
  {
    key: 'COLLEGE',
    name: 'College / University',
    icon: GraduationCap,
    tagline: 'Departments & faculties',
  },
  {
    key: 'UNIVERSITY',
    name: 'University',
    icon: GraduationCap,
    tagline: 'Higher education ecosystem',
  },
  {
    key: 'EDTECH',
    name: 'EdTech',
    icon: Laptop,
    tagline: 'Online learning platform',
  },
  {
    key: 'TRAINING',
    name: 'Training',
    icon: Briefcase,
    tagline: 'Professional or skill courses',
  },
  {
    key: 'NGO',
    name: 'NGO',
    icon: Heart,
    tagline: 'Commaudiencey or volunteer group',
  },
];

export default function CreateOrgPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [name, setName] = useState('');
  const [orgType, setOrgType] = useState<OrgTypeKey>('SCHOOL');
  const [teamSize, setTeamSize] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const trimmedName = name.trim();
  const nameValid = trimmedName.length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!nameValid) {
      toast.error('Organisation name must be at least 2 characters.');
      return;
    }
    if (!orgType) {
      toast.error('Select an organisation type.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        type: orgType,
        teamSize: teamSize || undefined,
      };
      const action = await dispatch(createOrg(payload as any));
      if (createOrg.fulfilled.match(action)) {
        toast.success('Organisation created');
        router.push('/dashboard');
      } else {
        throw new Error(action.error.message || 'Create org failed');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Create org failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create organisation
          </h1>
          <p className="text-sm text-muted-foreground">
            Basic details only. You can add more info later in settings.
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>
              Organisation name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greenwood College"
            />
            {!nameValid && (attemptedSubmit || name.length > 0) && (
              <p className="text-xs text-destructive">Minimum 2 characters.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Organisation type <span className="text-destructive">*</span>
            </Label>
            <OrgTypePicker
              value={orgType}
              onChange={(val) => setOrgType(val)}
              templates={ORG_TEMPLATES as any}
            />
          </div>

          <div className="space-y-2">
            <Label>Team size (optional)</Label>
            <TeamSizePicker value={teamSize} onChange={setTeamSize} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create organisation
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
