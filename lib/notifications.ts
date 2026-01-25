import supabase from './db';

interface CreateNotificationParams {
  studentId: string;
  type: 'absence' | 'late' | 'general';
  title: string;
  message: string;
}

export async function createNotification({
  studentId,
  type,
  title,
  message,
}: CreateNotificationParams) {
  const { data, error } = await supabase.from('notifications').insert({
    student_id: studentId,
    type,
    title,
    message,
  }).select().single();

  if (error) {
    console.error('Failed to create notification:', error);
    return null;
  }

  return data;
}

export async function createAbsenceNotification(studentId: string, date: string) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return createNotification({
    studentId,
    type: 'absence',
    title: 'Absence Recorded',
    message: `You were marked absent on ${formattedDate}. If you believe this is an error, please contact your instructor.`,
  });
}

export async function createLateNotification(studentId: string, date: string) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return createNotification({
    studentId,
    type: 'late',
    title: 'Late Arrival Recorded',
    message: `You were marked late on ${formattedDate}. Please try to arrive on time for future classes.`,
  });
}
