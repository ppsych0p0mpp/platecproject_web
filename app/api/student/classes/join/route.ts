import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// POST join class by code
export async function POST(request: NextRequest) {
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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Class code is required' }, { status: 400 });
    }

    // Find class by code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, is_active')
      .eq('code', code.toUpperCase())
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Invalid class code' }, { status: 404 });
    }

    if (!classData.is_active) {
      return NextResponse.json({ error: 'This class is no longer active' }, { status: 400 });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', classData.id)
      .eq('student_id', decoded.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You are already enrolled in this class' }, { status: 400 });
    }

    // Enroll student
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: classData.id,
        student_id: decoded.id,
      })
      .select()
      .single();

    if (enrollError) {
      console.error('Error joining class:', enrollError);
      return NextResponse.json({ error: 'Failed to join class' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${classData.name}`,
      enrollment,
      class: classData,
    }, { status: 201 });
  } catch (error) {
    console.error('Join class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
