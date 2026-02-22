'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { BootScreen } from './boot-screen'
import { ASCII_BANNER, DEFAULT_THEME_COLOR, DEFAULT_PROMPT, AVAILABLE_COMMANDS, PUBLIC_COMMANDS, AUTH_COMMANDS } from './terminal/constants'
import { OutputLine, InputMode, InteractiveMode } from './terminal/types'
import { getCookie } from './terminal/utils'
import { TerminalOutput } from './terminal/components/TerminalOutput'
import { TerminalInput } from './terminal/components/TerminalInput'

export default function Terminal() {
  const [showBootScreen, setShowBootScreen] = useState(true)
  const [outputLines, setOutputLines] = useState<OutputLine[]>(() =>
    ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const }))
  )
  const [currentInput, setCurrentInput] = useState('')
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lineCounter, setLineCounter] = useState(ASCII_BANNER.length)
  const [isProcessing, setIsProcessing] = useState(false)
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR)
  const [cursorPosition, setCursorPosition] = useState(0)

  const [lastTabTime, setLastTabTime] = useState(0)
  const [lastTabPrefix, setLastTabPrefix] = useState('')
  const [suggestions, setSuggestions] = useState<string | null>(null)

  const [interactiveMode, setInteractiveMode] = useState<InteractiveMode>(null)
  const [interactiveData, setInteractiveData] = useState<string[]>([])
  const interactiveInterval = useRef<NodeJS.Timeout | null>(null)

  const [inputMode, setInputMode] = useState<InputMode>(null)
  const [currentPromptOverride, setCurrentPromptOverride] = useState<string | null>(null)
  const [tempData, setTempData] = useState<Record<string, string>>({})

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const currentDisplayPrompt = currentPromptOverride || prompt
  const isPasswordMode = inputMode === 'login-password' || inputMode === 'register-password1' || inputMode === 'register-password2' || inputMode === 'passwd-current' || inputMode === 'passwd-new'

  useEffect(() => {
    const savedColor = getCookie('theme_color')
    if (savedColor && /^#[0-9A-Fa-f]{6}$/.test(savedColor)) {
      setThemeColor(savedColor)
    }
  }, [])

  const addLines = useCallback(
    (texts: string[], type: 'output' | 'command' | 'prompt' = 'output', renderMarkdown = false, isPostContent = false) => {
      setOutputLines((prev) => {
        let id = prev.length > 0 ? Math.max(...prev.map((l) => l.id)) + 1 : 0
        const newLines = texts.map((text) => ({ id: id++, text, type, renderMarkdown, isPostContent }))
        return [...prev, ...newLines]
      })
    },
    []
  )

  const replaceLastLine = useCallback(
    (newText: string, type: 'output' | 'command' | 'prompt' = 'output') => {
      setOutputLines((prev) => {
        if (prev.length === 0) return prev
        const newId = prev[prev.length - 1].id
        return [...prev.slice(0, -1), { id: newId, text: newText, type }]
      })
    },
    []
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [outputLines, suggestions])

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [inputMode, outputLines.length, interactiveMode])

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

  const findMatches = useCallback((prefix: string): string[] => {
    const isLoggedIn = prompt !== DEFAULT_PROMPT
    const commands = isLoggedIn ? AUTH_COMMANDS : [...PUBLIC_COMMANDS, 'clear']
    if (!prefix) return commands
    return commands.filter(cmd => cmd.startsWith(prefix.toLowerCase()))
  }, [prompt])

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

  const handleTabCompletion = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    const text = input.value
    const pos = input.selectionStart || 0
    const lastSpaceIndex = text.lastIndexOf(' ', pos)
    const wordStart = lastSpaceIndex + 1
    const currentWord = text.substring(wordStart, pos)
    if (!currentWord) return
    
    const matches = findMatches(currentWord)
    const now = Date.now()
    
    if (matches.length === 0) return
    
    if (matches.length === 1) {
      const completed = text.substring(0, wordStart) + matches[0] + text.substring(pos)
      setCurrentInput(completed)
      setCursorPosition(wordStart + matches[0].length)
      setLastTabTime(now)
      setLastTabPrefix(currentWord)
      return
    }
    
    const commonPrefix = findCommonPrefix(matches)
    
    if (now - lastTabTime < 2000 && currentWord === lastTabPrefix && commonPrefix === currentWord) {
      const matchesLine = '  ' + matches.join('  ')
      setSuggestions(matchesLine)
      return
    }
    
    if (commonPrefix.length > currentWord.length) {
      const completed = text.substring(0, wordStart) + commonPrefix + text.substring(pos)
      setCurrentInput(completed)
      setCursorPosition(wordStart + commonPrefix.length)
      setLastTabTime(now)
      setLastTabPrefix(currentWord)
    } else {
      setLastTabTime(now)
      setLastTabPrefix(currentWord)
    }
  }, [findMatches, findCommonPrefix, lastTabTime, lastTabPrefix])

  const sendCommand = async (command: string, phase?: string, args?: string[], submitText?: string) => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, phase, args, submitText }),
      })
      return await res.json()
    } catch {
      return { output: ['Ошибка соединения с сервером.'] }
    }
  }

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
        if (data.output) setInteractiveData(data.output)
      } catch {}
    }
    await updateTop()
    interactiveInterval.current = setInterval(updateTop, 1000)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const startTailMode = useCallback(async (args: string[]) => {
    setInteractiveMode('tail')
    const updateTail = async () => {
      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'tail', phase: 'update', args }),
        })
        const data = await res.json()
        if (data.output) setInteractiveData(data.output)
      } catch (err) {
        console.error('tail update error:', err)
      }
    }
    await updateTail()
    interactiveInterval.current = setInterval(updateTail, 2000)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const exitInteractiveMode = useCallback(() => {
    if (interactiveInterval.current) {
      clearInterval(interactiveInterval.current)
      interactiveInterval.current = null
    }
    setInteractiveMode(null)
    setInteractiveData([])
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const handleNormalCommand = async (input: string) => {
    const displayPrompt = currentPromptOverride || prompt
    
    if (suggestions) setSuggestions(null)
    addLines([`${displayPrompt}${input}`], 'command')
    if (!input.trim()) return

    setCommandHistory((prev) => [...prev, input])
    setHistoryIndex(-1)
    setCursorPosition(0)
    setLastTabTime(0)
    setLastTabPrefix('')

    const cmd = input.trim().toLowerCase().split(/\s+/)[0]

    if (cmd === 'login') {
      addLines([`${prompt}${input}`], 'command')
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

    if (cmd === 'register') {
      addLines([`${prompt}${input}`], 'command')
      setOutputLines([])
      setLineCounter(0)
      setInputMode('register-username')
      setCurrentPromptOverride('login: ')
      return
    }

    if (cmd === 'passwd') {
      if (prompt === DEFAULT_PROMPT) {
        addLines([`${prompt}${input}`], 'command')
        addLines(['passwd: необходима авторизация.'], 'output')
        return
      }
      setCursorPosition(0)
      const result = await sendCommand('passwd')
      if (result.inputMode === 'password') {
        setInputMode('passwd-current')
        setCurrentPromptOverride('(passwd) Current password: ')
      } else if (result.output?.length) {
        addLines(result.output)
      }
      return
    }

    if (cmd === 'top') {
      addLines([`${prompt}${input}`], 'command')
      await startTopMode()
      return
    }

    if (cmd === 'tail') {
      addLines([`${prompt}${input}`], 'command')
      const args = input.trim().split(/\s+/).slice(1)
      const hasFollow = args.some(arg => arg === '-f' || arg === '--follow')
      if (hasFollow) {
        await startTailMode(args)
      } else {
        setIsProcessing(true)
        const result = await sendCommand(input)
        setIsProcessing(false)
        if (result.output?.length) addLines(result.output)
      }
      return
    }

    if (cmd === 'exit' || cmd === 'logout') {
      addLines([`${prompt}${input}`], 'command')
      const result = await sendCommand(input)
      if (result.output?.length) addLines(result.output)
      setOutputLines(ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const })))
      setLineCounter(ASCII_BANNER.length)
      setPrompt(DEFAULT_PROMPT)
      setThemeColor(DEFAULT_THEME_COLOR)
      setCommandHistory([])
      setHistoryIndex(-1)
      return
    }

    if (cmd === 'reboot') {
      const result = await sendCommand(input)
      if (result.output?.length) addLines(result.output)
      setTimeout(() => {
        if (result.clear) {
          setOutputLines([])
          setLineCounter(0)
        }
        setShowBootScreen(true)
        setTimeout(() => {
          setOutputLines(ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const })))
          setLineCounter(ASCII_BANNER.length)
          setPrompt(DEFAULT_PROMPT)
          setThemeColor(DEFAULT_THEME_COLOR)
          setCommandHistory([])
          setHistoryIndex(-1)
        }, 100)
      }, 1500)
      return
    }

    setIsProcessing(true)
    const result = await sendCommand(input)
    setIsProcessing(false)

    if (result.clear) setOutputLines([])
    if (result.output?.length) {
      const outputText = result.output.join('\n')
      if (outputText.includes('Открытие редактора')) {
        replaceLastLine(`${prompt}post`, 'command')
        openEditor()
      } else {
        addLines(result.output, 'output', result.renderMarkdown)
      }
    }
    if (result.newPrompt) {
      if (/^#[0-9A-Fa-f]{6}$/.test(result.newPrompt)) {
        setThemeColor(result.newPrompt)
      } else {
        setPrompt(result.newPrompt)
      }
    }
    if (result.inputMode) {
      setInputMode(result.inputMode)
      if (result.inputPrompt !== undefined) {
        setCurrentPromptOverride(result.inputPrompt)
      }
    }
  }

  const handleLoginStep = async (input: string) => {
    if (inputMode === 'login-username') {
      replaceLastLine(`login: ${input}`, 'command')
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
        const bannerLines = ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const }))
        const welcomeLines = [`Добро пожаловать, ${tempData.username}!`, ''].map((text, i) => ({ id: bannerLines.length + i, text, type: 'output' as const }))
        setOutputLines([...bannerLines, ...welcomeLines])
        setLineCounter(bannerLines.length + welcomeLines.length)
        setPrompt(result.newPrompt)
      } else if (result.output?.length) {
        addLines(result.output)
      }
      setInputMode(null)
      setCurrentPromptOverride(null)
      setTempData({})
      setCursorPosition(0)
    }
  }

  const handleRegisterStep = async (input: string) => {
    if (inputMode === 'register-username') {
      replaceLastLine(`login: ${input}`, 'command')
      setTempData({ username: input })
      setCursorPosition(0)
      setCurrentInput('')
      setInputMode('register-password1')
      setCurrentPromptOverride('password: ')
      return
    }

    if (inputMode === 'register-password1') {
      replaceLastLine('password:', 'command')
      setTempData((prev) => ({ ...prev, password1: input }))
      setCursorPosition(0)
      setCurrentInput('')
      setInputMode('register-password2')
      setCurrentPromptOverride('repeat password: ')
      return
    }

    if (inputMode === 'register-password2') {
      replaceLastLine('repeat password:', 'command')
      setCurrentInput('')
      setIsProcessing(true)
      const result = await sendCommand('register', 'register', [tempData.username, tempData.password1, input])
      setIsProcessing(false)
      if (result.newPrompt) {
        const bannerLines = ASCII_BANNER.map((text, i) => ({ id: i, text, type: 'output' as const }))
        const welcomeLines = [`Добро пожаловать, ${tempData.username}!`, ''].map((text, i) => ({ id: bannerLines.length + i, text, type: 'output' as const }))
        setOutputLines([...bannerLines, ...welcomeLines])
        setLineCounter(bannerLines.length + welcomeLines.length)
        setPrompt(result.newPrompt)
      } else if (result.output?.length) {
        addLines(result.output)
      }
      setInputMode(null)
      setCurrentPromptOverride(null)
      setTempData({})
      setCursorPosition(0)
    }
  }

  const handlePasswdCurrent = async (input: string) => {
    replaceLastLine('(passwd) Current password:', 'command')
    setCurrentInput('')
    setIsProcessing(true)
    const result = await sendCommand('passwd', 'passwd-current', [input])
    setIsProcessing(false)
    if (result.inputMode === 'password') {
      setInputMode('passwd-new')
      setCurrentPromptOverride('(passwd) New password: ')
    } else if (result.output?.length) {
      addLines(result.output)
      setInputMode(null)
      setCurrentPromptOverride(null)
    }
    setCursorPosition(0)
  }

  const handlePasswdNew = async (input: string) => {
    replaceLastLine('(passwd) New password:', 'command')
    setCurrentInput('')
    setIsProcessing(true)
    const result = await sendCommand('passwd', 'passwd-new', [input])
    setIsProcessing(false)
    if (result.output?.length) addLines(result.output)
    setInputMode(null)
    setCurrentPromptOverride(null)
    setCursorPosition(0)
  }

  const handleSubmit = async () => {
    const input = currentInput
    setCurrentInput('')

    if (inputMode === 'login-username' || inputMode === 'login-password') {
      await handleLoginStep(input)
    } else if (inputMode === 'register-username' || inputMode === 'register-password1' || inputMode === 'register-password2') {
      await handleRegisterStep(input)
    } else if (inputMode === 'passwd-current') {
      await handlePasswdCurrent(input)
    } else if (inputMode === 'passwd-new') {
      await handlePasswdNew(input)
    } else if (inputMode === 'post-text') {
      setIsProcessing(true)
      const result = await sendCommand('post', 'post-text', [], input)
      setIsProcessing(false)
      if (result.output?.length) addLines(result.output)
      setInputMode(null)
      setCurrentPromptOverride(null)
    } else {
      await handleNormalCommand(input)
    }

    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorContent, setEditorContent] = useState('')
  const [editorKey, setEditorKey] = useState(0)

  const openEditor = () => {
    setEditorOpen(true)
    setEditorContent('')
    setEditorKey(k => k + 1)
    inputRef.current?.blur()
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditorContent('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  useEffect(() => {
    if (!editorOpen) return

    const timer = setTimeout(() => {
      editorRef.current?.focus()
    }, 50)

    const handleEditorKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 's' || e.code === 'KeyS')) {
        e.preventDefault()
        submitPost()
      }
      if (e.ctrlKey && (e.key === 'q' || e.code === 'KeyQ')) {
        e.preventDefault()
        closeEditor()
      }
      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault()
        closeEditor()
      }
    }

    window.addEventListener('keydown', handleEditorKeyDown)
    return () => {
      window.removeEventListener('keydown', handleEditorKeyDown)
      clearTimeout(timer)
    }
  }, [editorOpen, editorContent])

  const submitPost = async () => {
    if (!editorContent.trim()) {
      closeEditor()
      addLines(['Пост отменён.'], 'output')
      return
    }

    setIsProcessing(true)
    const result = await sendCommand('post', 'post-text', [], editorContent)
    setIsProcessing(false)
    closeEditor()
    if (result.output?.length) addLines(result.output)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !inputMode && !interactiveMode) {
      e.preventDefault()
      handleTabCompletion()
      return
    }

    if (interactiveMode === 'top' && e.key === 'q') {
      e.preventDefault()
      exitInteractiveMode()
      return
    }

    if (interactiveMode === 'tail' && e.ctrlKey && (e.key === 'c' || e.code === 'KeyC')) {
      e.preventDefault()
      if (interactiveInterval.current) {
        clearInterval(interactiveInterval.current)
        interactiveInterval.current = null
      }
      setInteractiveMode(null)
      setInteractiveData([])
      setOutputLines([])
      setLineCounter(0)
      requestAnimationFrame(() => inputRef.current?.focus())
      return
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const newPos = Math.max(0, cursorPosition - 1)
      setCursorPosition(newPos)
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newPos, newPos)
      }
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const newPos = Math.min(currentInput.length, cursorPosition + 1)
      setCursorPosition(newPos)
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newPos, newPos)
      }
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions) setSuggestions(null)
      handleSubmit()
      return
    }

    if (!inputMode) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (commandHistory.length > 0) {
          const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
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

    if (e.ctrlKey && (e.key === 'c' || e.code === 'KeyC')) {
      e.preventDefault()
      addLines(['^C'], 'output')
      setInputMode(null)
      setCurrentPromptOverride(null)
      setTempData({})
      setCurrentInput('')
      setCursorPosition(0)
      if (prompt.includes('(passwd)') || prompt.includes('password')) {
        setPrompt(DEFAULT_PROMPT)
      }
    }
  }

  if (showBootScreen) {
    return <BootScreen onComplete={() => setShowBootScreen(false)} />
  }

  return (
    <div
      className="terminal-screen"
      onClick={() => {
        if (interactiveMode === 'top') {
          requestAnimationFrame(() => inputRef.current?.focus())
        } else {
          focusInput()
        }
      }}
      role="application"
      aria-label="Terminal"
      style={{
        '--theme-color': themeColor,
        '--terminal-fg': themeColor,
      } as React.CSSProperties}
    >
      {editorOpen && (
        <div
          key={editorKey}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0C0C0C',
            color: themeColor,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          <div 
            style={{ 
              padding: '10px 20px', 
              borderBottom: `1px solid ${themeColor}`,
              backgroundColor: '#0C0C0C'
            }}
          >
            <pre style={{ margin: 0, fontSize: '14px' }}>BAJOUR Post Editor</pre>
          </div>
          <textarea
            ref={editorRef}
            autoFocus
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: themeColor,
              border: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              padding: '10px 20px',
              caretColor: themeColor,
              cursor: 'text',
              animation: 'none',
            }}
            placeholder="Введите текст поста (поддерживается Markdown)..."
          />
          <div 
            style={{ 
              padding: '10px 20px', 
              borderTop: `1px solid ${themeColor}`,
              backgroundColor: '#0C0C0C'
            }}
          >
            <pre style={{ margin: 0, fontSize: '14px' }}>Ctrl+S - save and post | Ctrl+Q / Esc - quit</pre>
          </div>
        </div>
      )}
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
          <TerminalOutput lines={outputLines} themeColor={themeColor} />
          <TerminalInput
            prompt={currentDisplayPrompt}
            currentInput={currentInput}
            cursorPosition={cursorPosition}
            isPasswordMode={isPasswordMode}
          />
          {suggestions && (
            <div className="terminal-line" style={{ color: 'var(--terminal-fg, #4AFB7F)' }}>
              <pre>{suggestions}</pre>
            </div>
          )}
        </div>
      )}
      
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
