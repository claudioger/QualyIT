'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplianceScore } from '@/components/dashboard/compliance-score';
import { AlertsList } from '@/components/dashboard/alerts-list';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AreaStatsResponse {
  area: {
    id: string;
    name: string;
    code: string | null;
  };
  period: string;
  metrics: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    withProblems: number;
    complianceRate: number;
    onTimeRate: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    areaId: string;
    areaName: string;
    taskId?: string;
    createdAt: string;
  }>;
  trend: Array<{
    date: string;
    compliance: number;
    tasks: number;
  }>;
}

export default function AreaDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const { data, isLoading, error } = useQuery({
    queryKey: ['area-stats', id, period],
    queryFn: async () => {
      const res = await api.get(`areas/${id}/stats?period=${period}`);
      return res.data as AreaStatsResponse;
    },
  });

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error al cargar estadísticas del área</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          {isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h1 className="text-2xl font-bold">
              {data?.area.name}
              {data?.area.code && (
                <span className="text-muted-foreground ml-2">({data.area.code})</span>
              )}
            </h1>
          )}
          <p className="text-muted-foreground">Dashboard de área</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="px-3"
            >
              {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
            </Button>
          ))}
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
        ) : (
          <>
            {/* Compliance Score */}
            <Card className="col-span-2 md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center">
                <ComplianceScore
                  score={data?.metrics.complianceRate || 0}
                  size="md"
                  showTrend={false}
                />
              </CardContent>
            </Card>

            {/* Tasks Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Completadas</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {data?.metrics.completed || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  de {data?.metrics.total || 0} tareas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Pendientes</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">
                  {data?.metrics.pending || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data?.metrics.overdue || 0} vencidas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Con problemas</span>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {data?.metrics.withProblems || 0}
                </p>
                <p className="text-xs text-muted-foreground">requieren atención</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/tasks?areaId=${id}`}>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Ver tareas del área
          </Button>
        </Link>
        <Link href="/tasks/new">
          <Button size="sm">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Nueva tarea
          </Button>
        </Link>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas del área
          </CardTitle>
          <CardDescription>Problemas y tareas que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
          ) : (
            <AlertsList
              alerts={(data?.alerts || []) as Array<{
                id: string;
                type: 'overdue' | 'problem' | 'low_compliance' | 'urgent';
                severity: 'low' | 'medium' | 'high' | 'critical';
                title: string;
                description: string;
                areaId: string;
                areaName: string;
                taskId?: string;
                createdAt: string;
              }>}
              showAreaName={false}
              onAlertClick={(alert) => {
                if (alert.taskId) {
                  router.push(`/tasks/${alert.taskId}`);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Trend Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencia de cumplimiento
          </CardTitle>
          <CardDescription>Evolución del cumplimiento en el período</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg">
              {data?.trend && data.trend.length > 0 ? (
                <div className="w-full h-full p-4">
                  {/* Simple bar chart */}
                  <div className="flex items-end justify-around h-full gap-1">
                    {data.trend.slice(-14).map((point, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full bg-primary rounded-t transition-all"
                          style={{ height: `${point.compliance}%` }}
                          title={`${point.date}: ${point.compliance}%`}
                        />
                        {i % 2 === 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(point.date).getDate()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay datos suficientes</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
