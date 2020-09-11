export interface DenoManifest {
  /** Name of the deno project; required. */
  name: string
  /** Version of the deno project; required, must conform to semantic versioning. */
  version: string
  /** Entry point of the project; deno_run will fall back to `mod.ts` if not provided. */
  entry?: string
  /** Url root of the project manifest; used by deno_run to check manifest integrity and version. Not yet implemented. */
  url?: string
  /** Run deno cli with `--unstable`. */
  unstable?: boolean
  /**
   * Runtime permissions for the project; will be passed to deno cli by deno_run.
   * See https://deno.land/manual/getting_started/permissions for more information.
   * The `--allow-all` permission is explicitly not supported for security reasons.
   * Permissions must be explicitly set so that users can reason about their security.
   */
  permissions?: {
    /** Allow environment access for things like getting and setting of environment variables. */
    env?: boolean
    /** Allow high-resolution time measurement. High-resolution time can be used in timing attacks and fingerprinting. */
    hrtime?: boolean
    /**
     * Allow network access.
     * You can specify a list of domains to provide an allow-list of allowed domains.
     */
    net?: boolean | string[]
    /**
     * Allow loading plugins.
     * Please note that `--allow-plugin` is an unstable feature and deno_run will explicitly enable `--unstable`.
     */
    plugin?: boolean
    /**
     * Allow file system read access.
     * You can specify a list of directories or files to provide a allow-list of allowed file system access.
     */
    read?: boolean | string[]
    /**
     * Allow running subprocesses.
     * Be aware that subprocesses are not run in a sandbox and therefore do not have
     * the same security restrictions as the deno process. Therefore, use with caution.
     */
    run?: boolean
    /**
     * Allow file system write access.
     * You can specify a list of directories or files to provide a allow-list of allowed file system access.
     */
    write?: boolean | string[]
  }
  /** Project metadata; will be ignored by deno_run but may be used to store additional values. */
  metadata?: Record<string, any>
}

export const DenoManifestSchema = {
  required: ['name', 'version'],
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string'
    },
    version: {
      pattern:
        '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$',
      type: 'string'
    },
    entry: {
      type: 'string'
    },
    url: {
      type: 'string',
      format: 'uri'
    },
    unstable: {
      type: 'boolean'
    },
    permissions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        env: {
          type: 'boolean'
        },
        hrtime: {
          type: 'boolean'
        },
        net: {
          type: ['boolean', 'array'],
          items: {
            type: 'string'
          }
        },
        plugin: {
          type: 'boolean'
        },
        read: {
          type: ['boolean', 'array'],
          items: {
            type: 'string'
          }
        },
        run: {
          type: 'boolean'
        },
        write: {
          type: ['boolean', 'array'],
          items: {
            type: 'string'
          }
        }
      }
    },
    metadata: {
      type: 'object',
      additionalProperties: true
    }
  }
}
