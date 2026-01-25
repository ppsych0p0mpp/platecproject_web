'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Select,
} from '@/components/ui';

interface ClassData {
  id: string;
  name: string;
  code: string;
  subject: string | null;
  studentCount: number;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  course: string;
  year: number;
  section: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'unmarked';
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all classes
  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes?active=true');
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
        if (data.classes.length > 0 && !selectedClassId) {
          setSelectedClassId(data.classes[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId]);

  // Fetch students in selected class
  const fetchClassStudents = useCallback(async () => {
    if (!selectedClassId) return;
    
    setIsLoadingStudents(true);
    try {
      const res = await fetch(`/api/classes/${selectedClassId}/students`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedClassId]);

  // Fetch existing attendance for selected class and date
  const fetchAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}&classId=${selectedClassId}`);
      const data = await res.json();
      if (data.success) {
        const attendanceMap = new Map<string, AttendanceRecord>();
        data.records.forEach((record: { student: { id: string }; status: 'present' | 'absent' | 'late' }) => {
          attendanceMap.set(record.student.id, {
            studentId: record.student.id,
            status: record.status,
          });
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  }, [selectedClassId, selectedDate]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassStudents();
      fetchAttendance();
    }
  }, [selectedClassId, selectedDate, fetchClassStudents, fetchAttendance]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'unmarked') => {
    const newAttendance = new Map(attendance);
    if (status === 'unmarked') {
      newAttendance.delete(studentId);
    } else {
      newAttendance.set(studentId, { studentId, status });
    }
    setAttendance(newAttendance);
  };

  const markAllAs = (status: 'present' | 'absent' | 'late') => {
    const newAttendance = new Map<string, AttendanceRecord>();
    students.forEach((student) => {
      newAttendance.set(student.id, { studentId: student.id, status });
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const records = Array.from(attendance.values()).map((record) => ({
        studentId: record.studentId,
        status: record.status,
      }));

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          classId: selectedClassId,
          records,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Attendance saved for ${data.count} students` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save attendance' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-500';
      case 'absent':
        return 'bg-rose-500';
      case 'late':
        return 'bg-amber-500';
      default:
        return 'bg-slate-600';
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-white">Mark Attendance</h1>
          <p className="text-slate-400 mt-1">Select a class to mark attendance</p>
        </div>
        <Card variant="gradient" className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-slate-400">No classes found</p>
          <p className="text-slate-500 text-sm mt-1">Create a class first to mark attendance</p>
          <Button className="mt-4" onClick={() => window.location.href = '/classes'}>
            Go to Classes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Mark Attendance</h1>
          <p className="text-slate-400 mt-1">
            {selectedClass ? `${selectedClass.name} • ${selectedClass.code}` : 'Select a class'}
          </p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} disabled={students.length === 0}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Attendance
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <Card variant="gradient" className="animate-fade-in stagger-1" style={{ opacity: 0 }}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classes.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => markAllAs('present')} className="flex-1">
                All Present
              </Button>
              <Button variant="secondary" size="sm" onClick={() => markAllAs('absent')} className="flex-1">
                All Absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card variant="gradient" className="animate-fade-in stagger-2" style={{ opacity: 0 }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Students ({students.length})</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                Present: {Array.from(attendance.values()).filter((a) => a.status === 'present').length}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                Absent: {Array.from(attendance.values()).filter((a) => a.status === 'absent').length}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                Late: {Array.from(attendance.values()).filter((a) => a.status === 'late').length}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-3">
              {students.map((student) => {
                const record = attendance.get(student.id);
                const status = record?.status || 'unmarked';

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{student.name}</p>
                        <p className="text-sm text-slate-500">
                          {student.student_id} • {student.course} Year {student.year}-{student.section}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(['present', 'late', 'absent'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(student.id, status === s ? 'unmarked' : s)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            status === s
                              ? s === 'present'
                                ? 'bg-emerald-500 text-white'
                                : s === 'late'
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-500 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-slate-500">No students in this class</p>
              <p className="text-slate-600 text-sm mt-1">Students need to join using the class code</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
