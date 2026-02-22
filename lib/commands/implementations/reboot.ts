import { CommandResult, CommandContext } from '../types'

export function cmdReboot(context: CommandContext): CommandResult {
  const user = context.username || 'guest'
  return {
    output: [
      `Broadcast message from ${user}@bashstory:`,
      '  The system is going down for reboot NOW!',
    ],
    clear: true,
  }
}
