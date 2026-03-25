'use client';

import { useMemo } from 'react';
import type { CategoryData, CategorySummary, MonthlyStats } from '@/types/survey';

// ── 12 survey categories ──────────────────────────────────
const CATEGORIES: CategoryData[] = [
  { id: 'cat-01', number: 1, name: 'Google', sort_order: 1 },
  { id: 'cat-02', number: 2, name: 'Yahoo', sort_order: 2 },
  { id: 'cat-03', number: 3, name: 'AI', sort_order: 3 },
  { id: 'cat-04', number: 4, name: 'Youtube', sort_order: 4 },
  { id: 'cat-05', number: 5, name: '家族・友人の紹介', sort_order: 5 },
  { id: 'cat-06', number: 6, name: '看板・のぼり', sort_order: 6 },
  { id: 'cat-07', number: 7, name: 'チラシ', sort_order: 7 },
  { id: 'cat-08', number: 8, name: '新聞折込', sort_order: 8 },
  { id: 'cat-09', number: 9, name: '情報誌', sort_order: 9 },
  { id: 'cat-10', number: 10, name: 'ラジオ', sort_order: 10 },
  { id: 'cat-11', number: 11, name: '医療機関からの紹介', sort_order: 11 },
  { id: 'cat-12', number: 12, name: 'その他', sort_order: 12 },
];

// ── Seeded pseudo-random number generator ──────────────────
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return () => {
    hash = (hash * 1664525 + 1013904223) | 0;
    return ((hash >>> 0) / 4294967296);
  };
}

// ── Daily count ranges per category (min, max on weekdays) ─
const CATEGORY_RANGES: Record<string, [number, number]> = {
  'cat-01': [6, 15],   // Google - highest
  'cat-02': [2, 7],    // Yahoo
  'cat-03': [2, 8],    // AI - medium
  'cat-04': [2, 8],    // Youtube - medium
  'cat-05': [5, 14],   // 家族・友人の紹介 - highest
  'cat-06': [1, 4],    // 看板・のぼり
  'cat-07': [0, 3],    // チラシ
  'cat-08': [0, 2],    // 新聞折込
  'cat-09': [0, 2],    // 情報誌
  'cat-10': [0, 1],    // ラジオ
  'cat-11': [1, 5],    // 医療機関からの紹介
  'cat-12': [0, 3],    // その他
};

function generateDayCount(catId: string, rng: () => number): number {
  const [min, max] = CATEGORY_RANGES[catId] ?? [0, 3];
  return min + Math.floor(rng() * (max - min + 1));
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ── Types for demo data ────────────────────────────────────
export interface DayCategories {
  id: string;
  name: string;
  number: number;
  count: number;
}

export interface DaySurveyEntry {
  date: string;
  categories: DayCategories[];
}

export interface ComparisonMonth {
  year: number;
  month: number;
  label: string;
  total: number;
  categorySummary: CategorySummary[];
}

// ── Main hook ──────────────────────────────────────────────
export function useDemoData() {
  const data = useMemo(() => {
    // Generate data for the past 18 months to support comparison
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 17, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of current month

    // surveys: Map<dateStr, Map<categoryId, count>>
    const surveys = new Map<string, Map<string, number>>();

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateStr = formatDateStr(cursor);
      const dayCounts = new Map<string, number>();

      if (!isWeekend(cursor)) {
        const rng = seededRandom(dateStr + '-survey');
        for (const cat of CATEGORIES) {
          dayCounts.set(cat.id, generateDayCount(cat.id, rng));
        }
      } else {
        for (const cat of CATEGORIES) {
          dayCounts.set(cat.id, 0);
        }
      }

      surveys.set(dateStr, dayCounts);
      cursor.setDate(cursor.getDate() + 1);
    }

    // ── getSurveysByMonth ────────────────────────────────
    function getSurveysByMonth(year: number, month: number): DaySurveyEntry[] {
      const results: DaySurveyEntry[] = [];
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayCounts = surveys.get(dateStr);
        if (!dayCounts) continue;

        const categories: DayCategories[] = CATEGORIES.map((cat) => ({
          id: cat.id,
          name: cat.name,
          number: cat.number,
          count: dayCounts.get(cat.id) ?? 0,
        }));

        results.push({ date: dateStr, categories });
      }

      return results;
    }

    // ── getMonthlyStats ──────────────────────────────────
    function getMonthlyStats(year: number, month: number): MonthlyStats {
      const entries = getSurveysByMonth(year, month);
      const totals = new Map<string, number>();

      for (const entry of entries) {
        for (const cat of entry.categories) {
          totals.set(cat.id, (totals.get(cat.id) ?? 0) + cat.count);
        }
      }

      const totalResponses = Array.from(totals.values()).reduce((a, b) => a + b, 0);
      const workdays = entries.filter((e) => {
        const d = new Date(e.date);
        return !isWeekend(d);
      }).length;
      const dailyAverage = workdays > 0 ? totalResponses / workdays : 0;

      const categorySummary: CategorySummary[] = CATEGORIES.map((cat) => {
        const total = totals.get(cat.id) ?? 0;
        return {
          categoryId: cat.id,
          name: cat.name,
          number: cat.number,
          total,
          percentage: totalResponses > 0 ? (total / totalResponses) * 100 : 0,
        };
      }).sort((a, b) => b.total - a.total);

      // Previous month
      const prevDate = new Date(year, month - 2, 1);
      const prevEntries = getSurveysByMonth(prevDate.getFullYear(), prevDate.getMonth() + 1);
      const previousMonthTotal = prevEntries.reduce(
        (sum, e) => sum + e.categories.reduce((s, c) => s + c.count, 0),
        0
      );

      // Previous year same month
      const prevYearEntries = getSurveysByMonth(year - 1, month);
      const previousYearMonthTotal = prevYearEntries.reduce(
        (sum, e) => sum + e.categories.reduce((s, c) => s + c.count, 0),
        0
      );

      return {
        totalResponses,
        dailyAverage,
        previousMonthTotal,
        previousYearMonthTotal,
        categorySummary,
      };
    }

    // ── getComparisonData ────────────────────────────────
    function getComparisonData(months: number): ComparisonMonth[] {
      const results: ComparisonMonth[] = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const stats = getMonthlyStats(y, m);
        results.push({
          year: y,
          month: m,
          label: `${y}年${m}月`,
          total: stats.totalResponses,
          categorySummary: stats.categorySummary,
        });
      }
      return results.reverse();
    }

    return {
      categories: CATEGORIES,
      surveys,
      getSurveysByMonth,
      getMonthlyStats,
      getComparisonData,
    };
  }, []);

  return data;
}
