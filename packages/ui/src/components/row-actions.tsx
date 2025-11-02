'use client';

import * as React from 'react';
import { Button } from './button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

type RowActionsProps = {
  /** Called when view button clicked */
  onView?: () => void;
  /** Called when edit button clicked */
  onEdit?: () => void;
  /** Called when delete button clicked */
  onDelete?: () => void;
  /** Disable all buttons if needed */
  disabled?: boolean;
  /** Optional className for wrapper */
  className?: string;
};

/**
 * Simple reusable inline row actions: View / Edit / Delete
 * Used in tables across pages — consistent style everywhere.
 */
export function RowActions({
  onView,
  onEdit,
  onDelete,
  disabled,
  className,
}: RowActionsProps) {
  return (
    <div className={cn('flex justify-end gap-1.5', className)}>
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md hover:bg-muted"
          disabled={disabled}
          onClick={onView}
          aria-label="View"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md hover:bg-muted"
          disabled={disabled}
          onClick={onEdit}
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md text-destructive hover:bg-destructive/10"
          disabled={disabled}
          onClick={onDelete}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}