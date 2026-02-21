import { registerCommand } from '../registry'

registerCommand({
  name: 'quote-delete',
  description: 'Delete a quote by ID',
  usage: 'quote-delete <id>',
  aliases: ['qdel', 'qrm'],
  handler: async (cmd) => {
    const id = cmd.args[0]
    
    if (!id) {
      return {
        output: 'Error: Quote ID is required. Usage: quote-delete <id>',
        error: true,
      }
    }

    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        return {
          output: `Error: ${data.error || 'Failed to delete quote'}`,
          error: true,
        }
      }

      return {
        output: <div className="text-primary">Quote deleted successfully!</div>,
      }
    } catch (error) {
      return {
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: true,
      }
    }
  },
})
