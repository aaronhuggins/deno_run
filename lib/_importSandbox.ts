declare var window: any
declare var self: {
  onmessage: (message: MessageEvent) => void
  postMessage: (data: any) => void
  dispatchEvent: (event: Event) => void
}

function sandboxError (type: string) {
  return `Import had one or more errors in the ${type} sandbox; no priviliged APIs may be used.`
}

/** Function for checking and executing code within a worker sandbox. */
export async function importSandbox (importPath: string): Promise<any> {
  // Try running in an unprivileged Deno subprocess.
  const process = Deno.run({
    cmd: ['deno', 'run', '--reload', '--quiet', importPath],
    stderr: 'piped',
    stdin: 'null',
    stdout: 'piped'
  })
  const [error, output] = await Promise.all([process.stderrOutput(), process.output()])
  // Subprocess may run no longer than 3.5 seconds to avoid application hangup attacks.
  const timer = setTimeout(() => process.close(), 3500)
  const status = await process.status().then(stat => {
    clearTimeout(timer)

    return stat
  })
  // If any output or a non-zero exit was recieved from the subprocess, fail the import.
  if (error.length > 0 || output.length > 0 || status.code !== 0) {
    throw new Deno.errors.PermissionDenied(sandboxError('subprocess'))
  }

  return await new Promise((resolve, reject) => {
    // Module importSandbox is its own worker.
    const sandbox = new Worker(
      import.meta.url,
      { type: 'module', name: 'tundra', deno: false }
    )
    sandbox.onmessage = (message: MessageEvent) => {
      resolve(message.data)
      sandbox.terminate()
    }
    sandbox.onerror = (event: ErrorEvent) => {
      reject(new Deno.errors.PermissionDenied(sandboxError('internal')))
    }

    sandbox.postMessage(importPath)
  })
}

if (import.meta.main && typeof window === 'undefined') {
  self.onmessage = async (message: MessageEvent) => {
    // Module to import occurs in extremely API-limited scope within worker.
    const module: any = await import(message.data)

    // Return the module import result unchanged.
    self.postMessage(module)
  }
}
