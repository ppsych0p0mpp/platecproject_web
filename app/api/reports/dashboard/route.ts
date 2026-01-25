import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get total students count
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    // Get today's attendance
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);

    const todayStats = {
      present: todayAttendance?.filter((a) => a.status === 'present').length || 0,
      absent: todayAttendance?.filter((a) => a.status === 'absent').length || 0,
      late: todayAttendance?.filter((a) => a.status === 'late').length || 0,
      notMarked: (totalStudents || 0) - (todayAttendance?.length || 0),
    };

    // Get this week's attendance for trend
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const { data: weeklyAttendance } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', weekStartStr)
      .lte('date', today);

    // Group by date
    const weeklyTrend: Record<string, { present: number; absent: number; late: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      weeklyTrend[dateStr] = { present: 0, absent: 0, late: 0 };
    }

    weeklyAttendance?.forEach((record) => {
      if (weeklyTrend[record.date]) {
        weeklyTrend[record.date][record.status as 'present' | 'absent' | 'late']++;
      }
    });

    // Get recent activity (last 10 attendance records)
    const { data: recentActivity } = await supabase
      .from('attendance')
      .select(`
        id, date, status, created_at,
        students (id, student_id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const transformedActivity = recentActivity?.map((record) => ({
      id: record.id,
      date: record.date,
      status: record.status,
      createdAt: record.created_at,
      student: record.students,
    }));

    // Course distribution
    const { data: courseData } = await supabase
      .from('students')
      .select('course');

    const courseDistribution: Record<string, number> = {};
    courseData?.forEach((s) => {
      courseDistribution[s.course] = (courseDistribution[s.course] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      dashboard: {
        totalStudents: totalStudents || 0,
        today: todayStats,
        weeklyTrend: Object.entries(weeklyTrend).map(([date, stats]) => ({
          date,
          ...stats,
        })),
        recentActivity: transformedActivity,
        courseDistribution: Object.entries(courseDistribution).map(([course, count]) => ({
          course,
          count,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
