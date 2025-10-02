// apps/web/src/components/create-org/SchemaFields.tsx
'use client';

import * as React from 'react';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@workspace/ui/components/select';

export default function SchemaFields({
  schemaFields,
  details,
  onChange,
}: {
  schemaFields: { key: string; schema: any; required: boolean }[];
  details: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {schemaFields.map(({ key, schema, required }) => {
        if (key === 'description') {
          return (
            <div className="space-y-2 sm:col-span-2" key={key}>
              <Label>Description{required ? ' *' : ''}</Label>
              <Textarea
                rows={4}
                placeholder="Brief summary…"
                value={details[key] ?? ''}
                onChange={(e) => onChange(key, e.target.value)}
                maxLength={schema?.maxLength ?? undefined}
              />
              {schema?.maxLength ? (
                <p className="text-xs text-muted-foreground">
                  {String(details[key]?.length || 0)}/{schema.maxLength}
                </p>
              ) : null}
            </div>
          );
        }
        // enums
        if (schema?.enum && Array.isArray(schema.enum)) {
          return (
            <div className="space-y-2" key={key}>
              <Label className="capitalize">
                {key}
                {required ? ' *' : ''}
              </Label>
              <Select
                value={details[key] ?? ''}
                onValueChange={(v) => onChange(key, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {schema.enum.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        // boolean
        if (schema?.type === 'boolean') {
          return (
            <div
              className="flex items-center justify-between rounded-xl border p-3"
              key={key}
            >
              <div>
                <Label className="capitalize">
                  {key}
                  {required ? ' *' : ''}
                </Label>
                {schema?.description && (
                  <p className="text-xs text-muted-foreground">
                    {schema.description}
                  </p>
                )}
              </div>
              <Switch
                checked={Boolean(details[key])}
                onCheckedChange={(v) => onChange(key, v)}
              />
            </div>
          );
        }

        // integer/number
        if (schema?.type === 'integer' || schema?.type === 'number') {
          return (
            <div className="space-y-2" key={key}>
              <Label className="capitalize">
                {key}
                {required ? ' *' : ''}
              </Label>
              <Input
                type="number"
                value={details[key] ?? ''}
                onChange={(e) =>
                  onChange(
                    key,
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                min={schema?.minimum ?? undefined}
                max={schema?.maximum ?? undefined}
              />
            </div>
          );
        }

        // arrays (CSV)
        if (schema?.type === 'array') {
          return (
            <div className="space-y-2" key={key}>
              <Label className="capitalize">
                {key}
                {required ? ' *' : ''}
              </Label>
              <Input
                placeholder="Comma-separated"
                value={
                  Array.isArray(details[key])
                    ? details[key].join(', ')
                    : (details[key] ?? '')
                }
                onChange={(e) =>
                  onChange(
                    key,
                    e.target.value
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean)
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter comma-separated values
              </p>
            </div>
          );
        }

        // string
        return (
          <div className="space-y-2" key={key}>
            <Label className="capitalize">
              {key}
              {required ? ' *' : ''}
            </Label>
            <Input
              value={details[key] ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={schema?.placeholder ?? ''}
              maxLength={schema?.maxLength ?? undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
