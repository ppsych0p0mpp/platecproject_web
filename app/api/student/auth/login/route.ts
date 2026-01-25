import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find student
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({
      id: student.id,
      email: student.email,
      type: 'student',
    });

    return NextResponse.json({
      success: true,
      token,
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
    console.error('Student login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
