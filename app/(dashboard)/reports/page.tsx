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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentReport {
  student: {
    id: string;
    studentId: string;
    name: string;
    course: string;
    year: number;
    section: string;
  };
  attendance: Record<string, { status: string; remarks: string | null }>;
  summary: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

interface ReportResponse {
  report: StudentReport[];
  stats: {
    totalStudents: number;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  type: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}&date=${selectedDate}`);
      const result = await res.json();
      if (result.success) {
        setData({
          report: result.report,
          stats: result.stats,
          dateRange: result.dateRange,
          type: result.type,
        });
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reportType, selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateAttendanceRate = () => {
    if (!data?.stats) return '0.0';
    const { present, late, totalRecords } = data.stats;
    if (totalRecords === 0) return '0.0';
    return (((present + late) / totalRecords) * 100).toFixed(1);
  };

  const downloadPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Attendance Report', pageWidth / 2, 20, { align: 'center' });

    // Report info
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateRange = data.type === 'daily'
      ? formatDate(data.dateRange.startDate)
      : `${formatDate(data.dateRange.startDate)} - ${formatDate(data.dateRange.endDate)}`;
    doc.text(`Report Type: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`, 14, 35);
    doc.text(`Period: ${dateRange}`, 14, 42);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 49);

    // Summary stats
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Summary', 14, 62);
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Attendance Rate: ${calculateAttendanceRate()}%`, 14, 70);
    doc.text(`Present: ${data.stats.present} | Absent: ${data.stats.absent} | Late: ${data.stats.late}`, 14, 77);

    // Student table
    if (data.report && data.report.length > 0) {
      const tableData = data.report.map((item) => {
        const rate = item.summary.total > 0
          ? (((item.summary.present + item.summary.late) / item.summary.total) * 100).toFixed(0)
          : '0';
        return [
          item.student.name,
          item.student.studentId,
          `${item.student.course} Y${item.student.year}-${item.student.section}`,
          item.summary.present.toString(),
          item.summary.absent.toString(),
          item.summary.late.toString(),
          `${rate}%`,
        ];
      });

      autoTable(doc, {
        startY: 85,
        head: [['Student', 'ID', 'Course', 'Present', 'Absent', 'Late', 'Rate']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 },
      });
    }

    // Save
    const filename = `attendance-${data.type}-${selectedDate}.pdf`;
    doc.save(filename);
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Attendance Reports</h1>
          <p className="text-slate-400 mt-1">Generate and view attendance reports</p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="gradient" className="animate-fade-in stagger-1" style={{ opacity: 0 }}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
              options={[
                { value: 'daily', label: 'Daily Report' },
                { value: 'weekly', label: 'Weekly Report' },
                { value: 'monthly', label: 'Monthly Report' },
              ]}
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
              <Button onClick={fetchReport} className="flex-1">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate
              </Button>
              <Button onClick={downloadPDF} variant="secondary" disabled={!data}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* Report Header */}
          <Card className="animate-fade-in stagger-1" style={{ opacity: 0 }}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-slate-400">Report Period:</span>
                  <span className="text-white font-medium">
                    {formatDate(data.dateRange.startDate)}
                    {data.type !== 'daily' && ` - ${formatDate(data.dateRange.endDate)}`}
                  </span>
                </div>
                <Badge variant="info">
                  {data.type.charAt(0).toUpperCase() + data.type.slice(1)} Report
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in stagger-2" style={{ opacity: 0 }}>
            <Card variant="gradient" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              <CardContent className="relative p-6">
                <p className="text-slate-400 text-sm font-medium">Attendance Rate</p>
                <p className="text-4xl font-bold text-emerald-400 mt-2">{calculateAttendanceRate()}%</p>
                <p className="text-slate-500 text-sm mt-1">Present + Late</p>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent className="p-6">
                <p className="text-slate-400 text-sm font-medium">Present</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2">{data.stats.present}</p>
                <p className="text-slate-500 text-sm mt-1">Total records</p>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent className="p-6">
                <p className="text-slate-400 text-sm font-medium">Absent</p>
                <p className="text-3xl font-bold text-rose-400 mt-2">{data.stats.absent}</p>
                <p className="text-slate-500 text-sm mt-1">Total records</p>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardContent className="p-6">
                <p className="text-slate-400 text-sm font-medium">Late</p>
                <p className="text-3xl font-bold text-amber-400 mt-2">{data.stats.late}</p>
                <p className="text-slate-500 text-sm mt-1">Total records</p>
              </CardContent>
            </Card>
          </div>

          {/* Student Report Table */}
          <Card variant="gradient" className="animate-fade-in stagger-3" style={{ opacity: 0 }}>
            <CardHeader>
              <CardTitle>Student Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {data.report && data.report.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Student</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">ID</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Course</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">Present</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">Absent</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">Late</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.report.map((item) => {
                        const rate = item.summary.total > 0
                          ? (((item.summary.present + item.summary.late) / item.summary.total) * 100).toFixed(0)
                          : '0';
                        return (
                          <tr key={item.student.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                                  {item.student.name.charAt(0)}
                                </div>
                                <span className="text-white">{item.student.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <code className="px-2 py-1 bg-slate-800 rounded text-emerald-400 text-sm">
                                {item.student.studentId}
                              </code>
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {item.student.course} Year {item.student.year}-{item.student.section}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-emerald-400 font-medium">{item.summary.present}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-rose-400 font-medium">{item.summary.absent}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-amber-400 font-medium">{item.summary.late}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={parseInt(rate) >= 80 ? 'success' : parseInt(rate) >= 60 ? 'warning' : 'danger'}>
                                {rate}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">No attendance data for this period</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
