import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CLINIC_CODE = 'utsunomiya-la';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: '日付が必要です' }, { status: 400 });
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('code', CLINIC_CODE)
    .single();

  if (!clinic) {
    return NextResponse.json({ error: 'クリニックが見つかりません' }, { status: 404 });
  }

  const { error } = await supabase
    .from('daily_surveys')
    .delete()
    .eq('clinic_id', clinic.id)
    .eq('survey_date', date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, date });
}
