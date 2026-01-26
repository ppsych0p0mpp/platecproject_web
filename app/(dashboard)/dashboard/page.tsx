'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

interface DashboardData {
  totalStudents: number;
  today: { present: number; absent: number; late: number; notMarked: number };
  weeklyTrend: Array<{ date: string; present: number; absent: number; late: number }>;
  recentActivity: Array<{
    id: string;
    status: string;
    date: string;
    student: {
      id: string;
      student_id: string;
      name: string;
    };
  }>;
  courseDistribution: Array<{ course: string; count: number }>;
}

interface ClassInfo {
  id: string;
  name: string;
  code: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const result = await res.json();
      if (result.success) {
        setClasses(result.classes || []);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = selectedClass
        ? `/api/reports/dashboard?classId=${selectedClass}`
        : '/api/reports/dashboard';
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setData(result.dashboard);
      } else {
        setError(result.error || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-rose-400">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchDashboardData();
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate weekly totals
  const weeklyTotals = data?.weeklyTrend?.reduce(
    (acc, day) => ({
      present: acc.present + day.present,
      absent: acc.absent + day.absent,
      late: acc.late + day.late,
    }),
    { present: 0, absent: 0, late: 0 }
  ) || { present: 0, absent: 0, late: 0 };

  const stats = [
    {
      title: 'Total Students',
      value: data?.totalStudents || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Present Today',
      value: data?.today?.present || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Absent Today',
      value: data?.today?.absent || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-500/10',
    },
    {
      title: 'Late Today',
      value: data?.today?.late || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back! Here&apos;s an overview of your attendance system.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Filter by class:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            variant="gradient"
            className={`animate-fade-in stagger-${index + 1}`}
            style={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <div className={`bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Overview */}
        <Card variant="gradient" className="animate-fade-in stagger-5" style={{ opacity: 0 }}>
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Present</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                      style={{
                        width: `${
                          weeklyTotals.present + weeklyTotals.absent + weeklyTotals.late > 0
                            ? (weeklyTotals.present /
                                (weeklyTotals.present + weeklyTotals.absent + weeklyTotals.late)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-semibold w-12 text-right">
                    {weeklyTotals.present}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Absent</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full"
                      style={{
                        width: `${
                          weeklyTotals.present + weeklyTotals.absent + weeklyTotals.late > 0
                            ? (weeklyTotals.absent /
                                (weeklyTotals.present + weeklyTotals.absent + weeklyTotals.late)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-semibold w-12 text-right">
                    {weeklyTotals.absent}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Late</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                      style={{
                        width: `${
                          weeklyTotals.present + weeklyTotals.absent + weeklyTotals.late > 0
                            ? (weeklyTotals.late /
                                (weeklyTotals.present + weeklyTotals.absent + weeklyTotals.late)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-semibold w-12 text-right">
                    {weeklyTotals.late}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Distribution */}
        <Card variant="gradient" className="animate-fade-in stagger-5" style={{ opacity: 0 }}>
          <CardHeader>
            <CardTitle>Students by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {data?.courseDistribution?.map((item) => (
                <div
                  key={item.course}
                  className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                >
                  <p className="text-2xl font-bold text-white">{item.count}</p>
                  <p className="text-sm text-slate-400 mt-1">{item.course}</p>
                </div>
              ))}
              {(!data?.courseDistribution || data.courseDistribution.length === 0) && (
                <p className="text-slate-500 col-span-2 text-center py-4">No courses found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="gradient" className="animate-fade-in stagger-5" style={{ opacity: 0 }}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
                      {record.student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-white">{record.student?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-400">
                        {record.student?.student_id || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        record.status === 'present'
                          ? 'success'
                          : record.status === 'absent'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
