import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];
let studentToken = '';

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, message: 'OK', duration });
    console.log(`   ✅ ${name}: OK (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';
    results.push({ name, passed: false, message, duration });
    console.log(`   ❌ ${name}: ${message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log('\n🧪 SAMS System Test Suite (Supabase)');
  console.log('='.repeat(50));
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Supabase: ${supabaseUrl ? 'Configured' : 'Not configured'}`);
  console.log('='.repeat(50));

  // Database Tests
  console.log('\n📊 Database Tests:');

  await runTest('Supabase Connection', async () => {
    assert(!!supabaseUrl && !!supabaseServiceKey, 'Supabase credentials not configured');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { error } = await supabase.from('admins').select('count').limit(1);
    assert(!error, error?.message || 'Connection failed');
  });

  await runTest('Tables Exist', async () => {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const tables = ['admins', 'students', 'attendance', 'notifications'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      assert(!error, `Table ${table} does not exist or is not accessible`);
    }
  });

  await runTest('Data Present', async () => {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
    assert((count || 0) > 0, 'No students found. Run npm run db:seed first');
  });

  // API Server Tests
  console.log('\n🌐 API Server Tests:');

  await runTest('Health Check', async () => {
    const response = await fetch(`${API_URL}/api/auth/me`);
    assert(response.status === 401, `Expected 401, got ${response.status}`);
  });

  await runTest('Admin Login', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sams.com', password: 'admin123' }),
    });
    assert(response.ok, `Login failed with status ${response.status}`);
    const data = await response.json();
    assert(data.success, 'Login response not successful');
  });

  await runTest('Student Login (Portal API)', async () => {
    const response = await fetch(`${API_URL}/api/student/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@student.com', password: 'password123' }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Status ${response.status}: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    assert(data.success && data.token, 'Login response missing token');
    studentToken = data.token;
  });

  // Admin API Tests
  console.log('\n👤 Admin API Tests:');

  await runTest('GET /api/students', async () => {
    const response = await fetch(`${API_URL}/api/students`);
    assert(response.ok, `Failed with status ${response.status}`);
    const data = await response.json();
    assert(data.success && Array.isArray(data.students), 'Invalid response format');
  });

  await runTest('GET /api/attendance', async () => {
    const response = await fetch(`${API_URL}/api/attendance`);
    assert(response.ok, `Failed with status ${response.status}`);
    const data = await response.json();
    assert(data.success, 'Invalid response format');
  });

  await runTest('GET /api/reports/dashboard', async () => {
    const response = await fetch(`${API_URL}/api/reports/dashboard`);
    assert(response.ok, `Failed with status ${response.status}`);
    const data = await response.json();
    assert(data.success && data.dashboard, 'Invalid response format');
  });

  // Student Portal API Tests
  console.log('\n🎓 Student Portal API Tests:');

  await runTest('GET /api/student/attendance', async () => {
    assert(!!studentToken, 'No student token available');
    const response = await fetch(`${API_URL}/api/student/attendance`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Status ${response.status}: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    assert(data.success, 'Invalid response format');
  });

  await runTest('GET /api/student/notifications', async () => {
    assert(!!studentToken, 'No student token available');
    const response = await fetch(`${API_URL}/api/student/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Status ${response.status}: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    assert(data.success, 'Invalid response format');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log(`🧪 SAMS System Test Suite`);
  console.log(`   Total Tests: ${total}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${total - passed}`);
  console.log(`   Duration: ${totalDuration}ms`);
  console.log('='.repeat(50));

  if (passed === total) {
    console.log('\n✅ All tests passed! System is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
