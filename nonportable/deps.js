export { dirname, join, extname, basename, isAbsolute } from "https://deno.land/std@0.165.0/path/mod.ts";
export {readTextFileSync, readStdinText, writeTextFileSync, mkdirRecursiveSync, existsSync} from './io.js'

export const fetchText = async url => {
  const x = await fetch(url)
  return x.text()
}