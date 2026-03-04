'use client'

import { useState, useEffect } from 'react'

interface LoginTuiProps {
  themeColor: string
  onLogin: (username: string, password: string) => Promise<boolean>
  onExit: () => void
  onLoginSuccess?: () => void
}

type Field = 'username' | 'password' | 'login' | 'cancel'

export function LoginTui({ themeColor, onLogin, onExit, onLoginSuccess }: LoginTuiProps) {
  const [selectedField, setSelectedField] = useState<Field>('username')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  // Принудительный сброс при монтировании
  useEffect(() => {
    setSelectedField('username')
    setUsername('')
    setPassword('')
    setError('')
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (isLoading) return

      // Предотвращаем системное поведение Tab и стрелок
      if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
      }

      // ESC - выход
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
        return
      }

      // F1 - помощь
      if (e.key === 'F1') {
        e.preventDefault()
        return
      }

      // Обработка ввода текста для полей
      if (selectedField === 'username' || selectedField === 'password') {
        if (e.key === 'ArrowDown' || e.key === 'Tab') {
          e.preventDefault()
          setSelectedField(selectedField === 'username' ? 'password' : 'login')
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedField(selectedField === 'password' ? 'username' : 'cancel')
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          // Если в username - переходим к password, если в password - логинимся
          if (selectedField === 'username') {
            setSelectedField('password')
          } else {
            await handleLogin()
          }
          return
        }
        
        // Ввод текста
        if (selectedField === 'username') {
          if (e.key === 'Backspace') {
            e.preventDefault()
            setUsername(prev => prev.slice(0, -1))
            return
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault()
            setUsername(prev => prev + e.key)
            return
          }
        }
        if (selectedField === 'password') {
          if (e.key === 'Backspace') {
            e.preventDefault()
            setPassword(prev => prev.slice(0, -1))
            return
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault()
            setPassword(prev => prev + e.key)
            return
          }
        }
      }

      // Навигация по кнопкам
      switch (selectedField) {
        case 'login':
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setSelectedField('cancel')
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            setSelectedField('cancel')
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedField('password')
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedField('cancel')
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            await handleLogin()
          } else if (e.key === 'Tab') {
            e.preventDefault()
            setSelectedField('cancel')
          }
          break

        case 'cancel':
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setSelectedField('login')
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            setSelectedField('login')
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedField('login')
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedField('username')
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onExit()
          } else if (e.key === 'Tab') {
            e.preventDefault()
            setSelectedField('login')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedField, username, password, isLoading, onExit])

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Введите логин и пароль')
      return
    }

    setIsLoading(true)
    setError('')
    const success = await onLogin(username, password)
    if (success && onLoginSuccess) {
      onLoginSuccess()
    } else {
      setError('Неверный логин или пароль')
    }
    setIsLoading(false)
  }

  const renderField = (field: Field, label: string, value: string, type: 'text' | 'password' = 'text') => {
    const isActive = selectedField === field
    const displayValue = type === 'password' ? '•'.repeat(value.length) : value
    
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '32px',
        }}>
          <span style={{ 
            minWidth: '80px', 
            textTransform: 'uppercase', 
            fontSize: '14px',
            color: themeColor,
            fontWeight: 'bold',
          }}>
            {label}:
          </span>
          <span style={{ 
            flex: 1, 
            backgroundColor: '#0a0a0a',
            color: themeColor,
            border: `1px solid ${themeColor}`,
            padding: '4px 8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '16px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
          }}>
            {displayValue}
            {isActive && (
              <span className="terminal-cursor" style={{ 
                backgroundColor: themeColor, 
                color: '#000000',
                width: '8px',
                height: '1.2em',
              }} />
            )}
          </span>
        </div>
      </div>
    )
  }

  const renderButton = (field: Field, label: string, isLogin = false) => {
    const isActive = selectedField === field
    return (
      <span style={{
        backgroundColor: isActive ? themeColor : '#0a0a0a',
        color: isActive ? '#000000' : themeColor,
        border: `2px solid ${themeColor}`,
        padding: '4px 28px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'monospace',
        minWidth: '100px',
        textAlign: 'center',
        marginLeft: isLogin ? '46px' : '0',
      }}>
        {label}
      </span>
    )
  }

  return (
    <div 
      className="login-tui-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0C0C0C', // Цвет фона терминала
        padding: '20px',
      }}
    >
      {/* Главное окно в стиле DOS */}
      <div style={{
        backgroundColor: '#0a0a0a', // Почти чёрный фон
        border: `2px solid ${themeColor}`,
        boxShadow: `0 0 20px ${themeColor}40, 4px 4px 0 ${themeColor}30`,
        padding: 0,
        minWidth: '400px',
        maxWidth: '480px',
      }}>
        {/* Заголовок окна - с темой */}
        <div style={{
          backgroundColor: themeColor,
          color: '#000000',
          padding: '4px 12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textAlign: 'center',
          fontSize: '14px',
          fontFamily: 'monospace',
          position: 'relative',
        }}>
          <span style={{ 
            backgroundColor: '#000000', 
            color: themeColor,
            padding: '2px 16px',
          }}>
            BAJOUR SOCIAL
          </span>
          {/* Уголки заголовка */}
          <span style={{ position: 'absolute', left: 0, top: 0 }}>╔</span>
          <span style={{ position: 'absolute', right: 0, top: 0 }}>╗</span>
        </div>

        {/* Основной контент */}
        <div style={{
          padding: '20px 24px',
        }}>
          {/* ASCII декорация LOGIN */}
          <pre style={{
            color: themeColor,
            fontSize: '8px',
            lineHeight: '1.2',
            textAlign: 'center',
            marginBottom: '16px',
            margin: '0 auto 16px',
            width: 'fit-content',
            fontWeight: 'bold',
          }}>
{`
██╗        ██████╗    ██████╗   ██╗  ███╗   ██╗
██║       ██╔═══██╗  ██╔════╝   ██║  ████╗  ██║
██║       ██║   ██║  ██║  ███╗  ██║  ██╔██╗ ██║
██║       ██║   ██║  ██║   ██║  ██║  ██║╚██╗██║
███████╗  ╚██████╔╝  ╚██████╔╝  ██║  ██║ ╚████║
╚══════╝   ╚═════╝    ╚═════╝   ╚═╝  ╚═╝  ╚═══╝
`}
          </pre>

          {/* Поля ввода */}
          <div style={{ marginBottom: '16px' }}>
            {renderField('username', 'LOGIN', username, 'text')}
            {renderField('password', 'PASSW', password, 'password')}
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div style={{
              backgroundColor: '#FF0000',
              color: '#FFFFFF',
              fontSize: '12px',
              padding: '6px 10px',
              textAlign: 'center',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
            }}>
              ⚠ {error} ⚠
            </div>
          )}

          {/* Индикатор загрузки */}
          {isLoading && (
            <div style={{
              color: themeColor,
              fontSize: '12px',
              textAlign: 'center',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontFamily: 'monospace',
            }}>
              <span style={{ animation: 'blink 0.5s infinite' }}>
                AUTHENTICATING...
              </span>
            </div>
          )}

          {/* Кнопки */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginTop: '24px',
            marginBottom: '8px',
          }}>
            {renderButton('login', 'LOGIN', true)}
            {renderButton('cancel', 'EXIT')}
          </div>
        </div>

        {/* Нижняя панель с подсказками */}
        <div style={{
          borderTop: `2px solid ${themeColor}`,
          padding: '4px 12px',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: themeColor,
        }}>
          <span>↑↓ - Navigation</span>
          <span>Enter - Select</span>
          <span>ESC - Exit</span>
        </div>
      </div>

      {/* CSS анимации */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
