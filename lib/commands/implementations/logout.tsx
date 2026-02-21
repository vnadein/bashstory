import { registerCommand } from '../registry'

registerCommand({
  name: 'logout',
  description: 'Log out of the terminal',
  usage: 'logout',
  aliases: ['exit', 'quit'],
  handler: () => {
    return {
      output: 'Logging out... (handled by terminal)',
    }
  },
})
