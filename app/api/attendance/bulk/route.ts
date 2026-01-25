import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createAbsenceNotification, createLateNotification } from '@/lib/notifications';
import { AttendanceInsert } from '@/lib/types/supabase';

interface BulkAttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = token ? verifyToken(token) : null;

    const { date, classId, records } = await request.json() as {
      date: string;
      classId?: string;
      records: BulkAttendanceRecord[];
    };

    if (!date || !records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'Date and records array are required' },
        { status: 400 }
      );
    }

    // Prepare upsert data with proper typing
    const upsertData: AttendanceInsert[] = records.map((record) => ({
      student_id: record.studentId,
      date,
      status: record.status,
      remarks: record.remarks || null,
      class_id: classId || null,
      marked_by: decoded?.id || null,
    }));

    // Bulk upsert - cast to any to avoid strict type issues with array upsert
    const { data: attendance, error } = await supabase
      .from('attendance')
      .upsert(upsertData as never[], { onConflict: 'student_id,date' })
      .select();

    if (error) {
      console.error('Error bulk creating attendance:', error);
      return NextResponse.json(
        { error: 'Failed to create attendance records' },
        { status: 500 }
      );
    }

    // Create notifications for absences and late arrivals
    for (const record of records) {
      if (record.status === 'absent') {
        await createAbsenceNotification(record.studentId, date);
      } else if (record.status === 'late') {
        await createLateNotification(record.studentId, date);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${attendance?.length || 0} attendance records saved`,
      count: attendance?.length || 0,
    });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
