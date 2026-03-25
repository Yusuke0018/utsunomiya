-- clinics table
CREATE TABLE clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  sort_order integer NOT NULL,
  number integer NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- category_mappings table
CREATE TABLE category_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_category_id uuid REFERENCES categories(id),
  new_category_id uuid REFERENCES categories(id),
  mapped_at timestamptz DEFAULT now(),
  reason text
);

-- daily_surveys table
CREATE TABLE daily_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id),
  survey_date date NOT NULL,
  category_id uuid REFERENCES categories(id),
  count integer NOT NULL DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  submitted_by text,
  UNIQUE(clinic_id, survey_date, category_id)
);

-- survey_edits table
CREATE TABLE survey_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_survey_id uuid REFERENCES daily_surveys(id),
  old_count integer NOT NULL,
  new_count integer NOT NULL,
  reason text NOT NULL,
  edited_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_edits ENABLE ROW LEVEL SECURITY;

-- SELECT: anon can read all
CREATE POLICY "anon_read_clinics" ON clinics FOR SELECT USING (true);
CREATE POLICY "anon_read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "anon_read_category_mappings" ON category_mappings FOR SELECT USING (true);
CREATE POLICY "anon_read_daily_surveys" ON daily_surveys FOR SELECT USING (true);
CREATE POLICY "anon_read_survey_edits" ON survey_edits FOR SELECT USING (true);

-- INSERT/UPDATE: service_role only (handled by Supabase default - service_role bypasses RLS)

-- Initial data
INSERT INTO clinics (name, code) VALUES ('うつのみやLA泌尿器科クリニック', 'utsunomiya-la');

-- Insert categories (will reference the clinic_id)
-- Use a DO block to get the clinic_id
DO $$
DECLARE
  clinic_uuid uuid;
BEGIN
  SELECT id INTO clinic_uuid FROM clinics WHERE code = 'utsunomiya-la';

  INSERT INTO categories (clinic_id, sort_order, number, name) VALUES
    (clinic_uuid, 1, 1, 'Google'),
    (clinic_uuid, 2, 2, 'Yahoo'),
    (clinic_uuid, 3, 3, 'AI'),
    (clinic_uuid, 4, 4, 'Youtube'),
    (clinic_uuid, 5, 5, '家族・友人の紹介'),
    (clinic_uuid, 6, 6, '看板・のぼり'),
    (clinic_uuid, 7, 7, 'チラシ'),
    (clinic_uuid, 8, 8, '新聞折込'),
    (clinic_uuid, 9, 9, '情報誌'),
    (clinic_uuid, 10, 10, 'ラジオ'),
    (clinic_uuid, 11, 11, '医療機関からの紹介'),
    (clinic_uuid, 12, 12, 'その他');
END $$;

-- Create indexes
CREATE INDEX idx_daily_surveys_clinic_date ON daily_surveys(clinic_id, survey_date);
CREATE INDEX idx_daily_surveys_category ON daily_surveys(category_id);
CREATE INDEX idx_categories_clinic ON categories(clinic_id);
