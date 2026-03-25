'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { Users, CalendarDays, TrendingUp, BarChart3 } from 'lucide-react';
import type { MonthlyStats } from '@/types/survey';
import { calculateGrowthRate, CATEGORY_COLORS } from '@/lib/utils';
import MetricCard from '@/components/ui/MetricCard';

interface OverviewTabProps {
  stats: MonthlyStats;
  monthLabel: string;
}

const RADIAN = Math.PI / 180;

function renderCustomLabel(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const percent = Number(props.percent ?? 0);

  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
      style={{ fontSize: 11 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { name: string; value: number; percentage: number; fill: string };
}

function CustomPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-800">{data.name}</p>
      <p className="text-sm text-slate-600">
        {data.value}件（{data.payload.percentage.toFixed(1)}%）
      </p>
    </div>
  );
}

interface BarTooltipPayloadItem {
  name: string;
  value: number;
  payload: { name: string; total: number; fill: string };
}

function CustomBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: BarTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-800">{data.payload.name}</p>
      <p className="text-sm text-slate-600">{data.value}件</p>
    </div>
  );
}

export default function OverviewTab({ stats, monthLabel }: OverviewTabProps) {
  const momGrowth = calculateGrowthRate(stats.totalResponses, stats.previousMonthTotal);
  const yoyGrowth = calculateGrowthRate(stats.totalResponses, stats.previousYearMonthTotal);

  // Pie chart data
  const pieData = stats.categorySummary
    .filter((c) => c.total > 0)
    .map((c, i) => ({
      name: c.name,
      value: c.total,
      percentage: c.percentage,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  // Bar chart data (top 8)
  const barData = stats.categorySummary.slice(0, 8).map((c, i) => ({
    name: c.name,
    total: c.total,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* ── Metric cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="総回答数"
          value={stats.totalResponses.toLocaleString()}
          subtitle={monthLabel}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          accentColor="#3B82F6"
        />
        <MetricCard
          title="日平均"
          value={stats.dailyAverage.toFixed(1)}
          subtitle="営業日あたり"
          icon={<CalendarDays className="h-5 w-5 text-emerald-600" />}
          accentColor="#10B981"
        />
        <MetricCard
          title="前月比"
          value={`${momGrowth > 0 ? '+' : ''}${momGrowth.toFixed(1)}%`}
          trend={momGrowth}
          subtitle={`前月: ${stats.previousMonthTotal.toLocaleString()}件`}
          icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
          accentColor="#F59E0B"
        />
        <MetricCard
          title="前年同月比"
          value={`${yoyGrowth > 0 ? '+' : ''}${yoyGrowth.toFixed(1)}%`}
          trend={yoyGrowth}
          subtitle={`前年: ${stats.previousYearMonthTotal.toLocaleString()}件`}
          icon={<BarChart3 className="h-5 w-5 text-violet-600" />}
          accentColor="#8B5CF6"
        />
      </div>

      {/* ── Charts ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            カテゴリ別構成比
          </h3>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                />
                {/* Center label */}
                <text
                  x="50%"
                  y="42%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-slate-400"
                  style={{ fontSize: 12 }}
                >
                  合計
                </text>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-slate-900 font-bold"
                  style={{ fontSize: 22, fontWeight: 700 }}
                >
                  {stats.totalResponses.toLocaleString()}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal bar chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            上位カテゴリ
          </h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12 }}
                stroke="#94a3b8"
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
