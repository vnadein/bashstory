'use client'

import { useState, useRef, useEffect } from 'react'

interface TerminalInputProps {
  prompt?: string
  onCommand: (command: string) => void
  disabled?: boolean
  showTimestamp?: boolean
  placeholder?: string
}

export function TerminalInput({
  prompt = '$',
  onCommand,
  disabled = false,
  showTimestamp = false,
  placeholder = 'Type a command...',
}: TerminalInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    if (!showTimestamp) return
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [showTimestamp])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onCommand(input.trim())
      setInput('')
    }
  }

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(time)

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 font-mono text-sm">
      {showTimestamp && (
        <span className="text-muted-foreground">[{formattedTime}]</span>
      )}
      <span className="text-primary">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground caret-primary"
        autoFocus
        autoComplete="off"
        spellCheck="false"
      />
    </form>
  )
}
