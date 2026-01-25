import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'student') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('id, student_id, name, email, course, year, section')
      .eq('id', decoded.id)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        email: student.email,
        course: student.course,
        year: student.year,
        section: student.section,
      },
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
