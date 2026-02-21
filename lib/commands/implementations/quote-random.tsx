import { registerCommand } from '../registry'

registerCommand({
  name: 'quote-random',
  description: 'Display a random quote',
  usage: 'quote-random [--category cat] [--tag tag]',
  aliases: ['qrand', 'random-quote'],
  handler: async (cmd) => {
    try {
      const params = new URLSearchParams()
      
      if (cmd.flags.category || cmd.flags.c) {
        params.append('category', (cmd.flags.category || cmd.flags.c) as string)
      }
      
      if (cmd.flags.tag || cmd.flags.t) {
        params.append('tag', (cmd.flags.tag || cmd.flags.t) as string)
      }

      const response = await fetch(`/api/quotes?${params}`)
      
      if (!response.ok) {
        return {
          output: 'Error: Failed to fetch quotes',
          error: true,
        }
      }

      const { quotes } = await response.json()

      if (quotes.length === 0) {
        return {
          output: 'No quotes found. Use "quote-add" to add your first quote!',
        }
      }

      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
      const tags = randomQuote.tags ? JSON.parse(randomQuote.tags) : []

      const output = (
        <div className="border-l-2 border-primary pl-3 space-y-2">
          <div className="text-foreground text-lg">&quot;{randomQuote.text}&quot;</div>
          {randomQuote.author && (
            <div className="text-muted-foreground">- {randomQuote.author}</div>
          )}
          <div className="flex gap-3 text-xs text-muted-foreground">
            {randomQuote.category && <span>Category: {randomQuote.category}</span>}
            {tags.length > 0 && <span>Tags: {tags.join(', ')}</span>}
            {randomQuote.isFavorite && <span className="text-primary">★</span>}
          </div>
        </div>
      )

      return { output }
    } catch (error) {
      return {
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: true,
      }
    }
  },
})
