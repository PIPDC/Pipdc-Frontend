import type { ReactNode } from 'react';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { Pagination } from '../../ui/Pagination';

export const thClass = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400';
export const tdClass = 'px-4 py-3 text-sm text-ink-700';

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-3 sm:p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
      ))}
    </div>
  );
}

export function TableEmpty() {
  return <EmptyState title="Nothing here yet" description="Data will appear here once records are added." />;
}

interface CardTableProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function CardTable({ title, actions, children }: CardTableProps) {
  return (
    <Card>
      {/*
        Wraps on narrow screens: the title and the filter/actions cluster sit
        side by side above `sm`, which squeezes both once the filter row grows.
      */}
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{title}</CardTitle>
        {actions}
      </CardHeader>
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

interface RowActionsProps {
  viewUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

export function RowActions({ viewUrl, onEdit, onDelete, deleteDisabled }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {viewUrl && (
        <a
          href={viewUrl}
          title="View"
          className="rounded-lg p-2.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          className="rounded-lg p-2.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          disabled={deleteDisabled}
          className="rounded-lg p-2.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface SectionFooterProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function SectionFooter({ pageNumber, pageSize, totalCount, onPageChange }: SectionFooterProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalCount === 0) return null;

  const from = (pageNumber - 1) * pageSize + 1;
  const to = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3 border-t border-ink-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-ink-500">
        Showing <span className="font-medium text-ink-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-ink-700">{totalCount}</span> results
      </span>
      <Pagination page={pageNumber} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
