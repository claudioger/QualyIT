'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requirements = [
    { label: 'Al menos 8 caracteres', valid: newPassword.length >= 8 },
    { label: 'Una letra mayúscula', valid: /[A-Z]/.test(newPassword) },
    { label: 'Una letra minúscula', valid: /[a-z]/.test(newPassword) },
    { label: 'Un número', valid: /[0-9]/.test(newPassword) },
  ];

  const allRequirementsMet = requirements.every((r) => r.valid);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequirementsMet || !passwordsMatch) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Error al cambiar la contraseña');
        return;
      }

      // Redirect to home on success
      router.push('/');
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-6 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Cambiar contraseña</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Por seguridad, debe cambiar su contraseña temporal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contraseña temporal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nueva contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="rounded-md bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Requisitos:
              </p>
              <ul className="space-y-1">
                {requirements.map((req, index) => (
                  <li
                    key={index}
                    className={`flex items-center gap-2 text-xs ${
                      req.valid ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    {req.valid ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="Repetir contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-500">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allRequirementsMet || !passwordsMatch}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
