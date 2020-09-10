import { Ajv, resolve, dirname } from '../deps.ts'
import { DenoManifest, DenoManifestSchema } from './types.ts'
import type { CliCommand } from './cli.ts'

export const MANIFEST_FNAME = 'manifest.ts'
export const FILE_HANDLE = 'file://localhost/'

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
    return new URL(FILE_HANDLE + resolve(Deno.cwd(), MANIFEST_FNAME)).toString()
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
    const module = await import(manifestPath)

    return module.default || module.manifest
  } catch (error) {
    console.log(error)
    return {} as DenoManifest
  }
}

export function getManifestEntry (importPath: string, entry?: string): string {
  return new URL('./' + (entry || 'mod.ts'), importPath).toString()
}

export function manifestToCommand (importPath: string, manifest: DenoManifest, command: CliCommand, flags: string[], script?: string[]) {
  const cmd = ['deno', command]
  const permissions: string[] = []
  let unstable = false
  let file = getManifestEntry(importPath, manifest.entry)

  for (const [permission, value] of Object.entries(manifest.permissions || {})) {
    if (typeof value === 'boolean') {
      permissions.push('--allow-' + permission)
    } else if (Array.isArray(value)) {
      permissions.push('--allow-' + permission + '=' + value.join(','))
    }

    if (permission === 'plugin') unstable = true
  }

  if (manifest.unstable || unstable) cmd.push('--unstable')

  cmd.push(...flags)
  cmd.push(...permissions)
  cmd.push(file)
  if (typeof script !== 'undefined') cmd.push(...script)

  return cmd
}
