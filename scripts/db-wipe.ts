import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const isForce = process.argv.includes('--force');

async function confirm(): Promise<boolean> {
  if (isForce) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('⚠️  Are you sure you want to wipe all data? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function wipe() {
  console.log('\n🗑️  Database Wipe Tool');
  console.log('='.repeat(40));

  const confirmed = await confirm();
  if (!confirmed) {
    console.log('❌ Wipe cancelled');
    process.exit(0);
  }

  console.log('\n🔄 Wiping database...');

  // Delete in correct order due to foreign key constraints
  const tables = ['notifications', 'attendance', 'students', 'admins'];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error(`   ❌ Error wiping ${table}:`, error.message);
    } else {
      console.log(`   ✅ Wiped ${table}`);
    }
  }

  console.log('\n✅ Database wiped successfully!');
}

wipe().catch(console.error);
