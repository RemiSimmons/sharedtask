/**
 * CRITICAL SECURITY MIGRATION: Hash Project Passwords
 * 
 * This script finds all projects with plaintext passwords and hashes them.
 * 
 * Usage:
 *   npm install -g tsx
 *   tsx scripts/migrate-project-passwords.ts
 * 
 * OR:
 *   npx tsx scripts/migrate-project-passwords.ts
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

interface Project {
  id: string
  name: string
  admin_password: string | null
  created_at: string
}

async function identifyPlaintextPasswords(): Promise<Project[]> {
  console.log('\n🔍 Scanning for projects with plaintext passwords...\n')
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, admin_password, created_at')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Database error:', error)
    process.exit(1)
  }
  
  if (!projects || projects.length === 0) {
    console.log('✅ No projects found in database\n')
    return []
  }
  
  // Identify projects with plaintext passwords
  const plaintext: Project[] = []
  const hashed: Project[] = []
  const noPassword: Project[] = []
  
  for (const project of projects) {
    if (!project.admin_password || project.admin_password === 'no_password_set') {
      noPassword.push(project)
    } else if (project.admin_password.match(/^\$2[aby]\$/)) {
      // Already a bcrypt hash
      hashed.push(project)
    } else if (project.admin_password.length < 60) {
      // Likely plaintext (bcrypt hashes are 60 chars)
      plaintext.push(project)
    } else {
      hashed.push(project)
    }
  }
  
  console.log('📊 PASSWORD STATUS REPORT')
  console.log('═'.repeat(50))
  console.log(`Total projects:          ${projects.length}`)
  console.log(`✅ Properly hashed:      ${hashed.length}`)
  console.log(`🔓 No password set:      ${noPassword.length}`)
  console.log(`🔴 PLAINTEXT (DANGER):   ${plaintext.length}`)
  console.log('═'.repeat(50))
  console.log()
  
  if (plaintext.length > 0) {
    console.log('⚠️  PROJECTS WITH PLAINTEXT PASSWORDS:')
    plaintext.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id.substring(0, 8)}...)`)
      console.log(`      Password length: ${p.admin_password?.length} chars`)
      console.log(`      Created: ${new Date(p.created_at).toLocaleDateString()}`)
    })
    console.log()
  }
  
  return plaintext
}

async function hashProjectPassword(projectId: string, plaintextPassword: string): Promise<boolean> {
  try {
    // Hash the password with bcrypt (cost factor 12 for strong security)
    const hashedPassword = await bcrypt.hash(plaintextPassword, 12)
    
    // Update the project with the hashed password
    const { error } = await supabase
      .from('projects')
      .update({ admin_password: hashedPassword })
      .eq('id', projectId)
    
    if (error) {
      console.error(`   ❌ Failed to update project ${projectId}:`, error.message)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`   ❌ Error hashing password:`, error)
    return false
  }
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('  🔐 PROJECT PASSWORD MIGRATION TOOL')
  console.log('  Critical Security Fix: Hash Plaintext Passwords')
  console.log('='.repeat(70) + '\n')
  
  // Identify projects with plaintext passwords
  const plaintextProjects = await identifyPlaintextPasswords()
  
  if (plaintextProjects.length === 0) {
    console.log('✅ All project passwords are already secure!')
    console.log('   No migration needed.\n')
    return
  }
  
  console.log('⚠️  WARNING: This will permanently replace plaintext passwords with hashes.')
  console.log('   Original passwords cannot be recovered after this operation.')
  console.log('   Make sure you have a database backup before proceeding!\n')
  
  const shouldProceed = await confirm('Do you want to proceed with the migration?')
  
  if (!shouldProceed) {
    console.log('\n❌ Migration cancelled by user.\n')
    return
  }
  
  console.log('\n🔄 Starting migration...\n')
  
  let successCount = 0
  let failCount = 0
  
  for (const project of plaintextProjects) {
    process.stdout.write(`   Hashing password for "${project.name}"... `)
    
    const success = await hashProjectPassword(project.id, project.admin_password!)
    
    if (success) {
      console.log('✅ Done')
      successCount++
    } else {
      console.log('❌ Failed')
      failCount++
    }
  }
  
  console.log('\n' + '═'.repeat(70))
  console.log('  MIGRATION COMPLETE')
  console.log('═'.repeat(70))
  console.log(`✅ Successfully migrated: ${successCount} project(s)`)
  if (failCount > 0) {
    console.log(`❌ Failed to migrate:     ${failCount} project(s)`)
  }
  console.log()
  
  // Verify the migration
  console.log('🔍 Verifying migration...\n')
  const remainingPlaintext = await identifyPlaintextPasswords()
  
  if (remainingPlaintext.length === 0) {
    console.log('✅ SUCCESS: All project passwords are now securely hashed!\n')
  } else {
    console.log(`⚠️  WARNING: ${remainingPlaintext.length} project(s) still have plaintext passwords.\n`)
    console.log('   Please review the errors above and retry the migration.\n')
  }
}

// Run the migration
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ CRITICAL ERROR:', error)
    process.exit(1)
  })



