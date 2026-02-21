'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { BootScreen } from './boot-screen'

const ASCII_BANNER = [
  '',
  '██████╗  █████╗ ███████╗██╗  ██╗███████╗████████╗ ██████╗ ██████╗ ██╗   ██╗',
  '██╔══██╗██╔══██╗██╔════╝██║  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝',
  '██████╔╝███████║███████╗███████║███████╗   ██║   ██║   ██║██████╔╝ ╚████╔╝ ',
  '██╔══██╗██╔══██║╚════██║██╔══██║╚════██║   ██║   ██║   ██║██╔══██╗  ╚██╔╝  ',
  '██████╔╝██║  ██║███████║██║  ██║███████║   ██║   ╚██████╔╝██║  ██║   ██║   ',
  '╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ',
  '',
  'Добро пожаловать в BashStory v1.0',
  'Все права защищены.',
  '',
  'Введите help для списка команд.',
  '',
]

interface OutputLine {
  id: number
  text: string
  type: 'output' | 'command' | 'prompt'
}

type InputMode = null | 'login-username' | 'login-password' | 'register-username' | 'register-password1' | 'register-password2' | 'register-email' | 'submit'

type InteractiveMode = null | 'top' | 'tail'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

const DEFAULT_THEME_COLOR = '#4AFB7F'

// Available commands for autocomplete
const AVAILABLE_COMMANDS = [
  'help', 'login', 'register', 'logout', 'exit', 'reboot', 'whoami', 'clear', 'theme',
  'ls', 'cat', 'grep', 'top', 'tail', 'fortune', 'vote', 'cowsay', 'submit', 'nano',
  'queue', 'publish', 'reject',
]

export default function Terminal() {
  const [showBootScreen, setShowBootScreen] = useState(true)
  const [outputLines, setOutputLines] = useState<OutputLine[]>(() =>
    ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const }))
  )
  const [currentInput, setCurrentInput] = useState('')
  const [prompt, setPrompt] = useState('guest@bashstory:~$ ')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lineCounter, setLineCounter] = useState(ASCII_BANNER.length)
  const [isProcessing, setIsProcessing] = useState(false)
  const [themeColor, setThemeColor] = useState<string>(DEFAULT_THEME_COLOR)
  const [cursorPosition, setCursorPosition] = useState(0)

  // Tab completion state
  const [lastTabTime, setLastTabTime] = useState(0)
  const [lastTabPrefix, setLastTabPrefix] = useState('')
  const [suggestions, setSuggestions] = useState<string | null>(null)

  // Interactive mode (top, htop, etc.)
  const [interactiveMode, setInteractiveMode] = useState<InteractiveMode>(null)
  const [interactiveData, setInteractiveData] = useState<string[]>([])
  const interactiveInterval = useRef<NodeJS.Timeout | null>(null)

  // Multi-step input modes
  const [inputMode, setInputMode] = useState<InputMode>(null)
  const [currentPromptOverride, setCurrentPromptOverride] = useState<string | null>(null)
  const [tempData, setTempData] = useState<Record<string, string>>({})
  const [submitLines, setSubmitLines] = useState<string[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load theme from cookie on mount
  useEffect(() => {
    const savedColor = getCookie('theme_color')
    if (savedColor && /^#[0-9A-Fa-f]{6}$/.test(savedColor)) {
      setThemeColor(savedColor)
    }
  }, [])

  const nextId = useCallback(() => {
    setLineCounter((c) => c + 1)
    return lineCounter
  }, [lineCounter])

  const addLines = useCallback(
    (texts: string[], type: 'output' | 'command' | 'prompt' = 'output') => {
      setOutputLines((prev) => {
        let id = prev.length > 0 ? Math.max(...prev.map((l) => l.id)) + 1 : 0
        const newLines = texts.map((text) => ({ id: id++, text, type }))
        return [...prev, ...newLines]
      })
    },
    []
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [outputLines])

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [inputMode, outputLines.length, interactiveMode])

  // Cleanup interactive mode interval on unmount
  useEffect(() => {
    return () => {
      if (interactiveInterval.current) {
        clearInterval(interactiveInterval.current)
      }
    }
  }, [])

  const focusInput = () => {
    inputRef.current?.focus()
  }

  // Find matching commands for tab completion
  const findMatches = useCallback((prefix: string): string[] => {
    if (!prefix) return AVAILABLE_COMMANDS
    return AVAILABLE_COMMANDS.filter(cmd => cmd.startsWith(prefix.toLowerCase()))
  }, [])

  // Find common prefix among matches
  const findCommonPrefix = useCallback((matches: string[]): string => {
    if (matches.length === 0) return ''
    if (matches.length === 1) return matches[0]
    
    let common = matches[0]
    for (let i = 1; i < matches.length; i++) {
      const match = matches[i]
      let j = 0
      while (j < common.length && j < match.length && common[j] === match[j]) {
        j++
      }
      common = common.substring(0, j)
    }
    return common
  }, [])

  // Handle tab completion
  const handleTabCompletion = useCallback(() => {
    const input = inputRef.current
    if (!input) return

    const text = input.value
    const pos = input.selectionStart || 0
    
    // Get the word being typed (from start or after last space)
    const lastSpaceIndex = text.lastIndexOf(' ', pos)
    const wordStart = lastSpaceIndex + 1
    const currentWord = text.substring(wordStart, pos)
    
    // Don't show suggestions if no characters typed
    if (!currentWord) {
      return
    }
    
    const matches = findMatches(currentWord)
    const now = Date.now()
    
    if (matches.length === 0) {
      // No matches - do nothing
      return
    }
    
    if (matches.length === 1) {
      // Single match - complete it
      const completed = text.substring(0, wordStart) + matches[0] + text.substring(pos)
      setCurrentInput(completed)
      setCursorPosition(wordStart + matches[0].length)
      setLastTabTime(now)
      setLastTabPrefix(currentWord)
      return
    }
    
    // Multiple matches
    const commonPrefix = findCommonPrefix(matches)
    
    // If this is a second tab press within 2 seconds with same prefix, show all matches
    if (now - lastTabTime < 2000 && currentWord === lastTabPrefix && commonPrefix === currentWord) {
      // Show matches in horizontal format (like real terminal)
      const matchesLine = '  ' + matches.join('  ')
      setSuggestions(matchesLine)
      return
    }
    
    // Complete to common prefix
    if (commonPrefix.length > currentWord.length) {
      const completed = text.substring(0, wordStart) + commonPrefix + text.substring(pos)
      setCurrentInput(completed)
      setCursorPosition(wordStart + commonPrefix.length)
      setLastTabTime(now)
      setLastTabPrefix(currentWord)
    } else {
      // First tab - just mark the time and prefix for potential second tab
      setLastTabTime(now)
      setLastTabPrefix(currentWord)
    }
  }, [findMatches, findCommonPrefix, lastTabTime, lastTabPrefix])

  const sendCommand = async (
    command: string,
    phase?: string,
    args?: string[],
    submitText?: string
  ) => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, phase, args, submitText }),
      })
      const data = await res.json()
      return data
    } catch {
      return { output: ['Ошибка соединения с сервером.'] }
    }
  }

  // Start interactive top mode
  const startTopMode = useCallback(async () => {
    setInteractiveMode('top')

    const updateTop = async () => {
      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'top', phase: 'update' }),
        })
        const data = await res.json()
        if (data.output) {
          setInteractiveData(data.output)
        }
      } catch {
        // Ignore errors during auto-update
      }
    }

    // Initial fetch
    await updateTop()

    // Update every 1 second
    interactiveInterval.current = setInterval(updateTop, 1000)

    // Focus input for keyboard handling
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  // Start interactive tail -f mode
  const startTailMode = useCallback(async (args: string[]) => {
    setInteractiveMode('tail')
    
    const updateTail = async () => {
      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'tail', phase: 'update', args: args }),
        })
        const data = await res.json()
        if (data.output) {
          setInteractiveData(data.output)
        }
      } catch (err) {
        console.error('tail update error:', err)
      }
    }

    // Initial fetch
    await updateTail()

    // Update every 2 seconds
    interactiveInterval.current = setInterval(updateTail, 2000)

    // Focus input for keyboard handling
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  // Exit interactive mode
  const exitInteractiveMode = useCallback(() => {
    if (interactiveInterval.current) {
      clearInterval(interactiveInterval.current)
      interactiveInterval.current = null
    }
    setInteractiveMode(null)
    setInteractiveData([])
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  const handleNormalCommand = async (input: string) => {
    const displayPrompt = currentPromptOverride || prompt
    
    // Clear suggestions if showing
    if (suggestions) {
      setSuggestions(null)
    }
    
    addLines([`${displayPrompt}${input}`], 'command')

    if (!input.trim()) return

    setCommandHistory((prev) => [...prev, input])
    setHistoryIndex(-1)
    setCursorPosition(0)
    setLastTabTime(0)
    setLastTabPrefix('')

    const cmd = input.trim().toLowerCase().split(/\s+/)[0]

    // Handle login command — start multi-step
    if (cmd === 'login') {
      addLines([`${prompt}${input}`], 'command')
      // Clear screen and show login prompt
      setOutputLines([])
      setLineCounter(0)
      setCursorPosition(0)
      const result = await sendCommand('login')
      if (result.inputMode === 'password') {
        setInputMode('login-username')
        setCurrentPromptOverride('login: ')
      } else if (result.output?.length) {
        addLines(result.output)
      }
      return
    }

    // Handle register command — start multi-step
    if (cmd === 'register') {
      addLines([`${prompt}${input}`], 'command')
      // Clear screen and show register prompt
      setOutputLines([])
      setLineCounter(0)
      setInputMode('register-username')
      setCurrentPromptOverride('login: ')
      return
    }

    // Handle submit/nano
    if (cmd === 'submit' || cmd === 'nano') {
      const result = await sendCommand(cmd)
      if (result.output?.length) {
        addLines(result.output)
      }
      if (result.inputMode === 'submit') {
        setInputMode('submit')
        setCurrentPromptOverride('> ')
        setSubmitLines([])
      }
      return
    }

    // Handle top command - interactive mode
    if (cmd === 'top') {
      addLines([`${prompt}${input}`], 'command')
      await startTopMode()
      return
    }

    // Handle tail -f command - interactive mode
    if (cmd === 'tail') {
      addLines([`${prompt}${input}`], 'command')
      const args = input.trim().split(/\s+/).slice(1)
      const hasFollow = args.some(arg => arg === '-f' || arg === '--follow')

      if (hasFollow) {
        // Start interactive mode
        await startTailMode(args)
      } else {
        // Normal mode - just show output
        setIsProcessing(true)
        const result = await sendCommand(input)
        setIsProcessing(false)
        if (result.output?.length) {
          addLines(result.output)
        }
      }
      return
    }

    // Handle exit/logout for guests - reset to initial state
    if (cmd === 'exit' || cmd === 'logout') {
      addLines([`${prompt}${input}`], 'command')
      const result = await sendCommand(input)
      if (result.output?.length) {
        addLines(result.output)
      }
      // Reset to initial state (like page load)
      setOutputLines(ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const })))
      setLineCounter(ASCII_BANNER.length)
      setPrompt('guest@bashstory:~$ ')
      setThemeColor(DEFAULT_THEME_COLOR)
      setCommandHistory([])
      setHistoryIndex(-1)
      return
    }

    // Handle reboot - show boot screen and reset
    if (cmd === 'reboot') {
      addLines([`${prompt}${input}`], 'command')
      const result = await sendCommand(input)
      if (result.output?.length) {
        addLines(result.output)
      }
      // Show boot screen after delay, then clear
      setTimeout(() => {
        if (result.clear) {
          setOutputLines([])
          setLineCounter(0)
        }
        setShowBootScreen(true)
        // Reset terminal state after boot
        setTimeout(() => {
          setOutputLines(ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const })))
          setLineCounter(ASCII_BANNER.length)
          setPrompt('guest@bashstory:~$ ')
          setThemeColor(DEFAULT_THEME_COLOR)
          setCommandHistory([])
          setHistoryIndex(-1)
        }, 100)
      }, 1500)
      return
    }

    // Normal command
    setIsProcessing(true)
    const result = await sendCommand(input)
    setIsProcessing(false)

    if (result.clear) {
      setOutputLines([])
    }
    if (result.output?.length) {
      addLines(result.output)
    }
    if (result.newPrompt) {
      // Check if newPrompt is a hex color (from theme command)
      if (/^#[0-9A-Fa-f]{6}$/.test(result.newPrompt)) {
        setThemeColor(result.newPrompt)
      } else {
        setPrompt(result.newPrompt)
      }
    }
  }

  const handleLoginStep = async (input: string) => {
    if (inputMode === 'login-username') {
      addLines([`login: ${input}`], 'command')
      setTempData({ username: input })
      setCursorPosition(0)
      setCurrentInput('')
      setInputMode('login-password')
      setCurrentPromptOverride('password: ')
      return
    }

    if (inputMode === 'login-password') {
      setCurrentInput('')
      setIsProcessing(true)
      const result = await sendCommand('login', 'login', [tempData.username, input])
      setIsProcessing(false)
      if (result.newPrompt) {
        // Successful login - show banner and welcome message
        const bannerLines = ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const }))
        const welcomeLines = [
          `Добро пожаловать, ${tempData.username}!`,
          '',
        ].map((text, i) => ({ id: bannerLines.length + i, text, type: 'output' as const }))
        setOutputLines([...bannerLines, ...welcomeLines])
        setLineCounter(bannerLines.length + welcomeLines.length)
        setPrompt(result.newPrompt)
      } else if (result.output?.length) {
        // Failed login - show error
        addLines(result.output)
      }
      setInputMode(null)
      setCurrentPromptOverride(null)
      setTempData({})
      setCursorPosition(0)
      return
    }
  }

  const handleRegisterStep = async (input: string) => {
    if (inputMode === 'register-username') {
      addLines([`login: ${input}`], 'command')
      setTempData({ username: input })
      setCursorPosition(0)
      setCurrentInput('')
      setInputMode('register-password1')
      setCurrentPromptOverride('password: ')
      return
    }

    if (inputMode === 'register-password1') {
      setTempData((prev) => ({ ...prev, password1: input }))
      setCursorPosition(0)
      setCurrentInput('')
      setInputMode('register-password2')
      setCurrentPromptOverride('repeat password: ')
      return
    }

    if (inputMode === 'register-password2') {
      setCurrentInput('')
      setIsProcessing(true)
      const result = await sendCommand('register', 'register', [
        tempData.username,
        tempData.password1,
        input,
      ])
      setIsProcessing(false)
      if (result.newPrompt) {
        // Successful registration - show banner and welcome message
        const bannerLines = ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const }))
        const welcomeLines = [
          `Добро пожаловать, ${tempData.username}!`,
          '',
        ].map((text, i) => ({ id: bannerLines.length + i, text, type: 'output' as const }))
        setOutputLines([...bannerLines, ...welcomeLines])
        setLineCounter(bannerLines.length + welcomeLines.length)
        setPrompt(result.newPrompt)
      } else if (result.output?.length) {
        // Failed registration - show error
        addLines(result.output)
      }
      setInputMode(null)
      setCurrentPromptOverride(null)
      setTempData({})
      setCursorPosition(0)
      return
    }
  }

  const handleSubmitStep = async (input: string) => {
    if (input.trim() === '.done') {
      addLines(['> .done'], 'command')
      const fullText = submitLines.join('\n')
      setIsProcessing(true)
      const result = await sendCommand('submit', 'submit', [], fullText)
      setIsProcessing(false)
      if (result.output?.length) addLines(result.output)
      setInputMode(null)
      setCurrentPromptOverride(null)
      setSubmitLines([])
      return
    }

    addLines([`> ${input}`], 'command')
    setSubmitLines((prev) => [...prev, input])
  }

  const handleSubmit = async () => {
    const input = currentInput
    setCurrentInput('')

    if (inputMode === 'login-username' || inputMode === 'login-password') {
      await handleLoginStep(input)
    } else if (
      inputMode === 'register-username' ||
      inputMode === 'register-password1' ||
      inputMode === 'register-password2'
    ) {
      await handleRegisterStep(input)
    } else if (inputMode === 'submit') {
      await handleSubmitStep(input)
    } else {
      await handleNormalCommand(input)
    }

    // Фокус на поле ввода после обработки команды
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab completion (only in normal mode, not in password/interactive modes)
    if (e.key === 'Tab' && !inputMode && !interactiveMode) {
      e.preventDefault()
      handleTabCompletion()
      return
    }

    // Exit interactive mode with 'q' (only for top)
    if (interactiveMode === 'top' && e.key === 'q') {
      e.preventDefault()
      exitInteractiveMode()
      return
    }

    // Exit tail-follow mode with Ctrl+C
    if (interactiveMode === 'tail' && e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      if (interactiveInterval.current) {
        clearInterval(interactiveInterval.current)
        interactiveInterval.current = null
      }
      setInteractiveMode(null)
      setInteractiveData([])
      // Clear screen and show normal prompt (like exiting top)
      setOutputLines([])
      setLineCounter(0)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
      return
    }

    // Allow arrow left/right for cursor navigation
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Update cursor position after React renders
      requestAnimationFrame(() => {
        const input = e.target as HTMLInputElement
        setCursorPosition(input.selectionStart || 0)
      })
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      // Clear suggestions before submitting
      if (suggestions) {
        setSuggestions(null)
      }
      handleSubmit()
      return
    }

    // History navigation (only in normal mode)
    if (!inputMode) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (commandHistory.length > 0) {
          const newIndex =
            historyIndex === -1
              ? commandHistory.length - 1
              : Math.max(0, historyIndex - 1)
          setHistoryIndex(newIndex)
          setCurrentInput(commandHistory[newIndex])
          setCursorPosition(commandHistory[newIndex].length)
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (historyIndex >= 0) {
          const newIndex = historyIndex + 1
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1)
            setCurrentInput('')
            setCursorPosition(0)
          } else {
            setHistoryIndex(newIndex)
            setCurrentInput(commandHistory[newIndex])
            setCursorPosition(commandHistory[newIndex].length)
          }
        }
      }
    }

    // Cancel multi-step with Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      addLines(['^C'], 'output')
      setInputMode(null)
      setCurrentPromptOverride(null)
      setTempData({})
      setSubmitLines([])
      setCurrentInput('')
    }
  }

  const currentDisplayPrompt = currentPromptOverride || prompt
  const isPasswordMode = inputMode === 'login-password' || inputMode === 'register-password1' || inputMode === 'register-password2'

  if (showBootScreen) {
    return <BootScreen onComplete={() => setShowBootScreen(false)} />
  }

  return (
    <div
      className="terminal-screen"
      onClick={() => {
        if (interactiveMode === 'top') {
          requestAnimationFrame(() => {
            inputRef.current?.focus()
          })
        } else {
          focusInput()
        }
      }}
      role="application"
      aria-label="Terminal"
      style={
        {
          '--theme-color': themeColor,
          '--terminal-fg': themeColor,
        } as React.CSSProperties
      }
    >
      {interactiveMode === 'top' ? (
        <div className="terminal-output" style={{ height: '100%' }}>
          {interactiveData.map((line, i) => (
            <div key={i} className="terminal-line">
              <pre>{line}</pre>
            </div>
          ))}
          <div className="terminal-line" style={{ marginTop: '8px', color: 'var(--terminal-fg, #4AFB7F)' }}>
            <pre>q: quit</pre>
          </div>
        </div>
      ) : interactiveMode === 'tail' ? (
        <div ref={scrollRef} className="terminal-output">
          {interactiveData.map((line, i) => (
            <div key={i} className="terminal-line">
              <pre>{line}</pre>
            </div>
          ))}
          <div className="terminal-line" style={{ marginTop: '8px', color: 'var(--terminal-fg, #4AFB7F)', opacity: 0.7 }}>
            <pre>-- Ctrl+C: выход --</pre>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="terminal-output">
          {outputLines.map((line) => (
            <div key={line.id} className="terminal-line">
              <pre>{line.text}</pre>
            </div>
          ))}
          <div className="terminal-input-line">
            <span className="terminal-prompt">{currentDisplayPrompt}</span>
            <span className="terminal-input-text" style={{ position: 'relative', display: 'inline-block' }}>
              {isPasswordMode ? '' : currentInput || '\u00A0'}
              <span
                className="terminal-cursor"
                style={{
                  position: 'absolute',
                  left: `${isPasswordMode ? 0 : cursorPosition * 8.4}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </span>
          </div>
          {suggestions && (
            <div className="terminal-line" style={{ color: 'var(--terminal-fg, #4AFB7F)' }}>
              <pre>{suggestions}</pre>
            </div>
          )}
        </div>
      )}
      
      {/* Hidden input for keyboard handling - always present */}
      <input
        ref={inputRef}
        type="text"
        value={interactiveMode === 'top' ? '' : currentInput}
        onChange={(e) => {
          setCurrentInput(e.target.value)
          setCursorPosition(e.target.selectionStart || 0)
        }}
        onSelect={(e) => {
          setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)
        }}
        onKeyDown={handleKeyDown}
        className="terminal-hidden-input"
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        disabled={isProcessing && interactiveMode !== 'top'}
        aria-label="Terminal input"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
