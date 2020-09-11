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
