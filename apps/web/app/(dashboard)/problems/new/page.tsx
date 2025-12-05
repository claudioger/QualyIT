'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  ChevronLeft,
  AlertTriangle,
  Camera,
  MapPin,
  Send,
} from 'lucide-react';
import Link from 'next/link';

interface Area {
  id: string;
  name: string;
  code: string;
}

const severityOptions = [
  { value: 'low', label: 'Baja', description: 'No urgente, puede esperar', color: 'border-gray-300 bg-gray-50' },
  { value: 'medium', label: 'Media', description: 'Requiere atención pronto', color: 'border-blue-300 bg-blue-50' },
  { value: 'high', label: 'Alta', description: 'Urgente, afecta operación', color: 'border-orange-300 bg-orange-50' },
  { value: 'critical', label: 'Crítica', description: 'Muy urgente, paro de operación', color: 'border-red-300 bg-red-50' },
];

export default function NewProblemPage() {
  const router = useRouter();

  const [areaId, setAreaId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [useLocation, setUseLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: areasData } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const response = await api.get<{ items: Area[] }>('/areas');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      areaId: string;
      title: string;
      description?: string;
      severity: string;
      photoUrls?: string[];
      latitude?: number;
      longitude?: number;
    }) => {
      const response = await api.post('/problems', data);
      return response.data;
    },
    onSuccess: () => {
      router.push('/problems');
    },
  });

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setUseLocation(true);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleSubmit = () => {
    if (!areaId || !title || !severity) return;

    createMutation.mutate({
      areaId,
      title,
      description: description || undefined,
      severity,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      latitude: location?.lat,
      longitude: location?.lng,
    });
  };

  const areas = areasData?.items ?? [];
  const canSubmit = areaId && title && severity;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="flex items-center gap-3">
          <Link href="/problems" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h1 className="font-semibold">Reportar problema</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {/* Area Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Área <span className="text-red-500">*</span>
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Seleccionar área</option>
              {areas.map((area: Area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.code})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describa brevemente el problema"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proporcione más detalles sobre el problema..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Severidad <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {severityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    severity === option.value
                      ? `${option.color} border-2`
                      : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Fotos
            </label>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-5 w-5" />
              <span>Agregar foto del problema</span>
            </button>
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Ubicación
            </label>
            <button
              onClick={handleGetLocation}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm ${
                location
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span>
                {location ? 'Ubicación capturada' : 'Capturar ubicación actual'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-20 p-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Reportar problema</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
