export {dirname, join, extname, basename, isAbsolute} from 'node:path'
import { spawn } from 'node:child_process';
export {readTextFileSync, readStdinText, writeTextFileSync, mkdirRecursiveSync, existsSync} from './io.js'

import {get} from 'node:https'

export const fetchText = async url => {
  return new Promise((resolve, reject) => {
    get(url, res => {
      let body = ""

      res.on("data", (chunk) => {
        body += chunk
      })

      res.on("end", () => {
        resolve(body)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

const stdioMap = new Map([
  ['inherit', 'inherit'],
  ['piped', 'pipe'],
  ['null', 'ignore'],
])
const mapStdio = (deno) => {
  if (stdioMap.has(deno)) return stdioMap.get(deno)
  throw Error('Unrecognized stdio option: ' + deno)
}
// todo: test compat w/ Deno; document what it supports (currently command+args+stdio)
export const run = (opts) => {
  const [command, ...args] = opts.cmd
  const {stdin = 'piped', stdout = 'piped', stderr = 'piped'} = opts
  // Deno: inherit, piped, null
  // Node: inherit, pipe, ignore
  const stdio = [mapStdio(stdin), mapStdio(stdout), mapStdio(stderr)]
  return spawn(command, args, {stdio})
}

// todo: test
export const endProc = async (proc) => {
  return new Promise((resolve, reject) => {
    proc.on('close', (code) => {
      resolve(code)
    })
  })
}

export const writeFullStdinText = async (proc, text) => {
  const {stdin} = proc

  stdin.setDefaultEncoding('utf-8')

  stdin.end(text)
}

export const readFullStdoutText = async (proc) => {
  const {stdout} = proc

  stdout.setEncoding('utf8')

  let ret = ''
  for await (const chunk of stdout) {
    ret += chunk
  }
  return ret
}