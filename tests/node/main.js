import {run, readFullStdoutText, writeFullStdinText} from '../../node/nonportable/deps.js'

const test = async (name, fn) => {
  process.stdout.write(`Running test '${name}'... `)
  try {
    await fn()
    process.stdout.write('success!\n')
  } catch (e) {
    process.stdout.write('FAILURE!\n')
    console.error(e)
  }
}

const assertEquals = (a, b) => {
  if (a !== b) throw Error(`Assertion failed! ${a} !== ${b}`)
}

test('run', async () => {
  const proc = run({
    cmd: ['node']
  })

  writeFullStdinText(proc, 'console.log("TEST")\n')

  const out = await readFullStdoutText(proc)

  assertEquals(out.includes('TEST'), true)
})