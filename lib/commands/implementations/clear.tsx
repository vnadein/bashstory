import { registerCommand } from '../registry'

registerCommand({
  name: 'clear',
  description: 'Clear the terminal screen',
  usage: 'clear',
  aliases: ['cls'],
  handler: () => {
    return {
      output: '__CLEAR__', // Special marker for terminal to clear
    }
  },
})
