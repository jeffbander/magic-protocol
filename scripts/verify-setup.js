#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks that all required environment variables and dependencies are configured
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

console.log('🔍 Verifying Protocol Extractor Setup...\n');

// Check 1: .env.local exists
console.log('1️⃣  Checking environment file...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check for required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY'
  ];

  const missingVars = [];
  const emptyVars = [];
  const placeholderVars = [];
  const PLACEHOLDER_PATTERNS = ['your-', 'your_', 'xxx', 'placeholder', 'changeme', 'example'];

  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    } else {
      // Check if it has a value
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (!match || !match[1] || match[1].trim() === '') {
        emptyVars.push(varName);
      } else {
        const value = match[1].trim().toLowerCase();
        if (PLACEHOLDER_PATTERNS.some(p => value.includes(p))) {
          placeholderVars.push(varName);
        }
      }
    }
  });

  if (missingVars.length > 0) {
    checks.failed.push(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  } else if (emptyVars.length > 0 || placeholderVars.length > 0) {
    const unfilled = [...emptyVars, ...placeholderVars];
    checks.warnings.push(`⚠️  Environment variables need real values: ${unfilled.join(', ')}`);
  } else {
    checks.passed.push('✅ All environment variables configured');
  }
} else {
  checks.failed.push('❌ .env.local file not found');
}

// Check 2: Migration file exists
console.log('2️⃣  Checking database migration...');
const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  if (migrationContent.includes('CREATE TABLE public.users') &&
      migrationContent.includes('CREATE TABLE public.studies')) {
    checks.passed.push('✅ Database migration file is valid');
  } else {
    checks.warnings.push('⚠️  Migration file may be incomplete');
  }
} else {
  checks.failed.push('❌ Migration file not found at supabase/migrations/001_initial_schema.sql');
}

// Check 3: node_modules
console.log('3️⃣  Checking dependencies...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  // Check for key dependencies
  const keyDeps = ['next', '@supabase/supabase-js', '@anthropic-ai/sdk'];
  const missingDeps = keyDeps.filter(dep =>
    !fs.existsSync(path.join(nodeModulesPath, dep))
  );

  if (missingDeps.length > 0) {
    checks.failed.push(`❌ Missing dependencies: ${missingDeps.join(', ')}. Run: npm install`);
  } else {
    checks.passed.push('✅ All dependencies installed');
  }
} else {
  checks.failed.push('❌ node_modules not found. Run: npm install');
}

// Check 4: Required directories
console.log('4️⃣  Checking project structure...');
const requiredDirs = [
  'app',
  'components',
  'lib',
  'types',
  'supabase/migrations'
];

const missingDirs = requiredDirs.filter(dir =>
  !fs.existsSync(path.join(process.cwd(), dir))
);

if (missingDirs.length > 0) {
  checks.failed.push(`❌ Missing directories: ${missingDirs.join(', ')}`);
} else {
  checks.passed.push('✅ Project structure is complete');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(60) + '\n');

if (checks.passed.length > 0) {
  console.log('✅ PASSED:\n');
  checks.passed.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (checks.warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  checks.warnings.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

if (checks.failed.length > 0) {
  console.log('❌ FAILED:\n');
  checks.failed.forEach(msg => console.log(`   ${msg}`));
  console.log('');
}

// Overall status
console.log('='.repeat(60));
if (checks.failed.length === 0 && checks.warnings.length === 0) {
  console.log('✨ Setup verification PASSED! You\'re ready to start development.\n');
  console.log('📝 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open: http://localhost:3000');
  console.log('   3. Sign up and test the application\n');
  process.exit(0);
} else if (checks.failed.length === 0) {
  console.log('⚠️  Setup has warnings. Review them and proceed carefully.\n');
  console.log('📝 To fix warnings:');
  console.log('   1. Fill in all values in .env.local');
  console.log('   2. Follow SETUP.md for detailed instructions\n');
  process.exit(0);
} else {
  console.log('❌ Setup verification FAILED. Fix the issues above before continuing.\n');
  console.log('📚 For help, see:');
  console.log('   - SETUP.md (detailed setup instructions)');
  console.log('   - README.md (project overview)\n');
  process.exit(1);
}
