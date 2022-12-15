// todo: either drop or extract to a jevko-lib and reuse in formats

export const readTextFileSync = (fileName) => {
  return Deno.readTextFileSync(fileName)
}

export const writeTextFileSync = (fileName, contents) => {
  return Deno.writeTextFileSync(fileName, contents)
}

// todo: put that in an external lib -- then it would make sense to also put the node version of this into an external lib
export const readStdinText = async () => {
  let src = ''
  const decoder = new TextDecoder()
  for await (const chunk of Deno.stdin.readable) {
    src += decoder.decode(chunk)
  }
  return src
}

export const mkdirRecursiveSync = (path) => {
  Deno.mkdirSync(path, {recursive: true})
}

export const existsSync = path => {
  try {
    Deno.lstatSync(path)
    return true
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return false
    throw e
  }
}