interface TerminalInputProps {
  prompt: string
  currentInput: string
  cursorPosition: number
  isPasswordMode: boolean
}

export function TerminalInput({
  prompt,
  currentInput,
  cursorPosition,
  isPasswordMode,
}: TerminalInputProps) {
  const displayText = isPasswordMode ? '' : currentInput
  const textBefore = isPasswordMode ? '' : displayText.slice(0, cursorPosition)
  const textAfter = isPasswordMode ? '' : displayText.slice(cursorPosition)

  return (
    <div className="terminal-input-line">
      <span className="terminal-prompt">
        {prompt}
      </span>
      <span className="terminal-input-text" style={{ position: 'relative', display: 'inline-block' }}>
        {textBefore}
        <span
          className="terminal-cursor"
          style={{
            position: 'absolute',
            width: '8px',
            height: '1.2em',
            top: 0,
          }}
        />
        {textAfter || '\u00A0'}
      </span>
    </div>
  )
}
