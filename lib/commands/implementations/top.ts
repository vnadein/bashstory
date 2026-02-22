import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export async function cmdTop(args: string[]): Promise<CommandResult> {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: top',
        '',
        'Мониторинг процессов в реальном времени.',
        'Показывает загрузку сервера и активные команды пользователей.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Управление:',
        '  q              выйти из режима top',
      ],
    }
  }
  
  const db = getDb()

  let loadAvg = '0.00, 0.00, 0.00'
  let totalProcs = 0
  
  try {
    const { stdout } = await execPromise('uptime')
    const loadMatch = stdout.match(/load average: ([\d.]+), ([\d.]+), ([\d.]+)/)
    if (loadMatch) {
      loadAvg = `${loadMatch[1]}, ${loadMatch[2]}, ${loadMatch[3]}`
    }
  } catch {
    loadAvg = 'N/A'
  }
  
  try {
    const { stdout } = await execPromise('ps aux | wc -l')
    totalProcs = parseInt(stdout.trim(), 10) || 0
  } catch {
    totalProcs = 0
  }
  
  const processes = db.prepare(`
    SELECT pid, command, user, cpu, memory, status, created_at
    FROM processes
    WHERE status = 'running'
    ORDER BY cpu DESC
    LIMIT 15
  `).all() as Array<{
    pid: number
    command: string
    user: string
    cpu: number
    memory: number
    status: string
    created_at: string
  }>
  
  const systemProcs = [
    { pid: 1, command: 'init', user: 'root', cpu: 0.1, memory: 0.5 },
    { pid: 2, command: 'kthreadd', user: 'root', cpu: 0.0, memory: 0.0 },
    { pid: 45, command: 'bashjournal-server', user: 'www-data', cpu: 2.3, memory: 4.2 },
    { pid: 128, command: 'node --next-dev', user: 'www-data', cpu: 5.1, memory: 8.7 },
  ]
  
  const allProcs = [...systemProcs, ...processes.map(p => ({
    pid: p.pid,
    command: p.command,
    user: p.user,
    cpu: p.cpu,
    memory: p.memory,
  }))]
  
  allProcs.sort((a, b) => b.cpu - a.cpu)
  const topProcs = allProcs.slice(0, 15)
  
  const lines = [
    `top - ${new Date().toLocaleTimeString('ru-RU')} up 1 day,  2:34,  1 user,  load average: ${loadAvg}`,
    `Tasks: ${topProcs.length} total,   ${topProcs.filter(p => p.cpu > 0).length} running,   0 sleeping,   0 stopped,   0 zombie`,
    `%Cpu(s):  ${topProcs.reduce((sum, p) => sum + p.cpu, 0).toFixed(1)} us,  1.2 sy,  0.0 ni,  ${Math.max(0, 100 - topProcs.reduce((sum, p) => sum + p.cpu, 0)).toFixed(1)} id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st`,
    'MiB Mem :   8192.0 total,   2048.0 free,   1536.0 used,   4608.0 buff/cache',
    'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   6144.0 avail Mem',
    '',
    `  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND`,
  ]
  
  for (const proc of topProcs) {
    const virt = (proc.memory * 100 + Math.random() * 50000).toFixed(0)
    const res = (proc.memory * 50 + Math.random() * 10000).toFixed(0)
    const shr = (Math.random() * 5000).toFixed(0)
    const time = `${(Math.random() * 10).toFixed(1)}:00`
    lines.push(`  ${proc.pid.toString().padStart(5)} ${proc.user.padEnd(9)}  ${proc.cpu.toFixed(1).padStart(4)}   0  ${virt.padStart(7)} ${res.padStart(7)} ${shr.padStart(7)} R   ${proc.cpu.toFixed(1).padStart(4)}   ${proc.memory.toFixed(1)}   ${time.padStart(7)} ${proc.command}`)
  }
  
  return { output: lines }
}
