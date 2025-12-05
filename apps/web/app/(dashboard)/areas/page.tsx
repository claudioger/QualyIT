'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AreaTree } from '@/components/areas/area-tree';
import { AreaForm } from '@/components/areas/area-form';
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  type AreaTreeNode,
  type Area,
  type CreateAreaInput,
  type UpdateAreaInput,
} from '@/lib/api/areas';

export default function AreasPage() {
  const { toast } = useToast();
  const { data: areas, isLoading } = useAreas('tree');
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [parentForNew, setParentForNew] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AreaTreeNode | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>(undefined);

  const handleCreate = async (data: CreateAreaInput) => {
    try {
      await createArea.mutateAsync(data);
      setIsFormOpen(false);
      setParentForNew(undefined);
      toast({
        title: 'Área creada',
        description: 'El área se ha creado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el área',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: UpdateAreaInput) => {
    if (!editingArea) return;
    try {
      await updateArea.mutateAsync({ id: editingArea.id, data });
      setEditingArea(null);
      setIsFormOpen(false);
      toast({
        title: 'Área actualizada',
        description: 'Los cambios se han guardado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el área',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArea.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast({
        title: 'Área eliminada',
        description: 'El área se ha eliminado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el área',
        variant: 'destructive',
      });
    }
  };

  const openCreateForm = (parentId?: string) => {
    setEditingArea(null);
    setParentForNew(parentId);
    setIsFormOpen(true);
  };

  const openEditForm = (area: AreaTreeNode) => {
    setEditingArea(area as Area);
    setParentForNew(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Áreas</h1>
          <p className="text-muted-foreground">
            Organiza tu establecimiento en áreas y sub-áreas
          </p>
        </div>
        <Button onClick={() => openCreateForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva área
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estructura de áreas</CardTitle>
          <CardDescription>
            Haz clic en un área para seleccionarla. Usa el menú de acciones para editar, eliminar o agregar sub-áreas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-[90%] ml-6" />
              <Skeleton className="h-10 w-[90%] ml-6" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-[90%] ml-6" />
            </div>
          ) : (
            <AreaTree
              areas={(areas as AreaTreeNode[]) || []}
              selectedId={selectedAreaId}
              onSelect={(area) => setSelectedAreaId(area.id)}
              onEdit={openEditForm}
              onDelete={(area) => setDeleteTarget(area)}
              onAddChild={(area) => openCreateForm(area.id)}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingArea ? 'Editar área' : 'Nueva área'}
            </DialogTitle>
            <DialogDescription>
              {editingArea
                ? 'Modifica los datos del área'
                : 'Completa los datos para crear una nueva área'}
            </DialogDescription>
          </DialogHeader>
          <AreaForm
            area={editingArea || undefined}
            parentId={parentForNew}
            onSubmit={editingArea ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingArea(null);
              setParentForNew(undefined);
            }}
            isSubmitting={createArea.isPending || updateArea.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el área &quot;{deleteTarget?.name}&quot;.
              Las tareas asociadas no serán eliminadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
