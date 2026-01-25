import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

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

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', decoded.id);

    const enrolledClassIds = enrollments?.map((e) => e.class_id) || [];

    // Build query for attendance records
    let query = supabase
      .from('attendance')
      .select(`
        id, date, status, remarks, class_id,
        classes (id, name, code, subject)
      `, { count: 'exact' })
      .eq('student_id', decoded.id);

    // Filter by specific class if provided
    if (classId) {
      query = query.eq('class_id', classId);
    } else if (enrolledClassIds.length > 0) {
      // Only show attendance for enrolled classes
      query = query.in('class_id', enrolledClassIds);
    }

    const { data: records, error, count } = await query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    // Calculate stats for enrolled classes
    let statsQuery = supabase
      .from('attendance')
      .select('status')
      .eq('student_id', decoded.id);

    if (enrolledClassIds.length > 0) {
      statsQuery = statsQuery.in('class_id', enrolledClassIds);
    }

    const { data: allRecords } = await statsQuery;

    const stats = {
      present: allRecords?.filter((r) => r.status === 'present').length || 0,
      absent: allRecords?.filter((r) => r.status === 'absent').length || 0,
      late: allRecords?.filter((r) => r.status === 'late').length || 0,
      total: allRecords?.length || 0,
    };

    // Transform records to match expected format
    const transformedRecords = records?.map((record) => ({
      _id: record.id,
      date: record.date,
      status: record.status,
      remarks: record.remarks,
      classId: record.class_id,
      class: record.classes,
    }));

    return NextResponse.json({
      success: true,
      records: transformedRecords,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Student attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
