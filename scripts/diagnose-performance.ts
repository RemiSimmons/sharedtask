#!/usr/bin/env ts-node
/**
 * Performance Diagnostic Script
 * 
 * This script helps identify performance bottlenecks in the SharedTask platform.
 * 
 * IMPORTANT: Make sure your .env.local file is configured with Supabase credentials.
 * 
 * Run with: npx tsx scripts/diagnose-performance.ts
 * 
 * Or if you have tsx installed: npm install -g tsx && tsx scripts/diagnose-performance.ts
 */

// Load environment variables (Next.js style - check for .env.local)
import { readFileSync } from 'fs'
import { join } from 'path'

try {
  const envLocal = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  envLocal.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && !key.startsWith('#')) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  })
} catch (e) {
  console.warn('⚠️  Could not load .env.local - make sure it exists with Supabase credentials')
}

import { systemMonitor } from '../lib/system-monitor'
import { supabaseAdmin } from '../lib/supabase'

interface DiagnosticResult {
  category: string
  status: 'healthy' | 'warning' | 'critical'
  message: string
  details?: any
}

async function diagnosePerformance(): Promise<void> {
  console.log('🔍 Starting Performance Diagnostics...\n')
  
  const results: DiagnosticResult[] = []

  // 1. Check System Memory
  console.log('1️⃣ Checking System Memory...')
  try {
    const memUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const rssMB = Math.round(memUsage.rss / 1024 / 1024)
    
    // Detect memory limit
    let memoryLimitMB = 1024 // Default
    if (process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) {
      memoryLimitMB = parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) || 1024
    }
    
    const memoryPercentage = Math.round((heapUsedMB / memoryLimitMB) * 100)
    
    results.push({
      category: 'Memory',
      status: memoryPercentage > 90 ? 'critical' : memoryPercentage > 75 ? 'warning' : 'healthy',
      message: `Memory Usage: ${memoryPercentage}% (${heapUsedMB}MB / ${memoryLimitMB}MB)`,
      details: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${rssMB}MB`,
        memoryLimit: `${memoryLimitMB}MB`,
        percentage: memoryPercentage
      }
    })
    
    console.log(`   ✅ Heap Used: ${heapUsedMB}MB`)
    console.log(`   ✅ Heap Total: ${heapTotalMB}MB`)
    console.log(`   ✅ RSS: ${rssMB}MB`)
    console.log(`   ✅ Memory Limit: ${memoryLimitMB}MB`)
    console.log(`   ${memoryPercentage > 90 ? '🔴' : memoryPercentage > 75 ? '🟡' : '🟢'} Usage: ${memoryPercentage}%\n`)
  } catch (error) {
    results.push({
      category: 'Memory',
      status: 'critical',
      message: 'Failed to check memory',
      details: { error: error instanceof Error ? error.message : String(error) }
    })
  }

  // 2. Check Database Performance
  console.log('2️⃣ Checking Database Performance...')
  try {
    const startTime = Date.now()
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
    const responseTime = Date.now() - startTime
    
    if (error) {
      results.push({
        category: 'Database',
        status: 'critical',
        message: 'Database connection failed',
        details: { error: error.message }
      })
      console.log(`   🔴 Database Error: ${error.message}\n`)
    } else {
      results.push({
        category: 'Database',
        status: responseTime > 500 ? 'critical' : responseTime > 200 ? 'warning' : 'healthy',
        message: `Database Response Time: ${responseTime}ms`,
        details: { responseTime }
      })
      console.log(`   ${responseTime > 500 ? '🔴' : responseTime > 200 ? '🟡' : '🟢'} Response Time: ${responseTime}ms\n`)
    }
  } catch (error) {
    results.push({
      category: 'Database',
      status: 'critical',
      message: 'Database check failed',
      details: { error: error instanceof Error ? error.message : String(error) }
    })
    console.log(`   🔴 Error: ${error instanceof Error ? error.message : String(error)}\n`)
  }

  // 3. Check System Health via Monitor
  console.log('3️⃣ Checking System Health...')
  try {
    const systemHealth = await systemMonitor.getSystemHealth()
    
    // Map 'degraded' to 'warning' for diagnostic result
    const diagnosticStatus = systemHealth.status === 'degraded' ? 'warning' : systemHealth.status
    
    results.push({
      category: 'System Health',
      status: diagnosticStatus,
      message: `System Status: ${systemHealth.status.toUpperCase()}`,
      details: {
        database: systemHealth.database.status,
        memory: `${systemHealth.memory.percentage}%`,
        cpu: `${systemHealth.cpu.percentage}%`,
        errorRate: `${systemHealth.errorRate}%`,
        uptime: `${Math.round(systemHealth.uptime)}s`
      }
    })
    
    console.log(`   Status: ${systemHealth.status.toUpperCase()}`)
    console.log(`   Database: ${systemHealth.database.status} (${systemHealth.database.responseTime}ms)`)
    console.log(`   Memory: ${systemHealth.memory.percentage}%`)
    console.log(`   CPU: ${systemHealth.cpu.percentage}%`)
    console.log(`   Error Rate: ${systemHealth.errorRate}%\n`)
  } catch (error) {
    results.push({
      category: 'System Health',
      status: 'critical',
      message: 'System health check failed',
      details: { error: error instanceof Error ? error.message : String(error) }
    })
    console.log(`   🔴 Error: ${error instanceof Error ? error.message : String(error)}\n`)
  }

  // 4. Check Application Logs Table Size
  console.log('4️⃣ Checking Application Logs...')
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error } = await supabaseAdmin
      .from('application_logs')
      .select('*', { count: 'exact' })
      .gte('timestamp', oneHourAgo)
    
    if (error) {
      console.log(`   ⚠️  Could not check logs: ${error.message}\n`)
    } else {
      const logCount = count || 0
      results.push({
        category: 'Application Logs',
        status: logCount > 10000 ? 'warning' : 'healthy',
        message: `Logs in last hour: ${logCount}`,
        details: { count: logCount }
      })
      console.log(`   ${logCount > 10000 ? '🟡' : '🟢'} Logs (last hour): ${logCount}\n`)
    }
  } catch (error) {
    console.log(`   ⚠️  Could not check logs: ${error instanceof Error ? error.message : String(error)}\n`)
  }

  // 5. Summary
  console.log('📊 Diagnostic Summary:\n')
  const critical = results.filter(r => r.status === 'critical')
  const warnings = results.filter(r => r.status === 'warning')
  const healthy = results.filter(r => r.status === 'healthy')
  
  console.log(`   🔴 Critical Issues: ${critical.length}`)
  critical.forEach(r => {
    console.log(`      - ${r.category}: ${r.message}`)
  })
  
  console.log(`\n   🟡 Warnings: ${warnings.length}`)
  warnings.forEach(r => {
    console.log(`      - ${r.category}: ${r.message}`)
  })
  
  console.log(`\n   🟢 Healthy: ${healthy.length}`)
  healthy.forEach(r => {
    console.log(`      - ${r.category}: ${r.message}`)
  })

  // Recommendations
  console.log('\n💡 Recommendations:')
  
  if (critical.length > 0) {
    console.log('\n   ⚠️  CRITICAL ISSUES DETECTED:')
    critical.forEach(r => {
      if (r.category === 'Memory' && r.details?.percentage > 90) {
        console.log('      - Memory usage is critically high. Consider:')
        console.log('        • Reducing database query frequency')
        console.log('        • Implementing better caching')
        console.log('        • Reviewing for memory leaks')
      }
      if (r.category === 'Database') {
        console.log('      - Database performance issues detected. Consider:')
        console.log('        • Checking database connection pool')
        console.log('        • Reviewing slow queries')
        console.log('        • Adding database indexes')
      }
    })
  }
  
  if (warnings.length > 0) {
    console.log('\n   ⚠️  WARNINGS:')
    warnings.forEach(r => {
      if (r.category === 'Memory' && r.details?.percentage > 75) {
        console.log('      - Memory usage is elevated. Monitor closely.')
      }
      if (r.category === 'Application Logs' && r.details?.count > 10000) {
        console.log('      - High log volume. Consider log rotation or archiving.')
      }
    })
  }
  
  if (critical.length === 0 && warnings.length === 0) {
    console.log('\n   ✅ No critical issues detected. System appears healthy!')
  }
  
  console.log('\n✅ Diagnostics complete!\n')
}

// Run diagnostics
diagnosePerformance().catch(error => {
  console.error('❌ Diagnostic script failed:', error)
  process.exit(1)
})

