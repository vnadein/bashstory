import { registerCommand } from '../registry'

registerCommand({
  name: 'date',
  description: 'Display the current date and time',
  usage: 'date',
  handler: () => {
    const now = new Date()
    const formatted = now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    
    return { output: formatted }
  },
})
