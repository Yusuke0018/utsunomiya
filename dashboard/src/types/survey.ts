export interface CategoryData {
  id: string;
  number: number;
  name: string;
  sort_order: number;
}

export interface DailySurveyRow {
  date: string;
  categoryId: string;
  categoryName: string;
  categoryNumber: number;
  count: number;
}

export interface CategorySummary {
  categoryId: string;
  name: string;
  number: number;
  total: number;
  percentage: number;
}

export interface MonthlyStats {
  totalResponses: number;
  dailyAverage: number;
  previousMonthTotal: number;
  previousYearMonthTotal: number;
  categorySummary: CategorySummary[];
}

export interface DateRange {
  start: string;
  end: string;
}
