import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // Create calendar_events table
    const { error: tableError } = await supabaseAdmin
      .from('calendar_events')
      .select('id')
      .limit(1);

    if (tableError?.code === 'PGRST204') {
      const { error: createError } = await supabaseAdmin.from('calendar_events').insert([
        {
          title: 'Sample Event', // Provide some sample data
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          calendar_type: 'weekly', // Add a default value
        }
      ]);

      if (createError && createError.code !== '42P01') {
        throw createError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
