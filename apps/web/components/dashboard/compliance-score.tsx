'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComplianceScoreProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  label?: string;
}

export function ComplianceScore({
  score,
  trend = 'stable',
  trendPercentage = 0,
  size = 'md',
  showTrend = true,
  label = 'Cumplimiento',
}: ComplianceScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 70) return 'text-yellow-600';
    if (value >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (value: number) => {
    if (value >= 90) return 'bg-green-100';
    if (value >= 70) return 'bg-yellow-100';
    if (value >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const sizes = {
    sm: {
      container: 'w-16 h-16',
      text: 'text-lg',
      label: 'text-xs',
    },
    md: {
      container: 'w-24 h-24',
      text: 'text-2xl',
      label: 'text-sm',
    },
    lg: {
      container: 'w-32 h-32',
      text: 'text-4xl',
      label: 'text-base',
    },
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular progress */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          sizes[size].container,
          getScoreBgColor(score)
        )}
      >
        {/* SVG for progress ring */}
        <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.83} 283`}
            className={getScoreColor(score)}
          />
        </svg>
        <span className={cn('font-bold z-10', sizes[size].text, getScoreColor(score))}>
          {score}%
        </span>
      </div>

      {/* Label */}
      <span className={cn('font-medium text-muted-foreground', sizes[size].label)}>
        {label}
      </span>

      {/* Trend indicator */}
      {showTrend && trendPercentage > 0 && (
        <div className={cn('flex items-center gap-1', getTrendColor())}>
          {getTrendIcon()}
          <span className="text-xs font-medium">
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            {trendPercentage}%
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for lists/cards
interface ComplianceBadgeProps {
  score: number;
  className?: string;
}

export function ComplianceBadge({ score, className }: ComplianceBadgeProps) {
  const getColor = (value: number) => {
    if (value >= 90) return 'bg-green-100 text-green-800';
    if (value >= 70) return 'bg-yellow-100 text-yellow-800';
    if (value >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        getColor(score),
        className
      )}
    >
      {score}%
    </span>
  );
}
