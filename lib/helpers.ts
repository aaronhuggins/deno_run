import { Ajv, resolve, dirname } from '../deps.ts'
import { DenoManifest, DenoManifestSchema } from './types.ts'
import { message, prompt } from './terminal.ts'
import { importSandbox } from './importSandbox.ts'
import type { CliCommand } from './cli.ts'

export const MANIFEST_FNAME = 'manifest.ts'
export const FILE_HANDLE = 'file://localhost/'

export function safeCwd (): string {
  try {
    return Deno.cwd()
  } catch (error) {
    if (error instanceof Deno.errors.PermissionDenied) {
      return '.'
    }

    throw error
  }
}

export function isUnstable (manifest: DenoManifest): boolean {
  return !!manifest.unstable || (typeof manifest.permissions === 'object' && !!manifest.permissions.plugin)
}

export function isUrl (path?: string): boolean {
  if (
    typeof path === 'undefined' ||
    path === null ||
    path === '' ||
    path.startsWith('/') ||
    (/^[a-zA-Z]:/gu).test(path)
  ) return false

  try {
    new URL(path)

    return true
  } catch (error) {}

  return false
}

export function validateManifest (manifest: DenoManifest): AggregateError | undefined {
  // @ts-ignore Stupid vscode runtime incorrectly typing, but Deno is working fine.
  const ajv: Ajv = new Ajv({ allErrors: true })
  const valid: boolean = ajv.validate(DenoManifestSchema, manifest)

  if (!valid) {
    return new AggregateError(
      ajv.errors.map((error: any) => new Error(`manifest${error.dataPath} ${error.message}`)),
      ajv.errorsText()
    )
  }
}

export function pathToManifest (path: string = ''): string {
  const url = isUrl(path)

  if (!url && (path.trim() === '' || path.trim() === '.' || path.trim().toLowerCase() === MANIFEST_FNAME)) {
    return new URL(FILE_HANDLE + resolve(safeCwd(), MANIFEST_FNAME)).toString()
  }
  if (!url && path.endsWith('.ts')) {
    return new URL(FILE_HANDLE + resolve(dirname(path), MANIFEST_FNAME)).toString()
  }
  if (!url && (path.endsWith('/') || path.endsWith('\\'))) {
    return new URL(FILE_HANDLE + resolve(path, MANIFEST_FNAME)).toString()
  }
  if (url && (path.trim().endsWith('/') || new URL(path).pathname.endsWith('.ts'))) {
    const url = new URL(path)
    const pathParts = url.pathname.split(/\//gu)

    if (pathParts.length > 0) {
      pathParts.splice(pathParts.length - 1, 1, MANIFEST_FNAME)
    } else {
      pathParts.push('', MANIFEST_FNAME)
    }

    url.pathname = pathParts.join('/')

    return url.toString()
  }

  return path
}

export async function importManifest (manifestPath: string): Promise<DenoManifest> {
  try {
    const module = await importSandbox(manifestPath)

    return module.default || module.manifest
  } catch (error) {
    return {} as DenoManifest
  }
}

export function getManifestEntry (importPath: string, entry?: string): URL {
  return new URL('./' + (entry || 'mod.ts'), importPath)
}

export function manifestToCommand (importPath: string, manifest: DenoManifest, command: CliCommand, flags: string[], script?: string[]) {
  const cmd = ['deno', command]
  const permissions: string[] = []
  const url = getManifestEntry(importPath, manifest.entry)
  const file = url.protocol === 'file:'
    ? resolve(Deno.build.os === 'windows' ? url.pathname.substring(1) : url.pathname)
    : url.toString()

  for (const [permission, value] of Object.entries(manifest.permissions || {})) {
    if (typeof value === 'boolean') {
      permissions.push('--allow-' + permission)
    } else if (Array.isArray(value)) {
      permissions.push('--allow-' + permission + '=' + value.join(','))
    }
  }

  if (isUnstable(manifest)) cmd.push('--unstable')

  cmd.push(...flags)
  cmd.push(...permissions)

  if (command === 'install') cmd.push('--name', manifest.name)

  cmd.push(file)

  if (typeof script !== 'undefined') cmd.push(...script)

  return cmd
}

export function manifestPermissionPrompt (manifest: DenoManifest, allowAll: boolean = false): void {
  const { permissions = {} } = manifest
  const permissionEntries = Object.entries(permissions)
  const unstable = isUnstable(manifest)
  const query = (question: string, permission: string) => {
    const yes = ['y', 'yes']
    const response = prompt(question)

    if (!yes.includes(response.trim().toLowerCase())) {
      message(`  Permission '${permission}' denied; exiting now.`)
      Deno.exit()
    }
  }

  if (permissionEntries.length === 0 && !unstable) {
    message('This project requests no permissions in order to run.')

    return
  }

  message('This project requests the following permissions:')

  for (const [permission, value] of permissionEntries) {
    if (value) {
      const specificMsg = Array.isArray(value)
        ? ' with access to ' + value.join(', ')
        : ''
      const promptEnd = allowAll ? 'ing with `--dr.allow-all`.' : '? (y|yes|n|no)'
      const question = `  ${permission}${specificMsg}; accept${promptEnd} `

      if (allowAll) {
        message(question)
      } else {
        query(question, permission)
      }
    }
  }

  if (unstable && !allowAll) {
    query('This project also requires unstable features; accept? (y|yes|n|no)', 'unstable')

    return
  }
}
