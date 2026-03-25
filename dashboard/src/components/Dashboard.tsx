'use client';

import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  GitCompare,
  Lightbulb,
  ChevronDown,
  ClipboardList,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { useDemoData } from '@/hooks/useDemoData';
import { getMonthOptions, CATEGORY_COLORS, calculateGrowthRate } from '@/lib/utils';
import OverviewTab from '@/components/tabs/OverviewTab';
import type { CategorySummary } from '@/types/survey';

// ── Tab definitions ──────────────────────────────────────
const TABS = [
  { id: 'overview', label: '概要', icon: LayoutDashboard },
  { id: 'daily', label: '日別データ', icon: CalendarDays },
  { id: 'trend', label: '推移', icon: TrendingUp },
  { id: 'compare', label: '比較', icon: GitCompare },
  { id: 'insight', label: '分析', icon: Lightbulb },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Tooltip types ────────────────────────────────────────
interface DailyTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function DailyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: DailyTooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-slate-800">{label}</p>
      <p className="mb-2 text-xs text-slate-500">合計: {total}件</p>
      {payload
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="flex-1">{p.name}</span>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
    </div>
  );
}

interface SimpleTooltipPayloadItem {
  name: string;
  value: number;
  payload: Record<string, unknown>;
}

function SimpleTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: SimpleTooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-slate-800">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm text-slate-600">
          {p.name}: {p.value.toLocaleString()}件
        </p>
      ))}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const monthOptions = useMemo(() => getMonthOptions(18), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const {
    categories,
    getSurveysByMonth,
    getMonthlyStats,
    getComparisonData,
  } = useDemoData();

  const stats = useMemo(
    () => getMonthlyStats(selectedMonth.year, selectedMonth.month),
    [getMonthlyStats, selectedMonth]
  );

  const monthLabel = selectedMonth.label;

  // ── Tab content ────────────────────────────────────────
  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} monthLabel={monthLabel} />;
      case 'daily':
        return <DailyTab />;
      case 'trend':
        return <TrendTab />;
      case 'compare':
        return <CompareTab />;
      case 'insight':
        return <InsightTab />;
      default:
        return null;
    }
  }

  // ── Daily tab ──────────────────────────────────────────
  function DailyTab() {
    const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

    const entries = useMemo(
      () => getSurveysByMonth(selectedMonth.year, selectedMonth.month),
      [selectedMonth]
    );

    // Chart data - weekdays only
    const weekdayEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getDay() !== 0 && d.getDay() !== 6;
    });

    const chartData = weekdayEntries.map((entry) => {
      const row: Record<string, string | number> = {
        date: entry.date.slice(5),
      };
      for (const cat of entry.categories) {
        row[cat.name] = cat.count;
      }
      return row;
    });

    // Monthly totals
    const monthTotals = useMemo(() => {
      const totals: Record<string, number> = {};
      for (const cat of categories) {
        totals[cat.id] = 0;
      }
      let grandTotal = 0;
      for (const entry of weekdayEntries) {
        for (const cat of entry.categories) {
          totals[cat.id] = (totals[cat.id] ?? 0) + cat.count;
          grandTotal += cat.count;
        }
      }
      return { byCategory: totals, grand: grandTotal };
    }, [weekdayEntries, categories]);

    return (
      <div className="space-y-6">
        {/* Stacked bar chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            日別回答数（{monthLabel}）
          </h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                stroke="#94a3b8"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip content={<DailyTooltip />} />
              {categories.map((cat, i) => (
                <Bar
                  key={cat.id}
                  dataKey={cat.name}
                  stackId="stack"
                  fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Data table */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            日別一覧（営業日のみ）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-2.5 font-semibold text-slate-600">
                    日付
                  </th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-center font-semibold text-slate-600">
                    曜日
                  </th>
                  {categories.map((cat) => (
                    <th
                      key={cat.id}
                      className="whitespace-nowrap px-2 py-2.5 text-right font-semibold text-slate-600"
                    >
                      {cat.name}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-2.5 text-right font-bold text-slate-800">
                    合計
                  </th>
                </tr>
              </thead>
              <tbody>
                {weekdayEntries.map((entry, idx) => {
                  const total = entry.categories.reduce((s, c) => s + c.count, 0);
                  const d = new Date(entry.date);
                  const dayOfWeek = d.getDay();
                  const dayName = DAY_NAMES[dayOfWeek];
                  return (
                    <tr
                      key={entry.date}
                      className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                    >
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-3 py-2 font-medium text-slate-700">
                        {entry.date.slice(5)}
                      </td>
                      <td className={`whitespace-nowrap px-2 py-2 text-center text-xs font-medium ${
                        dayOfWeek === 6 ? 'text-blue-500' : dayOfWeek === 0 ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {dayName}
                      </td>
                      {entry.categories.map((cat) => (
                        <td
                          key={cat.id}
                          className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-slate-600"
                        >
                          {cat.count === 0 ? <span className="text-slate-300">-</span> : cat.count}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums text-slate-900">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-slate-100 px-3 py-2.5 text-slate-800">
                    月合計
                  </td>
                  <td />
                  {categories.map((cat) => (
                    <td key={cat.id} className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-slate-800">
                      {monthTotals.byCategory[cat.id] ?? 0}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-blue-700">
                    {monthTotals.grand}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Trend tab ──────────────────────────────────────────
  function TrendTab() {
    const comparison = useMemo(() => getComparisonData(6), []);

    const trendData = comparison.map((m) => ({
      label: `${m.month}月`,
      total: m.total,
    }));

    // Category trend for top 5
    const topCategories = stats.categorySummary.slice(0, 5);
    const categoryTrendData = comparison.map((m) => {
      const row: Record<string, string | number> = { label: `${m.month}月` };
      for (const cat of topCategories) {
        const found = m.categorySummary.find((c) => c.categoryId === cat.categoryId);
        row[cat.name] = found?.total ?? 0;
      }
      return row;
    });

    return (
      <div className="space-y-6">
        {/* Total trend line */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            月別合計推移（過去6ヶ月）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip content={<SimpleTooltip />} />
              <Line
                type="linear"
                dataKey="total"
                name="合計"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category trend lines */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            上位カテゴリ推移
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={categoryTrendData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip content={<SimpleTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {topCategories.map((cat, i) => (
                <Line
                  key={cat.categoryId}

                  dataKey={cat.name}
                  stroke={CATEGORY_COLORS[i]}
                  strokeWidth={2}
                  dot={{ fill: CATEGORY_COLORS[i], r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ── Compare tab ────────────────────────────────────────
  function CompareTab() {
    const comparison = useMemo(() => getComparisonData(6), []);

    const barData = comparison.map((m) => ({
      label: `${m.month}月`,
      total: m.total,
    }));

    // Category comparison table
    const topCats = stats.categorySummary.slice(0, 8);

    return (
      <div className="space-y-6">
        {/* Monthly comparison bar */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            月別比較（過去6ヶ月）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip content={<SimpleTooltip />} />
              <Bar dataKey="total" name="合計" radius={[6, 6, 0, 0]} barSize={40}>
                {barData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === barData.length - 1 ? '#3B82F6' : '#CBD5E1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category comparison table across months */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            カテゴリ別月次推移
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-600">
                    カテゴリ
                  </th>
                  {comparison.map((m) => (
                    <th
                      key={m.label}
                      className="whitespace-nowrap px-3 py-2 text-right font-semibold text-slate-600"
                    >
                      {m.month}月
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCats.map((cat) => (
                  <tr
                    key={cat.categoryId}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">
                      {cat.name}
                    </td>
                    {comparison.map((m) => {
                      const found = m.categorySummary.find(
                        (c) => c.categoryId === cat.categoryId
                      );
                      return (
                        <td
                          key={m.label}
                          className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600"
                        >
                          {found?.total ?? 0}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Insight tab ────────────────────────────────────────
  function InsightTab() {
    const comparison = useMemo(() => getComparisonData(3), []);
    const currentMonth = comparison[comparison.length - 1];
    const prevMonth = comparison.length > 1 ? comparison[comparison.length - 2] : null;

    // Find biggest growers and decliners
    type CategoryChange = CategorySummary & { change: number; prevTotal: number };
    const changes: CategoryChange[] = stats.categorySummary.map((cat) => {
      const prev = prevMonth?.categorySummary.find(
        (c) => c.categoryId === cat.categoryId
      );
      const prevTotal = prev?.total ?? 0;
      return {
        ...cat,
        prevTotal,
        change: calculateGrowthRate(cat.total, prevTotal),
      };
    });

    const growers = changes
      .filter((c) => c.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    const decliners = changes
      .filter((c) => c.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 3);

    // Concentration: top 3 share
    const top3Share = stats.categorySummary
      .slice(0, 3)
      .reduce((s, c) => s + c.percentage, 0);

    return (
      <div className="space-y-6">
        {/* Key insights */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Top 3 concentration */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                集中度
              </h4>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {top3Share.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              上位3カテゴリが全体の{top3Share.toFixed(0)}%を占めています
            </p>
            <div className="mt-3 space-y-1">
              {stats.categorySummary.slice(0, 3).map((cat, i) => (
                <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[i] }}
                    />
                    {cat.name}
                  </span>
                  <span className="font-medium text-slate-600">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Growing categories */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                成長カテゴリ
              </h4>
            </div>
            {growers.length === 0 ? (
              <p className="text-sm text-slate-400">データなし</p>
            ) : (
              <div className="space-y-3">
                {growers.map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {cat.name}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        +{cat.change.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {cat.prevTotal} → {cat.total}件
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Declining categories */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                減少カテゴリ
              </h4>
            </div>
            {decliners.length === 0 ? (
              <p className="text-sm text-slate-400">データなし</p>
            ) : (
              <div className="space-y-3">
                {decliners.map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {cat.name}
                      </span>
                      <span className="text-sm font-bold text-red-500">
                        {cat.change.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {cat.prevTotal} → {cat.total}件
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly summary */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">
            {monthLabel} サマリー
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              {monthLabel}の総回答数は
              <span className="font-bold text-slate-900">
                {stats.totalResponses.toLocaleString()}件
              </span>
              、営業日あたり平均
              <span className="font-bold text-slate-900">
                {stats.dailyAverage.toFixed(1)}件
              </span>
              でした。
            </p>
            <p>
              最も多い来院理由は「
              <span className="font-bold text-blue-700">
                {stats.categorySummary[0]?.name}
              </span>
              」で
              <span className="font-bold text-slate-900">
                {stats.categorySummary[0]?.total}件
              </span>
              （{stats.categorySummary[0]?.percentage.toFixed(1)}%）、次いで「
              <span className="font-bold text-blue-700">
                {stats.categorySummary[1]?.name}
              </span>
              」が
              <span className="font-bold text-slate-900">
                {stats.categorySummary[1]?.total}件
              </span>
              （{stats.categorySummary[1]?.percentage.toFixed(1)}%）でした。
            </p>
            {stats.previousMonthTotal > 0 && (
              <p>
                前月比では
                <span
                  className={`font-bold ${
                    calculateGrowthRate(stats.totalResponses, stats.previousMonthTotal) >= 0
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}
                >
                  {calculateGrowthRate(stats.totalResponses, stats.previousMonthTotal) > 0
                    ? '+'
                    : ''}
                  {calculateGrowthRate(
                    stats.totalResponses,
                    stats.previousMonthTotal
                  ).toFixed(1)}
                  %
                </span>
                となっています。
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              来院理由アンケート
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              うつのみやLA泌尿器科クリニック
            </p>
          </div>

          {/* Month selector */}
          <div className="relative">
            <select
              value={`${selectedMonth.year}-${selectedMonth.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                const found = monthOptions.find(
                  (o) => o.year === y && o.month === m
                );
                if (found) setSelectedMonth(found);
              }}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {monthOptions.map((opt) => (
                <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────── */}
      <nav className="mb-6">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Tab content ─────────────────────────────────── */}
      <main className="tab-content-active">{renderTabContent()}</main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        <p>デモデータを表示中 --- 実際のデータは Supabase 連携後に反映されます</p>
      </footer>
    </div>
  );
}
