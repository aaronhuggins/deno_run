import type { DenoManifest } from './types.ts'

const manifest: DenoManifest = {
  name: 'deno_run',
  version: '0.3.0',
  entry: 'deno_run.ts',
  permissions: {
    net: [
      'deno.land',
      'github.com',
      'gitlab.com',
      'raw.githubusercontent.com',
      'x.nest.land'
    ],
    read: true,
    run: true
  }
}

export default manifest
