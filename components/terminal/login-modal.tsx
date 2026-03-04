'use client'

import { useState, useEffect, useRef } from 'react'

interface LoginModalProps {
  themeColor: string
  onLogin: (username: string, password: string) => Promise<void>
  onCancel: () => void
}

type Field = 'username' | 'password' | 'submit' | 'cancel'

export function LoginModal({ themeColor, onLogin, onCancel }: LoginModalProps) {
  const [selectedField, setSelectedField] = useState<Field>('username')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (isLoading) return

    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      return
    }

    switch (selectedField) {
      case 'username':
        if (e.key === 'ArrowDown' || e.key === 'Tab') {
          e.preventDefault()
          setSelectedField('password')
        } else if (e.key === 'Enter') {
          e.preventDefault()
          setSelectedField('submit')
        }
        break

      case 'password':
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedField('username')
        } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
          e.preventDefault()
          setSelectedField('submit')
        } else if (e.key === 'Enter') {
          e.preventDefault()
          await handleLogin()
        }
        break

      case 'submit':
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedField('password')
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setSelectedField('cancel')
        } else if (e.key === 'Enter') {
          e.preventDefault()
          await handleLogin()
        }
        break

      case 'cancel':
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setSelectedField('submit')
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedField('password')
        } else if (e.key === 'Enter') {
          e.preventDefault()
          onCancel()
        }
        break
    }
  }

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Введите логин и пароль')
      return
    }

    setIsLoading(true)
    try {
      await onLogin(username, password)
      // Успех - модальное окно закроется из родителя
    } catch (err: any) {
      setError(err?.message || 'Неверный логин или пароль')
    }
    setIsLoading(false)
  }

  const fieldStyle = (field: Field, label: string, isActive: boolean) => ({
    color: isActive ? '#000000' : themeColor,
    backgroundColor: isActive ? themeColor : 'transparent',
    padding: '0 8px',
    cursor: 'pointer',
  })

  const buttonStyle = (field: Field, label: string, isActive: boolean) => ({
    color: isActive ? '#000000' : themeColor,
    backgroundColor: isActive ? themeColor : 'transparent',
    padding: '0 16px',
    border: `2px solid ${themeColor}`,
    cursor: 'pointer',
    fontWeight: 'bold' as const,
  })

  return (
    <div
      className="login-modal-overlay"
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'monospace',
      }}
    >
      <div
        className="login-modal-window"
        style={{
          border: `3px double ${themeColor}`,
          backgroundColor: '#000000',
          padding: 0,
          minWidth: '420px',
          maxWidth: '500px',
          boxShadow: `0 0 20px ${themeColor}40, inset 0 0 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Заголовок окна */}
        <div
          style={{
            backgroundColor: themeColor,
            color: '#000000',
            padding: '4px 12px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            letterSpacing: '2px',
            textAlign: 'center' as const,
            fontSize: '14px',
          }}
        >
          ═══ BAJOUR SOCIAL v1.0.0 ═══
        </div>

        {/* Основной контент */}
        <div style={{ padding: '24px 32px' }}>
          {/* Декоративная линия */}
          <div
            style={{
              color: themeColor,
              marginBottom: '20px',
              textAlign: 'center' as const,
              fontSize: '12px',
            }}
          >
            {'═'.repeat(25)}
          </div>

          {/* ASCII арт */}
          <pre
            style={{
              color: themeColor,
              fontSize: '10px',
              lineHeight: '1.1',
              textAlign: 'center' as const,
              marginBottom: '20px',
              margin: '0 auto 20px',
              width: 'fit-content',
            }}
          >
            {`
  ██████╗ ██╗   ██╗██████╗ ███████╗██████╗ 
  ██╔══██╗╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗
  ██████╔╝ ╚████╔╝ ██████╔╝█████╗  ██████╔╝
  ██╔══██╗  ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗
  ██████╔╝   ██║   ██████╔╝███████╗██║  ██║
  ╚═════╝    ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝
            `.trim()}
          </pre>

          {/* Поля ввода */}
          <div style={{ marginBottom: '24px' }}>
            {/* Логин */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: themeColor,
                  marginBottom: '4px',
                  fontSize: '12px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1px',
                }}
              >
                {selectedField === 'username' ? '► ' : '  '}Username:
              </label>
              <input
                ref={selectedField === 'username' ? inputRef : null}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                onFocus={() => setSelectedField('username')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: selectedField === 'username' ? themeColor : 'transparent',
                  color: selectedField === 'username' ? '#000000' : themeColor,
                  border: `2px solid ${themeColor}`,
                  padding: '8px 12px',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box' as const,
                  textTransform: 'uppercase' as const,
                }}
              />
            </div>

            {/* Пароль */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: themeColor,
                  marginBottom: '4px',
                  fontSize: '12px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1px',
                }}
              >
                {selectedField === 'password' ? '► ' : '  '}Password:
              </label>
              <input
                ref={selectedField === 'password' ? inputRef : null}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setSelectedField('password')}
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: selectedField === 'password' ? themeColor : 'transparent',
                  color: selectedField === 'password' ? '#000000' : themeColor,
                  border: `2px solid ${themeColor}`,
                  padding: '8px 12px',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>

            {/* Сообщение об ошибке */}
            {error && (
              <div
                style={{
                  color: '#FF5555',
                  fontSize: '12px',
                  marginTop: '12px',
                  textAlign: 'center' as const,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1px',
                  animation: 'blink 1s infinite',
                }}
              >
                ⚠ {error} ⚠
              </div>
            )}

            {/* Индикатор загрузки */}
            {isLoading && (
              <div
                style={{
                  color: themeColor,
                  fontSize: '12px',
                  marginTop: '12px',
                  textAlign: 'center' as const,
                }}
              >
                <span style={{ animation: 'blink 0.5s infinite' }}>AUTHENTICATING...</span>
              </div>
            )}
          </div>

          {/* Декоративная линия */}
          <div
            style={{
              color: themeColor,
              marginBottom: '16px',
              textAlign: 'center' as const,
              fontSize: '12px',
            }}
          >
            {'─'.repeat(35)}
          </div>

          {/* Кнопки */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <button
              onFocus={() => setSelectedField('submit')}
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                ...buttonStyle('submit', 'LOGIN', selectedField === 'submit'),
                padding: '8px 24px',
                fontSize: '14px',
                textTransform: 'uppercase' as const,
                letterSpacing: '2px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {selectedField === 'submit' ? '◄' : ''} LOGIN {selectedField === 'submit' ? '►' : ''}
            </button>

            <button
              onFocus={() => setSelectedField('cancel')}
              onClick={onCancel}
              disabled={isLoading}
              style={{
                ...buttonStyle('cancel', 'CANCEL', selectedField === 'cancel'),
                padding: '8px 24px',
                fontSize: '14px',
                textTransform: 'uppercase' as const,
                letterSpacing: '2px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {selectedField === 'cancel' ? '◄' : ''} CANCEL {selectedField === 'cancel' ? '►' : ''}
            </button>
          </div>

          {/* Подсказки */}
          <div
            style={{
              color: themeColor,
              fontSize: '10px',
              textAlign: 'center' as const,
              opacity: 0.7,
              borderTop: `1px solid ${themeColor}40`,
              paddingTop: '12px',
              marginTop: '8px',
            }}
          >
            <span>↑↓ TAB</span>
            <span style={{ margin: '0 12px' }}>|</span>
            <span>ENTER: Select</span>
            <span style={{ margin: '0 12px' }}>|</span>
            <span>ESC: Cancel</span>
          </div>
        </div>

        {/* Нижний бордюр */}
        <div
          style={{
            color: themeColor,
            textAlign: 'center' as const,
            fontSize: '10px',
            padding: '4px 0',
            borderTop: `1px solid ${themeColor}40`,
          }}
        >
          PRESS F1 FOR HELP
        </div>
      </div>

      {/* CSS анимации */}
      <style jsx global>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        
        .login-modal-overlay input:focus {
          animation: none !important;
        }
        
        .login-modal-overlay input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
