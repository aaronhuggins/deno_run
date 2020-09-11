import { Colors } from './deps.ts'
import {
  importManifest,
  validateManifest,
  manifestToCommand,
  pathToManifest,
  getManifestEntry,
  manifestPermissionPrompt,
  safeCwd
} from './lib/_helpers.ts'
import { getOptions, getHelp } from './lib/_cli.ts'
import { message, pause } from './lib/_terminal.ts'

/** Determine if the entry point is the same as this import. */
function isTargetSelf (importPath: string, entry?: string): boolean {
  const self = import.meta.url
  const target = getManifestEntry(importPath, entry).toString()

  return self === target
}

/** Simple command runner. */
async function runner (cmd: string[]) {
  const process = Deno.run({
    cmd,
    cwd: safeCwd(),
    stderr: 'inherit',
    stdout: 'inherit',
    stdin: 'inherit'
  })
  const status = await process.status()

  if (status.code > 0) {
    Deno.exit(status.code)
  }
}

/** Main program logic. */
async function main () {
  const options = getOptions()

  if (options.dr.command === 'bootstrap') {
    await runner(['deno', 'install', '--allow-net', '--allow-read', '--allow-run', import.meta.url])

    return
  }

  if (options.dr.command === 'help') {
    message(getHelp())
    return
  }

  const importPath = pathToManifest(options.dr.manifest)
  const manifest = await importManifest(importPath)
  const targetSelf = isTargetSelf(importPath, manifest.entry)

  let cmd: string[] = []

  if (!options.dr.force || options.dr.command === 'validate') {
    const error = validateManifest(manifest)

    if (typeof error !== 'undefined') {
      if (options.dr.command === 'validate') {
        message('')
        message('  ' + Colors.red('✖') + ' Invalid manifest: ' + Colors.cyan(importPath))
        message('')
      }

      throw error
    }

    // Exit early for validate command.
    if (options.dr.command === 'validate') {
      message('')
      message('  ' + Colors.green('✓') + ' Valid manifest: ' + Colors.cyan(importPath))
      message('')

      return
    }
  }

  if (options.dr.command === 'display' || (targetSelf && options.dr.command === 'run')) {
    cmd = manifestToCommand(importPath, manifest, 'run', options.deno, options.script)

    if (targetSelf && options.dr.command === 'run') {
      message('')
      message('  ' + Colors.red('✖ WARNING') + ' !! Target script or command cannot be itself. !!')
      message('')
      pause()
    }

    message('Deno CLI Command:')
    message('  ' + Colors.cyan(cmd.join(' ')))
    message('Manifest:')
    message(manifest)
    return
  }

  manifestPermissionPrompt(manifest, options.dr.allowAll, options.dr.allowSkip)

  if (options.dr.command === 'install' || options.dr.command === 'upgrade') {
    const deno = [...options.deno]

    if (options.dr.command === 'upgrade') deno.push('--force')

    cmd = manifestToCommand(importPath, manifest, 'install', deno)
  }

  if (options.dr.command === 'run') {
    cmd = manifestToCommand(importPath, manifest, 'run', options.deno, options.script)
  }

  if (cmd.length > 0) {
    await runner(cmd)
  }
}

main()
