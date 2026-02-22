import { CommandResult } from '../types'

export function cmdClear(): CommandResult {
  return { output: [], clear: true }
}
