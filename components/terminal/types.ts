export interface OutputLine {
  id: number
  text: string
  type: 'output' | 'command' | 'prompt' | 'post'
  renderMarkdown?: boolean
}

export type InputMode = null | 'login-username' | 'login-password' | 'register-username' | 'register-password1' | 'register-password2' | 'passwd-current' | 'passwd-new' | 'post-text' | 'post-multiline'

export type InteractiveMode = null | 'top' | 'tail'

export interface TerminalState {
  outputLines: OutputLine[]
  currentInput: string
  prompt: string
  commandHistory: string[]
  historyIndex: number
  isProcessing: boolean
  themeColor: string
  cursorPosition: number
  inputMode: InputMode
  interactiveMode: InteractiveMode
  interactiveData: string[]
  currentPromptOverride: string | null
  tempData: Record<string, string>
  submitLines: string[]
  suggestions: string | null
  lastTabTime: number
  lastTabPrefix: string
}
