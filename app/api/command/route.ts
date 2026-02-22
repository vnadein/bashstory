import { NextRequest, NextResponse } from 'next/server'
import { executeCommand, registerProcess, removeProcess, cleanOldProcesses } from '@/lib/commands/dispatcher'
import { getSession, deleteSession, cleanOldSessions } from '@/lib/session'
import { cookies } from 'next/headers'

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

    let session = getSession(sessionToken || null)
    session.ip = getIp(request)

    cleanOldSessions()

    const skipProcessCommands = ['theme', 'clear', 'help', 'whoami', 'exit', 'logout', 'top', 'tail']
    let pid: number | null = null

    if ((command?.toLowerCase() === 'top' || command?.toLowerCase() === 'tail') && phase === 'update') {
    } else if (!skipProcessCommands.includes(command?.toLowerCase().split(/\s+/)[0] || '')) {
      pid = registerProcess(command || '', session.username || 'guest')
    }

    const result = await executeCommand(command || '', session, {
      phase,
      args,
      submitText,
    })

    if (pid) {
      removeProcess(pid)
    }

    const response = NextResponse.json(result)

    if (phase === 'login' && result.newPrompt) {
      const username = args?.[0]
      if (username) {
        const db = await import('@/lib/db')
        const user = db.getDb().prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
        if (user) {
          const { createSession } = await import('@/lib/session')
          const token = createSession(user.id)
          response.cookies.set('session_token', token, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
          })
        }
      }
    }

    if (phase === 'register' && result.newPrompt) {
      const username = args?.[0]
      if (username) {
        const db = await import('@/lib/db')
        const user = db.getDb().prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
        if (user) {
          const { createSession } = await import('@/lib/session')
          const token = createSession(user.id)
          response.cookies.set('session_token', token, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
          })
        }
      }
    }

    if ((command === 'logout' || command === 'exit') && result.newPrompt) {
      if (sessionToken) {
        deleteSession(sessionToken)
      }
      response.cookies.delete('session_token')
      response.cookies.delete('theme_color')
    }

    if (command === 'reboot') {
      if (sessionToken) {
        deleteSession(sessionToken)
      }
      response.cookies.delete('session_token')
      response.cookies.delete('theme_color')
    }

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
