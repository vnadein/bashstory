import { NextRequest, NextResponse } from 'next/server'
import { executeCommand, registerProcess, removeProcess, cleanOldProcesses } from '@/lib/commands'
import { getDb } from '@/lib/db'
import { cookies } from 'next/headers'

function getSession() {
  const db = getDb()
  const cookieStore = cookies()

  // cookies() is async in Next.js 16, but we handle synchronously here via the API pattern
  let sessionToken: string | undefined
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = cookieStore as any
    if (store.then) {
      // Should not happen in route handler context
      sessionToken = undefined
    } else {
      sessionToken = store.get('session_token')?.value
    }
  } catch {
    sessionToken = undefined
  }

  if (!sessionToken) {
    return { userId: null, username: null, isModerator: false }
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(sessionToken) as {
    id: number; username: string; role: string
  } | undefined

  if (!user) {
    return { userId: null, username: null, isModerator: false }
  }

  return {
    userId: user.id,
    username: user.username,
    isModerator: user.role === 'admin',
  }
}

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, phase, args, submitText } = body

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    let session = { userId: null as number | null, username: null as string | null, isModerator: false }

    if (sessionToken) {
      const db = getDb()
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(sessionToken) as {
        id: number; username: string; role: string
      } | undefined

      if (user) {
        session = {
          userId: user.id,
          username: user.username,
          isModerator: user.role === 'admin',
        }
      }
    }

    const ip = getIp(request)

    const sessionData = {
      ...session,
      ip,
    }

    // Clean old processes
    cleanOldProcesses()

    // Register command as a process (except for theme and clear)
    const skipProcessCommands = ['theme', 'clear', 'help', 'whoami', 'exit', 'logout', 'top', 'tail']
    let pid: number | null = null

    // Don't register process for top/tail update phase
    if ((command?.toLowerCase() === 'top' || command?.toLowerCase() === 'tail') && phase === 'update') {
      // Skip process registration for auto-updates
    } else if (!skipProcessCommands.includes(command?.toLowerCase().split(/\s+/)[0] || '')) {
      pid = registerProcess(command || '', session.username || 'guest')
    }

    const result = await executeCommand(command || '', sessionData, {
      phase,
      args,
      submitText,
    })

    // Remove process after execution
    if (pid) {
      removeProcess(pid)
    }

    const response = NextResponse.json(result)

    // Set session cookie on successful login
    if (phase === 'login' && result.newPrompt) {
      const username = args?.[0]
      if (username) {
        response.cookies.set('session_token', username, {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    }

    // Set session cookie on successful register
    if (phase === 'register' && result.newPrompt) {
      const username = args?.[0]
      if (username) {
        response.cookies.set('session_token', username, {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    }

    // Clear session cookie on logout
    if ((command === 'logout' || command === 'exit') && result.newPrompt) {
      response.cookies.delete('session_token')
      response.cookies.delete('theme_color')
    }

    // Clear all cookies on reboot
    if (command === 'reboot') {
      response.cookies.delete('session_token')
      response.cookies.delete('theme_color')
    }

    // Set theme color cookie
    if (command === 'theme' && result.newPrompt) {
      response.cookies.set('theme_color', result.newPrompt, {
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    return response
  } catch (error) {
    console.error('Command error:', error)
    return NextResponse.json(
      { output: ['Внутренняя ошибка сервера.'], clear: false },
      { status: 500 }
    )
  }
}
