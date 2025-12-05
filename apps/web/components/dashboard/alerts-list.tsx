'use client';

import { AlertTriangle, Clock, Wrench, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'overdue' | 'problem' | 'low_compliance' | 'urgent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  areaId: string;
  areaName: string;
  taskId?: string;
  createdAt: string | Date;
}

interface AlertsListProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  maxItems?: number;
  showAreaName?: boolean;
}

export function AlertsList({
  alerts,
  onAlertClick,
  maxItems = 10,
  showAreaName = true,
}: AlertsListProps) {
  const displayAlerts = alerts.slice(0, maxItems);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'overdue':
        return <Clock className="h-4 w-4" />;
      case 'problem':
        return <Wrench className="h-4 w-4" />;
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'border-l-4 border-l-red-600 bg-red-50',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
        };
      case 'high':
        return {
          container: 'border-l-4 border-l-orange-500 bg-orange-50',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'medium':
        return {
          container: 'border-l-4 border-l-yellow-500 bg-yellow-50',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      default:
        return {
          container: 'border-l-4 border-l-blue-400 bg-blue-50',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800',
        };
    }
  };

  const getSeverityLabel = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'Critico';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Medio';
      default:
        return 'Bajo';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay alertas pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayAlerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        return (
          <div
            key={alert.id}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition-all hover:shadow-md',
              styles.container
            )}
            onClick={() => onAlertClick?.(alert)}
          >
            <div className="flex items-start gap-3">
              <div className={cn('mt-0.5', styles.icon)}>{getAlertIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-medium',
                      styles.badge
                    )}
                  >
                    {getSeverityLabel(alert.severity)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {alert.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {showAreaName && (
                    <>
                      <span>{alert.areaName}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(alert.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {alerts.length > maxItems && (
        <p className="text-center text-sm text-muted-foreground pt-2">
          + {alerts.length - maxItems} alertas más
        </p>
      )}
    </div>
  );
}

// Compact version for dashboard cards
interface AlertCountBadgeProps {
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}

export function AlertCountBadge({ count, severity, className }: AlertCountBadgeProps) {
  if (count === 0) return null;

  const getColor = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold',
        getColor(),
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
