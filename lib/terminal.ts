function objectToSource (val: any) {
  const CIRC_REF = '[Circular]'

  function circular () {
    const visited = new Set()

    return function replacer (key: string, value: any) {
      if (typeof value === 'object' && value !== null) {
        if (visited.has(value)) {
          return CIRC_REF
        }

        visited.add(value)
      }

      if (typeof value === 'function') {
        return `[Function: ${typeof value.name === 'undefined' ? key : value.name}]`
      }

      return value
    }
  }

  return JSON.stringify(val, circular(), 2)
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/gu, '$1:')
    .replace(/"\[Function: ([a-zA-Z_][a-zA-Z0-9_]*)\]"/gu, '[Function: $1]')
    .replace(/"\[Circular\]"/gu, CIRC_REF)
}

export const { log: message } = console

export function prompt(message: string = '') {
  const buf = new Uint8Array(1024)

  Deno.stdout.writeSync(new TextEncoder().encode(message.length > 0 ? message + ': ' : ''))

  const n = Deno.stdin.readSync(buf) as number

  return new TextDecoder().decode(buf.subarray(0, n)).trim()
}

export function pause () {
  prompt('Press enter to continue')
  message('')
}
