import {readFileSync, writeFileSync, mkdirSync, lstatSync} from 'node:fs'

export const readTextFileSync = (fileName) => {
  return readFileSync(fileName, 'utf-8')
}

export const writeTextFileSync = (fileName, contents) => {
  return writeFileSync(fileName, contents, 'utf-8')
}

export const readStdinText = async () => {
  const readable = process.stdin

  const chunks = [];

  readable.on('readable', () => {
    let chunk;
    while (null !== (chunk = readable.read())) {
      chunks.push(chunk);
    }
  });

  return new Promise((res, rej) => {
    readable.on('end', () => {
      res(chunks.join(''))
    });
  })
}

export const mkdirRecursiveSync = (path) => {
  mkdirSync(path, {recursive: true})
}

export const existsSync = path => {
  try {
    lstatSync(path)
    return true
  } catch (e) {
    if (e.code === 'ENOENT') return false
    throw e
  }
}