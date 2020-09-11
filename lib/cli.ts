import { parser, Arguments } from '../deps.ts'
import { MANIFEST_FNAME, isUrl } from './helpers.ts'
import manifest from '../manifest.ts'

export type CliCommand = 'run' | 'install' | 'display' | 'help' | 'upgrade' | 'bootstrap'
export interface CliOptions {
  dr: {
    command: CliCommand
    manifest: string
    force: boolean
    allowAll: boolean
  }
  deno: string[]
  script: string[]
}

const COMMANDS: CliCommand[] = [
  'display',
  'help',
  'install',
  'run',
  'upgrade',
  'bootstrap'
]
const CMD = {
  RUN: 'run',
  HELP: 'help',
  INSTALL: 'install',
  UPGRADE: 'upgrade',
  DISPLAY: 'display',
  BOOTSTRAP: 'bootstrap'
}
const FLAG = {
  CMD: '--dr.command',
  MFST: '--dr.manifest'
}

/** Sort arguments passed to Deno into cli arguments and Deno arguments. */
export function getArgs (): { deno: string[], dr: string[], script: string[] } {
  const args = Deno.args.map(item => item)
  const dr: string[] = []
  const deno: string[] = []
  const script: string[] = []
  let isScript = false
  let isDr = false

  if (args.length === 0) {
    dr.push(FLAG.CMD, CMD.RUN, FLAG.MFST, MANIFEST_FNAME)

    return { deno, dr, script }
  }

  if (args.length === 1 && COMMANDS.includes(args[0] as CliCommand)) {
    if (args[0] === CMD.HELP) return { deno, dr: [FLAG.CMD, CMD.HELP], script }

    dr.push(FLAG.CMD, args[0], FLAG.MFST, MANIFEST_FNAME)

    return { deno, dr, script }
  }

  for (let i = 0; i < args.length; i += 1) {
    if (i === 0 && COMMANDS.includes(args[i] as CliCommand)) {
      dr.push(FLAG.CMD, args[i])

      continue
    }

    if (i === 0 && args[i].endsWith(MANIFEST_FNAME)) {
      dr.push(FLAG.CMD, CMD.RUN, FLAG.MFST, args[i])
      isScript = true

      continue
    }

    if (!isScript && (args[i].endsWith(MANIFEST_FNAME) || isUrl(args[i]))) {
      dr.push(FLAG.MFST, args[i])
      isScript = true

      continue
    }

    if (isScript) {
      script.push(args[i])
    } else if (isDr) {
      dr.push(args[i])
    } else if (args[i].startsWith('--dr.')) {
      dr.push(args[i])
      isDr = true
    } else if (args[i].startsWith('--')) {
      deno.push(args[i])
      isDr = false
    } else {
      deno.push(args[i])
    }
  }

  return { deno, dr, script }
}

export function getOptions (): CliOptions {
  const { deno, dr, script } = getArgs()
  const argv: Arguments = parser(dr, {
    default: { 'dr.force': false, 'dr.allow-all': false },
    narg: {
      'dr.force': 0,
      'dr.allow-all': 0,
      'dr.manifest': 1,
      'dr.command': 1
    },
    boolean: ['dr.force', 'dr.allow-all'],
    string: ['dr.manifest', 'dr.command']
  })
  const options: CliOptions = {
    dr: { ...argv.dr },
    deno,
    script
  }

  return options
}

export function getHelp () {
  const help = `
deno_run ${manifest.version}
A Deno manifest runner utility

USAGE:
  deno_run [COMMAND] [OPTIONS] <MANIFEST_FILE> [SCRIPT FLAGS]

COMMANDS:
  bootstrap         Bootstraps deno_run when installing for the first time.
  display           Output the composed deno command and manifest file
                    contents.
  help              Output this help text.
  install           Install the project entry point in a given manifest.
  run               Run the project entry point with a given manifest.
  upgrade           Install a project, adding --force for deno.

OPTIONS:
  --dr.force        Use with command 'display' toignore errors.
  --dr.allow-all    Use with commands 'install', 'run', and 'upgrade' to accept
                    all permissions.

  Additionally any valid option for 'deno run' or 'deno install' may be passed.

MANIFEST_FILE:
  Any valid url or file path to a valid manifest.ts

SCRIPT_FLAGS
  Any flags placed after manifest.ts will be passed to the project entry point.`

  return help
}
