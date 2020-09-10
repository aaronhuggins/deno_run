import {
  importManifest,
  validateManifest,
  manifestToCommand,
  pathToManifest,
  getManifestEntry,
  manifestPermissionPrompt
} from './lib/helpers.ts'
import { getOptions } from './lib/cli.ts'
import { message, pause } from './lib/terminal.ts'

function isTargetSelf (importPath: string, entry?: string): boolean {
  const self = import.meta.url
  const target = getManifestEntry(importPath, entry)

  return self === target
}

async function main () {
  const options = getOptions()
  const importPath = pathToManifest(options.dr.manifest)
  const manifest = await importManifest(importPath)
  const targetSelf = isTargetSelf(importPath, manifest.entry)

  if (options.dr.command === 'help') {
    // TODO: help output
    return
  }

  let cmd: string[] = []

  if (!options.dr.force) {
    const error = validateManifest(manifest)

    if (typeof error !== 'undefined') {
      throw error
    }
  }

  if (options.dr.command === 'display' || (targetSelf && options.dr.command === 'run')) {
    cmd = manifestToCommand(importPath, manifest, 'run', options.deno)

    if (targetSelf && options.dr.command === 'run') {
      message('')
      message('WARNING !! Target script or command cannot be itself. !!')
      message('')
      pause()
    }

    message('Deno CLI Command:')
    message('  ' + cmd.join(' '))
    message('Manifest:')
    message(manifest)
    return
  }

  manifestPermissionPrompt(manifest, options.dr.allowAll)

  if (options.dr.command === 'install' || options.dr.command === 'upgrade') {
    const deno = [...options.deno]

    if (options.dr.command === 'upgrade') deno.push('--force')

    cmd = manifestToCommand(importPath, manifest, 'install', options.deno)
  }

  if (options.dr.command === 'run') {
    cmd = manifestToCommand(importPath, manifest, 'run', options.deno)
  }

  if (cmd.length > 0) {
    const process = Deno.run({
      cmd,
      cwd: Deno.cwd(),
      stderr: 'inherit',
      stdout: 'inherit',
      stdin: 'inherit'
    })
    const status = await process.status()

    if (status.code > 0) {
      Deno.exit(status.code)
    }
  }
}

main()
