export interface CommandResult {
  output: string[]
  newPrompt?: string
  clear?: boolean
  inputMode?: 'password' | 'submit' | 'tail-follow' | null
  inputPrompt?: string
}

export interface CommandContext {
  userId: number | null
  username: string | null
  isModerator: boolean
  ip: string
}

export interface CommandMeta {
  phase?: string
  args?: string[]
  submitText?: string
}

export interface Command {
  name: string
  description: string
  usage: string
  aliases?: string[]
  handler: (args: string[], context: CommandContext, meta?: CommandMeta) => CommandResult | Promise<CommandResult>
}
