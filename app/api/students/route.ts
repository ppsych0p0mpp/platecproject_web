import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/lib/db';

// GET all students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get('course');
    const year = searchParams.get('year');
    const section = searchParams.get('section');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('students')
      .select('id, student_id, name, email, course, year, section, created_at', { count: 'exact' });

    // Apply filters
    if (course) query = query.eq('course', course);
    if (year) query = query.eq('year', parseInt(year));
    if (section) query = query.eq('section', section);
    if (search) {
      query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    const { data: students, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      students,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new student
export async function POST(request: NextRequest) {
  try {
    const { studentId, name, email, password, course, year, section } = await request.json();

    // Validate input
    if (!studentId || !name || !email || !password || !course || !year || !section) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check for existing student
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .or(`email.eq.${email},student_id.eq.${studentId}`)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student ID or email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        student_id: studentId,
        name,
        email,
        password: hashedPassword,
        course,
        year,
        section,
      })
      .select('id, student_id, name, email, course, year, section, created_at')
      .single();

    if (error) {
      console.error('Error creating student:', error);
      return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
