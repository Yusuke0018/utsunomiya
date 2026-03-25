import { supabase } from './supabase';
import type { Database } from '@/types/database';

type ClinicRow = Database['public']['Tables']['clinics']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type DailySurveyRow = Database['public']['Tables']['daily_surveys']['Row'];

interface SurveyWithCategory extends DailySurveyRow {
  categories: Pick<CategoryRow, 'name' | 'number' | 'sort_order'> | null;
}

export async function fetchClinic(
  code: string
): Promise<ClinicRow | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    console.error('Failed to fetch clinic:', error.message);
    return null;
  }

  return data;
}

export async function fetchCategories(
  clinicCode: string
): Promise<CategoryRow[]> {
  const clinic = await fetchClinic(clinicCode);
  if (!clinic) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('clinic_id', clinic.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch categories:', error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchMonthlySurveys(
  clinicCode: string,
  year: number,
  month: number
): Promise<SurveyWithCategory[]> {
  const clinic = await fetchClinic(clinicCode);
  if (!clinic) return [];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('daily_surveys')
    .select('*, categories(name, number, sort_order)')
    .eq('clinic_id', clinic.id)
    .gte('survey_date', startDate)
    .lte('survey_date', endDate)
    .order('survey_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch monthly surveys:', error.message);
    return [];
  }

  return (data as SurveyWithCategory[]) ?? [];
}

export async function fetchSurveyRange(
  clinicCode: string,
  startDate: string,
  endDate: string
): Promise<SurveyWithCategory[]> {
  const clinic = await fetchClinic(clinicCode);
  if (!clinic) return [];

  const { data, error } = await supabase
    .from('daily_surveys')
    .select('*, categories(name, number, sort_order)')
    .eq('clinic_id', clinic.id)
    .gte('survey_date', startDate)
    .lte('survey_date', endDate)
    .order('survey_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch survey range:', error.message);
    return [];
  }

  return (data as SurveyWithCategory[]) ?? [];
}
