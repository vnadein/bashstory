import { registerCommand } from '../registry'

registerCommand({
  name: 'quote-list',
  description: 'List all quotes',
  usage: 'quote-list [--category cat] [--tag tag] [--favorite] [--search term]',
  aliases: ['qlist', 'quotes'],
  handler: async (cmd) => {
    try {
      const params = new URLSearchParams()
      
      if (cmd.flags.category || cmd.flags.c) {
        params.append('category', (cmd.flags.category || cmd.flags.c) as string)
      }
      
      if (cmd.flags.tag || cmd.flags.t) {
        params.append('tag', (cmd.flags.tag || cmd.flags.t) as string)
      }
      
      if (cmd.flags.favorite || cmd.flags.f) {
        params.append('favorite', 'true')
      }
      
      if (cmd.flags.search || cmd.flags.s) {
        params.append('search', (cmd.flags.search || cmd.flags.s) as string)
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

      const output = (
        <div className="space-y-3">
          <div className="text-primary font-bold">Found {quotes.length} quote(s):</div>
          {quotes.map((quote: any, index: number) => {
            const tags = quote.tags ? JSON.parse(quote.tags) : []
            return (
              <div key={quote.id} className="border-l-2 border-primary pl-3 space-y-1">
                <div className="text-foreground">&quot;{quote.text}&quot;</div>
                {quote.author && (
                  <div className="text-muted-foreground text-sm">- {quote.author}</div>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>ID: {quote.id.slice(0, 8)}</span>
                  {quote.category && <span>Category: {quote.category}</span>}
                  {quote.isFavorite && <span className="text-primary">★ Favorite</span>}
                </div>
                {tags.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Tags: {tags.join(', ')}
                  </div>
                )}
              </div>
            )
          })}
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
