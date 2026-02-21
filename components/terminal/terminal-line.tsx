'use client'

interface TerminalLineProps {
  prompt?: string
  command?: string
  output?: React.ReactNode
  timestamp?: Date
  showTimestamp?: boolean
  className?: string
}

export function TerminalLine({
  prompt = '$',
  command,
  output,
  timestamp,
  showTimestamp = false,
  className = '',
}: TerminalLineProps) {
  const formattedTime = timestamp
    ? new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(timestamp)
    : null

  return (
    <div className={`font-mono text-sm ${className}`}>
      {command && (
        <div className="flex gap-2">
          {showTimestamp && formattedTime && (
            <span className="text-muted-foreground">[{formattedTime}]</span>
          )}
          <span className="text-primary">{prompt}</span>
          <span className="text-foreground">{command}</span>
        </div>
      )}
      {output && <div className="mt-1 text-foreground whitespace-pre-wrap">{output}</div>}
    </div>
  )
}
