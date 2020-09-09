import {
  importManifest,
  validateManifest,
  manifestToCommand,
  pathToManifest
} from './lib/helpers.ts'
import { getOptions } from './lib/cli.ts'

async function main () {
  const options = getOptions()
  const importPath = pathToManifest(options.cli._manifest)
  const manifest = await importManifest(importPath)

  if (options.cli._command === 'help') {
    // TODO: help output
    return
  }

  if (options.cli._command === 'display') {
    if (!options.cli.force) {
      const valid = validateManifest(manifest)

      if (typeof valid !== 'undefined') {
        throw valid
      }
    }

    console.log('Deno CLI Command:')
    console.log('  ' + manifestToCommand(importPath, manifest, 'run', options._deno).join(' '))
    console.log('Manifest:')
    console.log(manifest)
    return
  }

  if (options.cli._command === 'install' || options.cli._command === 'upgrade') {
    // TODO: install/upgrade routine.
    return
  }

  if (options.cli._command === 'run') {
    // TODO: run script routine.
    return
  }
}

main()
