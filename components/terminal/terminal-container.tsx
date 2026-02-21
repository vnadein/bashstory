'use client'

import { Card } from '@/components/ui/card'

interface TerminalContainerProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function TerminalContainer({
  title = 'Terminal',
  children,
  className = '',
}: TerminalContainerProps) {
  return (
    <Card className={`flex flex-col h-screen bg-background border-border ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <div className="w-3 h-3 rounded-full bg-accent opacity-50" />
          <div className="w-3 h-3 rounded-full bg-accent opacity-50" />
        </div>
        <span className="text-sm font-mono text-muted-foreground">{title}</span>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </Card>
  )
}
