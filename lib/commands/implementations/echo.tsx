import { registerCommand } from '../registry'

registerCommand({
  name: 'echo',
  description: 'Display a line of text',
  usage: 'echo [text...]',
  handler: (cmd) => {
    const text = cmd.args.join(' ')
    return { output: text || '' }
  },
})
