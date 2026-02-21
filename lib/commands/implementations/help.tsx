import { registerCommand, getAllCommands } from '../registry'
import { formatHelp } from '../parser'

registerCommand({
  name: 'help',
  description: 'Display available commands',
  usage: 'help [command]',
  aliases: ['h', '?'],
  handler: (cmd) => {
    if (cmd.args.length > 0) {
      // Help for specific command
      const commandName = cmd.args[0]
      const commands = getAllCommands()
      const command = commands.find(c => c.name === commandName)
      
      if (!command) {
        return {
          output: `No help available for: ${commandName}`,
          error: true,
        }
      }
      
      return {
        output: formatHelp(
          command.name,
          command.description,
          command.usage,
          command.aliases ? [`Aliases: ${command.aliases.join(', ')}`] : []
        ),
      }
    }

    // List all commands
    const commands = getAllCommands().sort((a, b) => a.name.localeCompare(b.name))
    
    const output = (
      <div className="space-y-2">
        <div className="text-primary font-bold">Available Commands:</div>
        <div className="space-y-1">
          {commands.map((cmd) => (
            <div key={cmd.name} className="flex gap-4">
              <span className="text-primary w-24">{cmd.name}</span>
              <span className="text-muted-foreground">{cmd.description}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 text-muted-foreground text-sm">
          Type &apos;help [command]&apos; for more information on a specific command.
        </div>
      </div>
    )
    
    return { output }
  },
})
