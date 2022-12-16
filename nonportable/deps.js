export { dirname, join, extname, basename, isAbsolute } from "https://deno.land/std@0.165.0/path/mod.ts";
export {readTextFileSync, readStdinText, writeTextFileSync, mkdirRecursiveSync, existsSync} from './io.js'
import {readAll} from "https://deno.land/std@0.163.0/streams/conversion.ts";


export const fetchText = async url => {
  const x = await fetch(url)
  return x.text()
}

export const run = (opts) => {
  return Deno.run(opts)
}

export const endProc = async (proc) => {
  return proc.status()
}

// todo: perhaps make this writeFullStdinText
export const writeFullStdin = async (proc, bytes) => {
  await proc.stdin.write(bytes)
  return await proc.stdin.close()
}

// todo: perhaps make this readFullStdinText
export const readFullStdout = async (proc) => {
  const bytes = await readAll(proc.stdout)
  await proc.stdout.close()
  return bytes
}