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
  cmdFinger,
  cmdWhois,
  cmdUsers,
  cmdPost,
  cmdPosts,
  cmdTimeline,
  cmdReply,
  cmdReplyComment,
  cmdShare,
  cmdAllPosts,
  cmdPostText,
  cmdReadPost,
  cmdFollow,
  cmdUnfollow,
  cmdFollowers,
  cmdFollowing,
  cmdMsg,
  cmdMail,
  cmdRead,
  cmdMentions,
  cmdNotify,
  cmdSetBio,
  cmdBlock,
  cmdSearch,
  cmdTrending,
  cmdLike,
  cmdUnlike,
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
  if (meta?.phase === 'post-text') {
    return cmdPostText(meta.submitText || '', session)
  }

  const trimmed = rawCommand.trim()
  if (!trimmed) return { output: [] }

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  switch (cmd) {
    case 'help':
      return cmdHelp(args, session)
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
    case 'finger':
      return cmdFinger(args, session)
    case 'whois':
      return cmdWhois(args, session)
    case 'users':
      return cmdUsers(args, session)
    case 'post':
      return cmdPost(args, session)
    case 'posts':
      return cmdPosts(args, session)
    case 'allposts':
    case 'global':
      return cmdAllPosts(args, session)
    case 'timeline':
    case 'feed':
      return cmdTimeline(args, session)
    case 'reply':
      return cmdReply(args, session)
    case 'replyc':
      return cmdReplyComment(args, session)
    case 'share':
    case 'retweet':
      return cmdShare(args, session)
    case 'read':
    case 'readpost':
      return cmdReadPost(args, session)
    case 'readmsg':
      return cmdRead(args, session)
    case 'follow':
      return cmdFollow(args, session)
    case 'unfollow':
      return cmdUnfollow(args, session)
    case 'followers':
      return cmdFollowers(args, session)
    case 'following':
      return cmdFollowing(args, session)
    case 'msg':
    case 'message':
      return cmdMsg(args, session)
    case 'mail':
    case 'inbox':
      return cmdMail(args, session)
    case 'readmsg':
    case 'read':
      return cmdRead(args, session)
    case 'readpost':
      return cmdReadPost(args, session)
    case 'mentions':
      return cmdMentions(args, session)
    case 'notify':
      return cmdNotify(args, session)
    case 'set_bio':
      return cmdSetBio(args, session)
    case 'block':
      return cmdBlock(args, session)
    case 'search':
      return cmdSearch(args, session)
    case 'trending':
      return cmdTrending(args, session)
    case 'like':
      return cmdLike(args, session)
    case 'unlike':
      return cmdUnlike(args, session)
    default:
      return { output: [`bash: команда не найдена: ${cmd}. Введите help для списка команд.`] }
  }
}
