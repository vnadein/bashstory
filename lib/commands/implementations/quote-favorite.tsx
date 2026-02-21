import { registerCommand } from '../registry'

registerCommand({
  name: 'quote-favorite',
  description: 'Mark a quote as favorite',
  usage: 'quote-favorite <id> [--remove]',
  aliases: ['qfav'],
  handler: async (cmd) => {
    const id = cmd.args[0]
    
    if (!id) {
      return {
        output: 'Error: Quote ID is required. Usage: quote-favorite <id>',
        error: true,
      }
    }

    const remove = cmd.flags.remove === true || cmd.flags.r === true
    const isFavorite = !remove

    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite }),
      })

      if (!response.ok) {
        const data = await response.json()
        return {
          output: `Error: ${data.error || 'Failed to update quote'}`,
          error: true,
        }
      }

      const message = isFavorite
        ? 'Quote marked as favorite!'
        : 'Quote removed from favorites!'

      return {
        output: <div className="text-primary">{message}</div>,
      }
    } catch (error) {
      return {
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: true,
      }
    }
  },
})
