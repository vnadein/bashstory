import { registerCommand } from '../registry'

registerCommand({
  name: 'quote-add',
  description: 'Add a new quote',
  usage: 'quote-add "text" --author "name" --category "cat" --tags tag1,tag2',
  aliases: ['qadd'],
  handler: async (cmd) => {
    const text = cmd.args[0]
    
    if (!text) {
      return {
        output: 'Error: Quote text is required. Usage: quote-add "your quote text"',
        error: true,
      }
    }

    const author = cmd.flags.author as string || cmd.flags.a as string
    const category = cmd.flags.category as string || cmd.flags.c as string
    const tagsStr = cmd.flags.tags as string || cmd.flags.t as string
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : []
    const isPrivate = cmd.flags.private === true || cmd.flags.p === true

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author, category, tags, isPrivate }),
      })

      if (!response.ok) {
        const data = await response.json()
        return {
          output: `Error: ${data.error || 'Failed to add quote'}`,
          error: true,
        }
      }

      const { quote } = await response.json()

      const output = (
        <div className="space-y-1">
          <div className="text-primary">Quote added successfully!</div>
          <div className="text-muted-foreground">ID: {quote.id}</div>
          {author && <div>Author: {author}</div>}
          {category && <div>Category: {category}</div>}
          {tags.length > 0 && <div>Tags: {tags.join(', ')}</div>}
        </div>
      )

      return { output }
    } catch (error) {
      return {
        output: `Error: Failed to add quote - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: true,
      }
    }
  },
})
