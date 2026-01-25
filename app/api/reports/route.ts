import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const course = searchParams.get('course');
    const year = searchParams.get('year');
    const section = searchParams.get('section');

    let startDate: string;
    let endDate: string;

    // Calculate date range based on report type
    const targetDate = new Date(date);

    if (type === 'weekly') {
      const dayOfWeek = targetDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(targetDate);
      monday.setDate(targetDate.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    } else if (type === 'monthly') {
      const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      startDate = firstDay.toISOString().split('T')[0];
      endDate = lastDay.toISOString().split('T')[0];
    } else {
      startDate = date;
      endDate = date;
    }

    // Build student filter query
    let studentQuery = supabase.from('students').select('id, student_id, name, course, year, section');
    if (course) studentQuery = studentQuery.eq('course', course);
    if (year) studentQuery = studentQuery.eq('year', parseInt(year));
    if (section) studentQuery = studentQuery.eq('section', section);

    const { data: students, error: studentError } = await studentQuery.order('name');

    if (studentError) {
      console.error('Error fetching students:', studentError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Get student IDs
    const studentIds = students?.map((s) => s.id) || [];

    // Fetch attendance for date range
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .in('student_id', studentIds)
      .gte('date', startDate)
      .lte('date', endDate);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    // Create attendance map
    const attendanceMap = new Map<string, Record<string, { status: string; remarks: string | null }>>();
    attendance?.forEach((record) => {
      const key = record.student_id;
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, {});
      }
      attendanceMap.get(key)![record.date] = {
        status: record.status,
        remarks: record.remarks,
      };
    });

    // Build report data
    const report = students?.map((student) => {
      const studentAttendance = attendanceMap.get(student.id) || {};
      const records = Object.values(studentAttendance);

      return {
        student: {
          id: student.id,
          studentId: student.student_id,
          name: student.name,
          course: student.course,
          year: student.year,
          section: student.section,
        },
        attendance: studentAttendance,
        summary: {
          present: records.filter((r) => r.status === 'present').length,
          absent: records.filter((r) => r.status === 'absent').length,
          late: records.filter((r) => r.status === 'late').length,
          total: records.length,
        },
      };
    });

    // Calculate overall statistics
    const allRecords = attendance || [];
    const stats = {
      totalStudents: students?.length || 0,
      totalRecords: allRecords.length,
      present: allRecords.filter((r) => r.status === 'present').length,
      absent: allRecords.filter((r) => r.status === 'absent').length,
      late: allRecords.filter((r) => r.status === 'late').length,
    };

    return NextResponse.json({
      success: true,
      report,
      stats,
      dateRange: { startDate, endDate },
      type,
    });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
