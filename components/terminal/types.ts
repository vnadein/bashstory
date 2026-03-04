export interface OutputLine {
  id: number
  text: string
  type: 'output' | 'command' | 'prompt'
  renderMarkdown?: boolean
}

export type InputMode = null | 'login-username' | 'login-password' | 'register-username' | 'register-password1' | 'register-password2' | 'passwd-current' | 'passwd-new' | 'post-text' | 'post-multiline'

export type InteractiveMode = null | 'top' | 'tail' | 'login' | 'register' | 'post-editor' | 'post-reader' | 'profile' | 'mail'
