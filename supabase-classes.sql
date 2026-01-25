-- =============================================
-- SAMS Classes Schema - Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- CLASSES TABLE
-- =============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  schedule VARCHAR(255),
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_classes_code ON classes(code);
CREATE INDEX idx_classes_created_by ON classes(created_by);
CREATE INDEX idx_classes_is_active ON classes(is_active);

-- =============================================
-- CLASS ENROLLMENTS TABLE (Student-Class relationship)
-- =============================================
CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a student can only enroll once per class
  UNIQUE(class_id, student_id)
);

-- Create indexes
CREATE INDEX idx_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX idx_enrollments_student_id ON class_enrollments(student_id);

-- =============================================
-- UPDATE ATTENDANCE TABLE (Add class reference)
-- =============================================
ALTER TABLE attendance ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
CREATE INDEX idx_attendance_class_id ON attendance(class_id);

-- =============================================
-- UPDATED_AT TRIGGER FOR CLASSES
-- =============================================
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
