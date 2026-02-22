import { OutputLine } from '../types'

interface TerminalOutputProps {
  lines: OutputLine[]
  themeColor: string
}

export function TerminalOutput({ lines, themeColor }: TerminalOutputProps) {
  return (
    <div className="terminal-output">
      {lines.map((line) => (
        <div key={line.id} className="terminal-line">
          <pre>{line.text}</pre>
        </div>
      ))}
    </div>
  )
}
