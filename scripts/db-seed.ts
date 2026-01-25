import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const isFresh = process.argv.includes('--fresh');

async function wipeDatabase() {
  console.log('🗑️  Wiping existing data...');
  
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('✅ Database wiped');
}

async function seed() {
  console.log('🌱 Starting database seed...\n');

  if (isFresh) {
    await wipeDatabase();
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const studentPassword = await bcrypt.hash('password123', 12);

  // Create admin
  console.log('👤 Creating admin user...');
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .upsert(
      {
        name: 'Admin User',
        email: 'admin@sams.com',
        password: adminPassword,
      },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (adminError) {
    console.error('Error creating admin:', adminError);
  } else {
    console.log(`   ✅ Admin: ${admin.email}`);
  }

  // Create students
  console.log('\n👨‍🎓 Creating students...');
  const students = [
    { student_id: 'STU001', name: 'John Doe', email: 'john@student.com', course: 'BSIT', year: 3, section: 'A' },
    { student_id: 'STU002', name: 'Jane Smith', email: 'jane@student.com', course: 'BSIT', year: 3, section: 'A' },
    { student_id: 'STU003', name: 'Mike Johnson', email: 'mike@student.com', course: 'BSIT', year: 3, section: 'B' },
    { student_id: 'STU004', name: 'Sarah Williams', email: 'sarah@student.com', course: 'BSCS', year: 2, section: 'A' },
    { student_id: 'STU005', name: 'David Brown', email: 'david@student.com', course: 'BSCS', year: 2, section: 'A' },
    { student_id: 'STU006', name: 'Emily Davis', email: 'emily@student.com', course: 'BSCS', year: 4, section: 'B' },
    { student_id: 'STU007', name: 'Chris Miller', email: 'chris@student.com', course: 'BSIT', year: 1, section: 'A' },
    { student_id: 'STU008', name: 'Lisa Wilson', email: 'lisa@student.com', course: 'BSIT', year: 1, section: 'A' },
  ];

  const studentRecords: { id: string; student_id: string; name: string }[] = [];

  for (const student of students) {
    const { data, error } = await supabase
      .from('students')
      .upsert(
        { ...student, password: studentPassword },
        { onConflict: 'email' }
      )
      .select('id, student_id, name')
      .single();

    if (error) {
      console.error(`   ❌ Error creating ${student.name}:`, error.message);
    } else if (data) {
      studentRecords.push(data);
      console.log(`   ✅ ${data.student_id}: ${data.name}`);
    }
  }

  // Create attendance records
  console.log('\n📋 Creating attendance records...');
  const today = new Date();
  const statuses: ('present' | 'absent' | 'late')[] = ['present', 'absent', 'late'];

  const attendanceRecords = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    for (const student of studentRecords) {
      // Random status with higher chance of present
      const rand = Math.random();
      const status = rand < 0.7 ? 'present' : rand < 0.9 ? 'late' : 'absent';
      
      attendanceRecords.push({
        student_id: student.id,
        date: dateStr,
        status,
        remarks: status === 'late' ? 'Arrived 10 minutes late' : null,
      });
    }
  }

  const { error: attendanceError } = await supabase
    .from('attendance')
    .upsert(attendanceRecords, { onConflict: 'student_id,date' });

  if (attendanceError) {
    console.error('   ❌ Error creating attendance:', attendanceError.message);
  } else {
    console.log(`   ✅ Created ${attendanceRecords.length} attendance records`);
  }

  // Create sample notifications
  console.log('\n🔔 Creating notifications...');
  const notifications = [];
  for (const student of studentRecords.slice(0, 3)) {
    notifications.push(
      {
        student_id: student.id,
        type: 'absence' as const,
        title: 'Absence Recorded',
        message: `You were marked absent on ${new Date().toLocaleDateString()}`,
        read: false,
      },
      {
        student_id: student.id,
        type: 'general' as const,
        title: 'Welcome to SAMS',
        message: 'Your account has been created. You can now view your attendance records.',
        read: true,
      }
    );
  }

  const { error: notifError } = await supabase.from('notifications').insert(notifications);

  if (notifError) {
    console.error('   ❌ Error creating notifications:', notifError.message);
  } else {
    console.log(`   ✅ Created ${notifications.length} notifications`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Database seeded successfully!');
  console.log('='.repeat(50));
  console.log('\n📝 Login Credentials:');
  console.log('   Admin:   admin@sams.com / admin123');
  console.log('   Student: john@student.com / password123');
  console.log('');
}

seed().catch(console.error);
