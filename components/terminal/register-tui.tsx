'use client'

import { useState, useEffect } from 'react'

interface RegisterTuiProps {
  themeColor: string
  onRegister: (username: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  onExit: () => void
  onRegisterSuccess?: () => void
}

type Field = 'username' | 'password' | 'confirm' | 'register' | 'cancel'

export function RegisterTui({ themeColor, onRegister, onExit, onRegisterSuccess }: RegisterTuiProps) {
  const [selectedField, setSelectedField] = useState<Field>('username')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Принудительный сброс при монтировании
  useEffect(() => {
    setSelectedField('username')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setError('')
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
      if (selectedField === 'username' || selectedField === 'password' || selectedField === 'confirm') {
        if (e.key === 'ArrowDown' || e.key === 'Tab') {
          e.preventDefault()
          if (selectedField === 'username') setSelectedField('password')
          else if (selectedField === 'password') setSelectedField('confirm')
          else setSelectedField('register')
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          if (selectedField === 'username') setSelectedField('cancel')
          else if (selectedField === 'password') setSelectedField('username')
          else setSelectedField('password')
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          // Переход к следующему полю или регистрация
          if (selectedField === 'username') {
            setSelectedField('password')
          } else if (selectedField === 'password') {
            setSelectedField('confirm')
          } else if (selectedField === 'confirm') {
            setSelectedField('register')
          } else {
            await handleRegister()
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
        if (selectedField === 'confirm') {
          if (e.key === 'Backspace') {
            e.preventDefault()
            setConfirmPassword(prev => prev.slice(0, -1))
            return
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault()
            setConfirmPassword(prev => prev + e.key)
            return
          }
        }
      }

      // Навигация по кнопкам
      switch (selectedField) {
        case 'register':
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setSelectedField('cancel')
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            setSelectedField('cancel')
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedField('confirm')
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedField('cancel')
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            await handleRegister()
          } else if (e.key === 'Tab') {
            e.preventDefault()
            setSelectedField('cancel')
          }
          break

        case 'cancel':
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setSelectedField('register')
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            setSelectedField('register')
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedField('register')
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedField('username')
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onExit()
          } else if (e.key === 'Tab') {
            e.preventDefault()
            setSelectedField('register')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedField, username, password, confirmPassword, isLoading, onExit])

  const handleRegister = async () => {
    if (!username.trim() || !password || !confirmPassword) {
      setError('Заполните все поля')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 4) {
      setError('Пароль должен быть не менее 4 символов')
      return
    }

    setIsLoading(true)
    setError('')
    const result = await onRegister(username, password, confirmPassword)
    if (result.success && onRegisterSuccess) {
      setError('')
      onRegisterSuccess()
    } else if (result.error) {
      setError(result.error)
    } else {
      setError('Ошибка регистрации')
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

  const renderButton = (field: Field, label: string, isRegister = false) => {
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
        marginLeft: isRegister ? '71px' : '0',
      }}>
        {label}
      </span>
    )
  }

  return (
    <div
      className="register-tui-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0C0C0C',
        padding: '20px',
      }}
    >
      {/* Главное окно в стиле DOS */}
      <div style={{
        backgroundColor: '#0a0a0a',
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
          {/* ASCII декорация REGISTER */}
          <pre style={{
            color: themeColor,
            fontSize: '7px',
            lineHeight: '1.1',
            textAlign: 'center',
            marginBottom: '16px',
            margin: '0 auto 16px',
            width: 'fit-content',
            fontWeight: 'bold',
          }}>
{`
██████╗   ███████╗   ██████╗   ██╗  ███████╗  ████████╗  ███████╗  ██████╗ 
██╔══██╗  ██╔════╝  ██╔════╝   ██║  ██╔════╝  ╚══██╔══╝  ██╔════╝  ██╔══██╗
██████╔╝  █████╗    ██║  ███╗  ██║  ███████╗     ██║     █████╗    ██████╔╝
██╔══██╗  ██╔══╝    ██║   ██║  ██║  ╚════██║     ██║     ██╔══╝    ██╔══██╗
██║  ██║  ███████╗  ╚██████╔╝  ██║  ███████║     ██║     ███████╗  ██║  ██║
╚═╝  ╚═╝  ╚══════╝   ╚═════╝   ╚═╝  ╚══════╝     ╚═╝     ╚══════╝  ╚═╝  ╚═╝
`}
          </pre>

          {/* Поля ввода */}
          <div style={{ marginBottom: '16px' }}>
            {renderField('username', 'LOGIN', username, 'text')}
            {renderField('password', 'PASSW', password, 'password')}
            {renderField('confirm', 'CONFIRM', confirmPassword, 'password')}
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
                REGISTERING...
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
            {renderButton('register', 'REGISTER', true)}
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
          <span>Enter - Next</span>
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
