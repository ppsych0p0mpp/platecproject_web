import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET students in a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: enrollments, error } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        enrolled_at,
        students (id, student_id, name, email, course, year, section)
      `)
      .eq('class_id', id)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching class students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    const students = enrollments?.map((e) => ({
      ...e.students,
      enrollmentId: e.id,
      enrolledAt: e.enrolled_at,
    }));

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error('Get class students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST add student to class (by admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Check if class exists
    const { data: classData } = await supabase
      .from('classes')
      .select('id')
      .eq('id', id)
      .single();

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', id)
      .eq('student_id', studentId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Student already enrolled' }, { status: 400 });
    }

    // Enroll student
    const { data: enrollment, error } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: id,
        student_id: studentId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error enrolling student:', error);
      return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 });
    }

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error) {
    console.error('Enroll student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE remove student from class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = token ? verifyToken(token) : null;

    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('class_id', id)
      .eq('student_id', studentId);

    if (error) {
      console.error('Error removing student:', error);
      return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Student removed from class' });
  } catch (error) {
    console.error('Remove student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
