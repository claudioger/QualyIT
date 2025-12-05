'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Building2, ChevronRight, Check, AlertCircle } from 'lucide-react';

type Step = 'organization' | 'areas' | 'complete';

interface AreaInput {
  name: string;
  code: string;
}

const defaultAreas: AreaInput[] = [
  { name: 'Recepción', code: 'RECEP' },
  { name: 'Housekeeping', code: 'HOUSE' },
  { name: 'Restaurante', code: 'REST' },
  { name: 'Mantenimiento', code: 'MANT' },
  { name: 'Piscina y Spa', code: 'SPA' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>('organization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Organization data
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  // Areas data
  const [areas, setAreas] = useState<AreaInput[]>(defaultAreas);

  const checkSubdomainAvailability = async (value: string) => {
    if (value.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setCheckingSubdomain(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/tenants/check-subdomain?subdomain=${value}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSubdomainAvailable(data.data?.available ?? false);
    } catch {
      setSubdomainAvailable(null);
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(normalized);
    setSubdomainAvailable(null);

    // Debounce check
    const timeoutId = setTimeout(() => {
      checkSubdomainAvailability(normalized);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleCreateOrganization = async () => {
    if (!orgName || !subdomain || !subdomainAvailable) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: orgName, subdomain }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Error al crear la organización');
        return;
      }

      setStep('areas');
    } catch {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (index: number, field: 'name' | 'code', value: string) => {
    const updated = [...areas];
    updated[index] = { ...updated[index], [field]: value };
    setAreas(updated);
  };

  const addArea = () => {
    setAreas([...areas, { name: '', code: '' }]);
  };

  const removeArea = (index: number) => {
    setAreas(areas.filter((_, i) => i !== index));
  };

  const handleCreateAreas = async () => {
    const validAreas = areas.filter((a) => a.name && a.code);
    if (validAreas.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      // Create areas sequentially
      for (const area of validAreas) {
        await fetch('/api/areas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(area),
        });
      }

      setStep('complete');
    } catch {
      setError('Error al crear las áreas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div
            className={`h-2 w-16 rounded-full ${
              step === 'organization' ? 'bg-primary' : 'bg-primary/30'
            }`}
          />
          <div
            className={`h-2 w-16 rounded-full ${
              step === 'areas' ? 'bg-primary' : step === 'complete' ? 'bg-primary/30' : 'bg-muted'
            }`}
          />
          <div
            className={`h-2 w-16 rounded-full ${
              step === 'complete' ? 'bg-primary' : 'bg-muted'
            }`}
          />
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-lg">
          {step === 'organization' && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-xl font-semibold">Crear organización</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure su hotel o establecimiento
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Nombre del hotel
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Hotel Paradise"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Subdominio
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      className={`flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        subdomainAvailable === true
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : subdomainAvailable === false
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'focus:border-primary focus:ring-primary'
                      }`}
                      placeholder="paradise"
                    />
                    <span className="text-sm text-muted-foreground">.qualyit.app</span>
                  </div>
                  {checkingSubdomain && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Verificando disponibilidad...
                    </p>
                  )}
                  {!checkingSubdomain && subdomainAvailable === true && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" /> Disponible
                    </p>
                  )}
                  {!checkingSubdomain && subdomainAvailable === false && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" /> No disponible
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreateOrganization}
                  disabled={loading || !orgName || !subdomain || !subdomainAvailable}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Continuar'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 'areas' && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold">Configurar áreas</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Defina las áreas de su establecimiento
                </p>
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto">
                {areas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={area.name}
                      onChange={(e) => handleAreaChange(index, 'name', e.target.value)}
                      className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Nombre del área"
                    />
                    <input
                      type="text"
                      value={area.code}
                      onChange={(e) =>
                        handleAreaChange(index, 'code', e.target.value.toUpperCase())
                      }
                      className="w-20 rounded-md border bg-background px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="COD"
                      maxLength={5}
                    />
                    <button
                      onClick={() => removeArea(index)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addArea}
                className="mt-3 w-full rounded-md border border-dashed py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                + Agregar área
              </button>

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setStep('complete')}
                  className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Omitir
                </button>
                <button
                  onClick={handleCreateAreas}
                  disabled={loading || areas.filter((a) => a.name && a.code).length === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Continuar'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === 'complete' && (
            <>
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-xl font-semibold">¡Todo listo!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Su organización ha sido configurada correctamente. Ya puede
                  comenzar a usar QualyIT.
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Ir al panel principal
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
