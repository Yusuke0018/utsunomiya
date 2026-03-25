'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: ReactNode;
  accentColor?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accentColor = '#3B82F6',
}: MetricCardProps) {
  const trendColor =
    trend === undefined || trend === 0
      ? 'text-slate-500'
      : trend > 0
        ? 'text-emerald-600'
        : 'text-red-500';

  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {trend !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {trend > 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
            </div>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accentColor}14` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
