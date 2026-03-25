'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CategoryData, CategorySummary, MonthlyStats } from '@/types/survey';

const CLINIC_CODE = 'utsunomiya-la';

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

export function useSurveyData() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch clinic + categories on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id')
          .eq('code', CLINIC_CODE)
          .single();

        if (!clinic) return;
        setClinicId(clinic.id);

        const { data: cats } = await supabase
          .from('categories')
          .select('id, number, name, sort_order')
          .eq('clinic_id', clinic.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (cats) {
          setCategories(cats.map(c => ({
            id: c.id,
            number: c.number,
            name: c.name,
            sort_order: c.sort_order,
          })));
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch surveys for a specific month
  const getSurveysByMonth = useCallback(
    async (year: number, month: number): Promise<DaySurveyEntry[]> => {
      if (!clinicId || categories.length === 0) return [];

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const { data } = await supabase
        .from('daily_surveys')
        .select('survey_date, category_id, count')
        .eq('clinic_id', clinicId)
        .gte('survey_date', startDate)
        .lte('survey_date', endDate)
        .order('survey_date', { ascending: true });

      if (!data || data.length === 0) return [];

      // Group by date
      const byDate = new Map<string, Map<string, number>>();
      for (const row of data) {
        if (!byDate.has(row.survey_date)) {
          byDate.set(row.survey_date, new Map());
        }
        byDate.get(row.survey_date)!.set(row.category_id, row.count);
      }

      const entries: DaySurveyEntry[] = [];
      for (const [date, countMap] of byDate) {
        entries.push({
          date,
          categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            number: cat.number,
            count: countMap.get(cat.id) ?? 0,
          })),
        });
      }

      return entries;
    },
    [clinicId, categories]
  );

  // Get monthly stats
  const getMonthlyStats = useCallback(
    async (year: number, month: number): Promise<MonthlyStats> => {
      const empty: MonthlyStats = {
        totalResponses: 0,
        dailyAverage: 0,
        previousMonthTotal: 0,
        previousYearMonthTotal: 0,
        categorySummary: [],
      };

      if (!clinicId || categories.length === 0) return empty;

      const entries = await getSurveysByMonth(year, month);

      // Current month totals
      const totals = new Map<string, number>();
      for (const entry of entries) {
        for (const cat of entry.categories) {
          totals.set(cat.id, (totals.get(cat.id) ?? 0) + cat.count);
        }
      }
      const totalResponses = Array.from(totals.values()).reduce((a, b) => a + b, 0);
      const workdays = entries.length;
      const dailyAverage = workdays > 0 ? totalResponses / workdays : 0;

      const categorySummary: CategorySummary[] = categories.map(cat => {
        const total = totals.get(cat.id) ?? 0;
        return {
          categoryId: cat.id,
          name: cat.name,
          number: cat.number,
          total,
          percentage: totalResponses > 0 ? (total / totalResponses) * 100 : 0,
        };
      }).sort((a, b) => b.total - a.total);

      // Previous month total
      const prevDate = new Date(year, month - 2, 1);
      const prevEntries = await getSurveysByMonth(prevDate.getFullYear(), prevDate.getMonth() + 1);
      const previousMonthTotal = prevEntries.reduce(
        (sum, e) => sum + e.categories.reduce((s, c) => s + c.count, 0), 0
      );

      // Previous year same month total
      const prevYearEntries = await getSurveysByMonth(year - 1, month);
      const previousYearMonthTotal = prevYearEntries.reduce(
        (sum, e) => sum + e.categories.reduce((s, c) => s + c.count, 0), 0
      );

      return {
        totalResponses,
        dailyAverage,
        previousMonthTotal,
        previousYearMonthTotal,
        categorySummary,
      };
    },
    [clinicId, categories, getSurveysByMonth]
  );

  // Get comparison data for N months
  const getComparisonData = useCallback(
    async (months: number): Promise<ComparisonMonth[]> => {
      const now = new Date();
      const results: ComparisonMonth[] = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const stats = await getMonthlyStats(y, m);
        results.push({
          year: y,
          month: m,
          label: `${y}年${m}月`,
          total: stats.totalResponses,
          categorySummary: stats.categorySummary,
        });
      }
      return results.reverse();
    },
    [getMonthlyStats]
  );

  return {
    categories,
    loading,
    getSurveysByMonth,
    getMonthlyStats,
    getComparisonData,
  };
}
