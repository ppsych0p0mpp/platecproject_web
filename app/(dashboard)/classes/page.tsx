'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  Badge,
} from '@/components/ui';

interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string | null;
  subject: string | null;
  schedule: string | null;
  is_active: boolean;
  studentCount: number;
  created_at: string;
  createdBy?: { name: string };
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  course: string;
  year: number;
  section: string;
  enrolledAt?: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    dayPattern: '',
    timeRange: '',
  });

  const scheduleOptions = {
    MWF: ['7:00–9:00 AM', '9:30–11:30 AM'],
    TTH: ['7:00–9:30 AM', '10:00–11:00 AM'],
  };
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const schedule = formData.dayPattern && formData.timeRange
        ? `${formData.dayPattern} ${formData.timeRange}`
        : null;
      
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          subject: formData.subject,
          schedule,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `Class created! Code: ${data.class.code}` });
        setIsModalOpen(false);
        setFormData({ name: '', description: '', subject: '', dayPattern: '', timeRange: '' });
        fetchClasses();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create class' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (classId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (res.ok) {
        fetchClasses();
      }
    } catch (error) {
      console.error('Failed to toggle class:', error);
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchClasses();
        setMessage({ type: 'success', text: 'Class deleted successfully' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete class' });
    }
  };

  const viewStudents = async (classData: ClassData) => {
    setSelectedClass(classData);
    setIsStudentsModalOpen(true);

    try {
      const res = await fetch(`/api/classes/${classData.id}/students`);
      const data = await res.json();
      if (data.success) {
        setClassStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage({ type: 'success', text: 'Class code copied to clipboard!' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Classes</h1>
          <p className="text-[var(--text-secondary)] mt-1">Create and manage your classes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Class
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-current opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls, index) => (
          <Card
            key={cls.id}
            variant="gradient"
            className={`animate-fade-in stagger-${(index % 5) + 1}`}
            style={{ opacity: 0 }}
          >
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                <p className="text-black text-sm mt-1">{cls.subject || 'No subject'}</p>
              </div>
              <Badge variant={cls.is_active ? 'success' : 'danger'}>
                {cls.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </CardHeader>
            <CardContent>
              {/* Class Code */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl mb-4 border border-slate-800">
                <div>
                  <p className="text-xs text-black  uppercase tracking-wide">Join Code</p>
                  <p className="text-2xl font-mono font-bold text-emerald-400 tracking-widest">
                    {cls.code}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyCode(cls.code)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </Button>
              </div>

              {/* Description */}
              {cls.description && (
                <p className="text-black text-sm mb-4 line-clamp-2">{cls.description}</p>
              )}

              {/* Schedule */}
              {cls.schedule && (
                <div className="flex items-center gap-2 text-sm text-black mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {cls.schedule}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between py-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-black font-medium">{cls.studentCount}</span>
                  <span className="text-black">Students</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => viewStudents(cls)}>
                  View
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-700">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggleActive(cls.id, cls.is_active)}
                >
                  {cls.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(cls.id)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {classes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-slate-500">No classes yet</p>
            <p className="text-slate-600 text-sm mt-1">Create your first class to get started</p>
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Class">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g., Introduction to Programming"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Subject"
            placeholder="e.g., Computer Science"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Days</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.dayPattern}
                onChange={(e) => setFormData({ ...formData, dayPattern: e.target.value, timeRange: '' })}
              >
                <option value="">Select days</option>
                <option value="MWF">MWF (Mon/Wed/Fri)</option>
                <option value="TTH">TTH (Tue/Thu)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                value={formData.timeRange}
                onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
                disabled={!formData.dayPattern}
              >
                <option value="">Select time</option>
                {formData.dayPattern && scheduleOptions[formData.dayPattern as keyof typeof scheduleOptions]?.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={3}
              placeholder="Optional class description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Students Modal */}
      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        title={`Students in ${selectedClass?.name || 'Class'}`}
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {classStudents.length > 0 ? (
            classStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.student_id} • {student.course}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-8">No students enrolled yet</p>
          )}
        </div>
        <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-sm text-slate-400">
            Share this code with students to join:
            <span className="ml-2 font-mono font-bold text-emerald-400 text-lg">
              {selectedClass?.code}
            </span>
          </p>
        </div>
      </Modal>
    </div>
  );
}
