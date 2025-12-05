'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/lib/api/users';
import { useAreas, type Area, type CreateAreaInput, type UpdateAreaInput } from '@/lib/api/areas';
import { Loader2 } from 'lucide-react';

const areaFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  code: z.string().max(10, 'El código no puede tener más de 10 caracteres').optional(),
  parentId: z.string().optional(),
  responsibleId: z.string().optional(),
  backupResponsibleId: z.string().optional(),
  sortOrder: z.coerce.number().min(0).optional(),
});

type AreaFormValues = z.infer<typeof areaFormSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormSubmitHandler = (data: any) => Promise<void>;

interface AreaFormProps {
  area?: Area;
  parentId?: string;
  onSubmit: FormSubmitHandler;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AreaForm({
  area,
  parentId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AreaFormProps) {
  const { data: areas } = useAreas('flat');
  const { data: usersData } = useUsers({ pageSize: 100 });
  const users = usersData?.items || [];

  // Filter out the current area and its descendants from parent options
  const availableParents = (areas as Area[] | undefined)?.filter((a) => {
    if (area && a.id === area.id) return false;
    // TODO: Also filter out descendants to prevent circular references
    return true;
  });

  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: area?.name || '',
      code: area?.code || '',
      parentId: area?.parentId || parentId || undefined,
      responsibleId: area?.responsibleId || undefined,
      backupResponsibleId: area?.backupResponsibleId || undefined,
      sortOrder: area?.sortOrder || 0,
    },
  });

  const handleSubmit = async (values: AreaFormValues) => {
    const data = {
      name: values.name,
      code: values.code || undefined,
      parentId: values.parentId || undefined,
      responsibleId: values.responsibleId || undefined,
      backupResponsibleId: values.backupResponsibleId || undefined,
      sortOrder: values.sortOrder,
    };

    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del área *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cocina, Recepción, Housekeeping" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Ej: COC, REC, HK" {...field} />
              </FormControl>
              <FormDescription>
                Código corto para identificar el área rápidamente
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Área padre</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin área padre (nivel raíz)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Sin área padre</SelectItem>
                  {availableParents?.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name} {parent.code && `(${parent.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Selecciona un área padre si esta es una sub-área
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="responsibleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar responsable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin responsable</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="backupResponsibleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable suplente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar suplente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin suplente</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orden de visualización</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormDescription>
                Las áreas con número menor aparecen primero
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {area ? 'Guardar cambios' : 'Crear área'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
