import { registerCommand } from '../registry'

registerCommand({
  name: 'whoami',
  description: 'Display current user information',
  usage: 'whoami',
  handler: (cmd, context) => {
    const output = (
      <div className="space-y-1">
        <div>Username: <span className="text-primary">{context.username}</span></div>
        <div>User ID: <span className="text-muted-foreground">{context.userId}</span></div>
      </div>
    )
    
    return { output }
  },
})
