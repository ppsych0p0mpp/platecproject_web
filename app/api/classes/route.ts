import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Generate random class code
function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET all classes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('classes')
      .select(`
        *,
        admins (id, name, email),
        class_enrollments (count)
      `)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Get enrollment counts
    const classesWithCounts = await Promise.all(
      (classes || []).map(async (cls) => {
        const { count } = await supabase
          .from('class_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id);

        return {
          ...cls,
          studentCount: count || 0,
          createdBy: cls.admins,
        };
      })
    );

    return NextResponse.json({
      success: true,
      classes: classesWithCounts,
    });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new class
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, subject, schedule } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Generate unique class code
    let code = generateClassCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) break;
      code = generateClassCode();
      attempts++;
    }

    // Create class
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        name,
        code,
        description: description || null,
        subject: subject || null,
        schedule: schedule || null,
        created_by: decoded.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      class: newClass,
    }, { status: 201 });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
