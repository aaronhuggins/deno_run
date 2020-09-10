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

      return value
    }
  }

  return JSON.stringify(val, circular(), 2)
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/gu, '$1:')
    .replace(/"\[Circular\]"/gu, CIRC_REF)
}

export function message (...args: any[]) {
  const eol = Deno.build.os === 'windows' ? '\r\n' : '\n'
  const str = args.map(item => {
    return typeof item === 'object' ? objectToSource(item) : item
  }).join(' ')

  Deno.stdout.writeSync(new TextEncoder().encode(str + eol))
}

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
