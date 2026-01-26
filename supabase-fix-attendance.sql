-- =============================================
-- FIX: Attendance unique constraint for class-based attendance
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop the old constraint that only uses student_id and date
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_date_key;

-- Create a new unique constraint that includes class_id
-- This allows the same student to have different attendance records
-- for different classes on the same day
ALTER TABLE attendance ADD CONSTRAINT attendance_student_date_class_unique 
  UNIQUE (student_id, date, class_id);

-- Note: If class_id is NULL, each combination of (student_id, date, NULL) 
-- will be treated as unique, which is the expected behavior for
-- attendance records not associated with any specific class.
