export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          name: string;
          email: string;
          password: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          email: string;
          password: string;
          course: string;
          year: number;
          section: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          email: string;
          password: string;
          course: string;
          year: number;
          section: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          email?: string;
          password?: string;
          course?: string;
          year?: number;
          section?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          status: 'present' | 'absent' | 'late';
          remarks: string | null;
          class_id: string | null;
          marked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          date: string;
          status: 'present' | 'absent' | 'late';
          remarks?: string | null;
          class_id?: string | null;
          marked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          date?: string;
          status?: 'present' | 'absent' | 'late';
          remarks?: string | null;
          class_id?: string | null;
          marked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          student_id: string;
          type: 'absence' | 'late' | 'general';
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          type: 'absence' | 'late' | 'general';
          title: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          type?: 'absence' | 'late' | 'general';
          title?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// Type aliases for convenience
export type Admin = Database['public']['Tables']['admins']['Row'];
export type AdminInsert = Database['public']['Tables']['admins']['Insert'];

export type Student = Database['public']['Tables']['students']['Row'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];

export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
