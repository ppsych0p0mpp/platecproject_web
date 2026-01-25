import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET student's enrolled classes
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'student') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get student's enrolled classes
    const { data: enrollments, error } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        enrolled_at,
        classes (
          id, name, code, description, subject, schedule, is_active, created_at,
          admins (id, name)
        )
      `)
      .eq('student_id', decoded.id)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    const classes = enrollments?.map((e) => ({
      ...e.classes,
      enrollmentId: e.id,
      enrolledAt: e.enrolled_at,
      teacher: (e.classes as { admins?: { name: string } })?.admins,
    }));

    return NextResponse.json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error('Get student classes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
