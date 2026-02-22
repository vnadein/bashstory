import {
  CommandResult,
  CommandContext,
  CommandMeta,
  cmdHelp,
  cmdWhoami,
  cmdClear,
  cmdLoginStart,
  cmdLoginProcess,
  cmdRegisterStart,
  cmdRegisterProcess,
  cmdTheme,
  cmdReboot,
  cmdTop,
  cmdLogout,
  cmdPasswd,
  cmdPasswdCurrent,
  cmdPasswdNew,
} from './index'
import { getDb } from '@/lib/db'

export function registerProcess(command: string, user: string): number {
  const db = getDb()
  const pid = Math.floor(Math.random() * 30000) + 1000
  const cpu = Math.random() * 5
  const memory = Math.random() * 3
  
  db.prepare(`
    INSERT INTO processes (pid, command, user, cpu, memory, status)
    VALUES (?, ?, ?, ?, ?, 'running')
  `).run(pid, command, user, cpu, memory)
  
  return pid
}

export function removeProcess(pid: number): void {
  const db = getDb()
  db.prepare(`UPDATE processes SET status = 'completed' WHERE pid = ?`).run(pid)
}

export function cleanOldProcesses(): void {
  const db = getDb()
  db.prepare(`
    UPDATE processes 
    SET status = 'completed' 
    WHERE status = 'running' AND created_at < datetime('now', '-1 hour')
  `).run()
}

export async function executeCommand(
  rawCommand: string,
  session: CommandContext,
  meta?: CommandMeta
): Promise<CommandResult> {
  if (meta?.phase === 'login') {
    return cmdLoginProcess(meta.args || [], session)
  }
  if (meta?.phase === 'register') {
    return cmdRegisterProcess(meta.args || [], session)
  }
  if (meta?.phase === 'passwd-current') {
    return cmdPasswdCurrent(meta.args || [], session)
  }
  if (meta?.phase === 'passwd-new') {
    return cmdPasswdNew(meta.args || [], session)
  }

  const trimmed = rawCommand.trim()
  if (!trimmed) return { output: [] }

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  switch (cmd) {
    case 'help':
      return cmdHelp()
    case 'whoami':
      return cmdWhoami(session)
    case 'clear':
      return cmdClear()
    case 'login':
      return cmdLoginStart()
    case 'register':
      return cmdRegisterStart()
    case 'logout':
    case 'exit':
      return cmdLogout(session)
    case 'passwd':
      return cmdPasswd(args, session)
    case 'top':
      return await cmdTop(args)
    case 'theme':
      return cmdTheme(args)
    case 'reboot':
      return cmdReboot(session)
    default:
      return { output: [`bash: команда не найдена: ${cmd}. Введите help для списка команд.`] }
  }
}
