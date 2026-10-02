import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Spinner } from '../../components/ui/Spinner';
import { DevelopmentUnitForm } from '../../components/forms/DevelopmentUnitForm';
import { DevelopmentUpdateForm } from '../../components/forms/DevelopmentUpdateForm';
import { useAdminDevelopmentProject, useDevelopmentUnits, useDevelopmentUpdates } from '../../hooks/queries';
import { useDeleteDevelopmentUnit, useDeleteDevelopmentUpdate } from '../../hooks/mutations';
import { useToast } from '../../components/ui/Toast';
import { extractApiError } from '../../services/api';
import { formatPrice, formatDate } from '../../utils/format';
import {
  developmentStatusTone,
  developmentStatusLabel,
  unitStatusTone,
  unitStatusLabel,
} from '../../utils/developmentStatus';
import { CardTable, RowActions, LoadingRows, TableEmpty, thClass, tdClass } from '../../components/dashboard/sections/shared';
import type { DevelopmentUnit, DevelopmentUpdate } from '../../types/development';

export function DevelopmentDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const { notify } = useToast();
  const projectQuery = useAdminDevelopmentProject(id);
  const unitsQuery = useDevelopmentUnits(id);
  const updatesQuery = useDevelopmentUpdates(id);

  const [unitFormOpen, setUnitFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<DevelopmentUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<DevelopmentUnit | null>(null);

  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<DevelopmentUpdate | null>(null);
  const [deletingUpdate, setDeletingUpdate] = useState<DevelopmentUpdate | null>(null);

  const deleteUnit = useDeleteDevelopmentUnit();
  const deleteUpdate = useDeleteDevelopmentUpdate();

  const project = projectQuery.data;
  const units = unitsQuery.data ?? [];
  const updates = updatesQuery.data ?? [];

  const confirmDeleteUnit = async () => {
    if (!deletingUnit) return;
    try {
      await deleteUnit.mutateAsync({ projectId: id, unitId: deletingUnit.id });
      notify({ type: 'success', title: 'Unit deleted', description: `"${deletingUnit.unitIdentifier}" was removed.` });
      setDeletingUnit(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not delete unit', description: extractApiError(err) });
    }
  };

  const confirmDeleteUpdate = async () => {
    if (!deletingUpdate) return;
    try {
      await deleteUpdate.mutateAsync({ projectId: id, updateId: deletingUpdate.id });
      notify({ type: 'success', title: 'Update deleted', description: `"${deletingUpdate.title}" was removed.` });
      setDeletingUpdate(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not delete update', description: extractApiError(err) });
    }
  };

  if (projectQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8 text-forest-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink-500">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Developments', to: '/dashboard/developments' },
          { label: project.name },
        ]}
      />

      {/* Project summary */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="heading-3">{project.name}</h1>
            <p className="mt-1 text-sm text-ink-500">{project.location}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={developmentStatusTone(project.status)}>{developmentStatusLabel(project.status)}</Badge>
            <a
              href={`/developments/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-forest-600"
              title="View public page"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-ink-400">Progress</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-forest-500 transition-all"
                  style={{ width: `${project.progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-ink-700">{project.progressPercentage}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Developer</p>
            <p className="mt-1 text-sm font-medium text-ink-700">{project.developer ?? 'â€”'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Expected Completion</p>
            <p className="mt-1 text-sm font-medium text-ink-700">
              {project.expectedCompletionDate ? formatDate(project.expectedCompletionDate) : 'â€”'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Featured</p>
            <p className="mt-1 text-sm font-medium text-ink-700">{project.featured ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </Card>

      {/* Units */}
      <CardTable
        title={`Units (${units.length})`}
        actions={
          <Button variant="primary" size="sm" onClick={() => { setEditingUnit(null); setUnitFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Add Unit
          </Button>
        }
      >
        {unitsQuery.isLoading ? (
          <LoadingRows rows={3} />
        ) : units.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>Identifier</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Price</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {units.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-ink-50/60">
                    <td className={tdClass}>
                      <span className="font-medium text-ink-900">{u.unitIdentifier}</span>
                    </td>
                    <td className={tdClass}>{u.unitType}</td>
                    <td className={tdClass}>
                      <Badge tone={unitStatusTone(u.status)}>{unitStatusLabel(u.status)}</Badge>
                    </td>
                    <td className={tdClass}>
                      {u.price != null ? formatPrice(u.price, u.currency) : 'â€”'}
                    </td>
                    <td className={tdClass}>
                      <RowActions
                        onEdit={() => { setEditingUnit(u); setUnitFormOpen(true); }}
                        onDelete={() => setDeletingUnit(u)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardTable>

      {/* Updates */}
      <CardTable
        title={`Project Updates (${updates.length})`}
        actions={
          <Button variant="primary" size="sm" onClick={() => { setEditingUpdate(null); setUpdateFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Post Update
          </Button>
        }
      >
        {updatesQuery.isLoading ? (
          <LoadingRows rows={3} />
        ) : updates.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>Title</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Progress</th>
                  <th className={thClass}>Images</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {updates.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-ink-50/60">
                    <td className={tdClass}>
                      <span className="font-medium text-ink-900">{u.title}</span>
                      <span className="block max-w-md truncate text-xs text-ink-400">{u.description}</span>
                    </td>
                    <td className={tdClass}>{formatDate(u.updateDate)}</td>
                    <td className={tdClass}>
                      {u.progressPercentage != null ? `${u.progressPercentage}%` : 'â€”'}
                    </td>
                    <td className={tdClass}>{u.imageUrls.length}</td>
                    <td className={tdClass}>
                      <RowActions
                        onEdit={() => { setEditingUpdate(u); setUpdateFormOpen(true); }}
                        onDelete={() => setDeletingUpdate(u)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardTable>

      {/* Modals */}
      <DevelopmentUnitForm open={unitFormOpen} projectId={id} unit={editingUnit} onClose={() => { setUnitFormOpen(false); setEditingUnit(null); }} />
      <DevelopmentUpdateForm open={updateFormOpen} projectId={id} update={editingUpdate} onClose={() => { setUpdateFormOpen(false); setEditingUpdate(null); }} />

      <ConfirmDialog
        open={Boolean(deletingUnit)}
        title="Delete unit"
        description={`Are you sure you want to delete "${deletingUnit?.unitIdentifier}"?`}
        confirmLabel="Delete unit"
        loading={deleteUnit.isPending}
        onConfirm={confirmDeleteUnit}
        onCancel={() => setDeletingUnit(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingUpdate)}
        title="Delete update"
        description={`Are you sure you want to delete "${deletingUpdate?.title}"?`}
        confirmLabel="Delete update"
        loading={deleteUpdate.isPending}
        onConfirm={confirmDeleteUpdate}
        onCancel={() => setDeletingUpdate(null)}
      />
    </div>
  );
}
