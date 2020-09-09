import { parser, Arguments } from '../deps.ts'
import { MANIFEST_FNAME } from './helpers.ts'

export type CliCommand = 'run' | 'install' | 'display' | 'help' | 'upgrade'

const COMMANDS: CliCommand[] = [
  'display',
  'help',
  'install',
  'run',
  'upgrade'
]

/** Split arguments passed to Deno into cli arguments and Deno arguments. */
export function getArgs (): { deno: string[], cli: string[] } {
  const args = Deno.args.map(item => item)
  const deno: string[] = []
  const cli: string[] = ['--_command']
  let isDeno = true

  if (args.length === 0) {
    cli.push('run', '--_manifest', MANIFEST_FNAME)

    return { deno, cli }
  }

  if (args.length === 1 && COMMANDS.includes(args[0] as CliCommand)) {
    if (args[0] === 'help') return { deno, cli: ['--_command', 'help'] }

    cli.push(args[0], '--_manifest', MANIFEST_FNAME)

    return { deno, cli }
  }

  for (let i = 0; i < args.length; i += 1) {
    if (i === 0 && COMMANDS.includes(args[i] as CliCommand)) {
      cli.push(args[i])

      if (args[i] === 'display') isDeno = false

      continue
    }

    if (i === 0 && args[i].endsWith(MANIFEST_FNAME)) {
      cli.push('run', '--_manifest', args[i])
      isDeno = false

      continue
    }

    if (isDeno && args[i].endsWith(MANIFEST_FNAME)) {
      cli.push('--_manifest', args[i])
      isDeno = false

      continue
    }

    if (isDeno) {
      deno.push(args[i])
    } else {
      cli.push(args[i])
    }
  }

  return { deno, cli }
}

export function getOptions (): {
  _deno: string[]
  _cli: string[]
  deno: Arguments
  cli: Arguments
} {
  const { deno, cli } = getArgs()

  return {
    _deno: deno,
    _cli: cli,
    deno: parser(deno),
    cli: parser(cli, {
      default: { force: false },
      boolean: ['force'],
      string: ['_manifest', '_command']
    })
  }
}
