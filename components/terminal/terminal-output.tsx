'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TerminalLine } from './terminal-line'

export interface TerminalHistoryItem {
  id: string
  type: 'command' | 'output' | 'error'
  command?: string
  output?: React.ReactNode
  timestamp: Date
}

interface TerminalOutputProps {
  history: TerminalHistoryItem[]
  prompt?: string
  showTimestamps?: boolean
  className?: string
}

export function TerminalOutput({
  history,
  prompt = '$',
  showTimestamps = false,
  className = '',
}: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  return (
    <ScrollArea className={`h-full ${className}`}>
      <div className="space-y-2 p-4">
        {history.map((item) => (
          <TerminalLine
            key={item.id}
            prompt={item.type === 'command' ? prompt : undefined}
            command={item.type === 'command' ? item.command : undefined}
            output={item.type !== 'command' ? item.output : undefined}
            timestamp={item.timestamp}
            showTimestamp={showTimestamps}
            className={item.type === 'error' ? 'text-destructive' : ''}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
