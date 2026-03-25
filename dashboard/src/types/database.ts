export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          clinic_id: string;
          sort_order: number;
          number: number;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          sort_order: number;
          number: number;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          sort_order?: number;
          number?: number;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      category_mappings: {
        Row: {
          id: string;
          old_category_id: string;
          new_category_id: string;
          mapped_at: string;
          reason: string | null;
        };
        Insert: {
          id?: string;
          old_category_id: string;
          new_category_id: string;
          mapped_at?: string;
          reason?: string | null;
        };
        Update: {
          id?: string;
          old_category_id?: string;
          new_category_id?: string;
          mapped_at?: string;
          reason?: string | null;
        };
      };
      daily_surveys: {
        Row: {
          id: string;
          clinic_id: string;
          survey_date: string;
          category_id: string;
          count: number;
          submitted_at: string;
          submitted_by: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          survey_date: string;
          category_id: string;
          count: number;
          submitted_at?: string;
          submitted_by?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          survey_date?: string;
          category_id?: string;
          count?: number;
          submitted_at?: string;
          submitted_by?: string | null;
        };
      };
      survey_edits: {
        Row: {
          id: string;
          daily_survey_id: string;
          old_count: number;
          new_count: number;
          reason: string | null;
          edited_at: string;
        };
        Insert: {
          id?: string;
          daily_survey_id: string;
          old_count: number;
          new_count: number;
          reason?: string | null;
          edited_at?: string;
        };
        Update: {
          id?: string;
          daily_survey_id?: string;
          old_count?: number;
          new_count?: number;
          reason?: string | null;
          edited_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
