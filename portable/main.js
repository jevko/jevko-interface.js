import {jevkoml, jevkocfg, jevkodata, map, prep as prepdata, prettyFromJsonStr, parseJevkoWithHeredocs} from '../bundlable/deps.b.js'

import {importDirective} from './importDirective.js'

import {dirname, join, extname, basename, isAbsolute, readTextFileSync, readStdinText, writeTextFileSync, mkdirRecursiveSync, existsSync, run, endProc} from '../nonportable/deps.js'

const defaultOptions = {
  platform: 'deno'
}

const defaultOutput_ = (text) => console.log(text)
const defaultInput_ = async () => readStdinText()

export const main = async (argmap = {}) => {
  let {
    input, 
    defaultInput = defaultInput_,
  } = argmap
  // todo: exactly 1?
  let source
  
  if (input !== undefined) {
    const fileName = argmap.input
    source = withoutShebang(readTextFileSync(fileName))
    argmap.dir = dirname(fileName)
    // format from args overrides extension
    // alternatively could error if extension doesn't match
    // note: now options precedence is:
    // cli options > file extension > in-file options
    //?todo: perhaps file extension should not override in-file options
    if (argmap.format === undefined) argmap.format = extname(fileName).slice(1)
  } else {
    source = await defaultInput()
    argmap.dir = '.'
  }
  
  // todo: don't parse as jevko if format is json/xml, etc. (non-jevko)
  if (argmap.format === 'json') {
    const result = prettyFromJsonStr(source)
    write(result, argmap)
    return
  }

  const {options: opts, source: src} = extractOptions(source)

  const options = Object.assign({}, defaultOptions, opts, argmap)
  {
    const jevko = parseJevkoWithHeredocs(src)

    // resolve imports
    // note: could be made optional
    const preppedJevko = importDirective(jevko, options)
    const {format} = options
    // if (format !== undefined) {
    //   const f = options.format
    //   if (f !== undefined && format !== f) throw Error(`declared format (${format}) inconsistent with command line format or file extension (${f})`)
    // }
    
    let result
    if (format === 'jevkoml') {
      const document = await jevkoml(preppedJevko, options)
      result = document
    } else if (format === 'jevkocfg') {
      // todo: support options in jevkocfg or lose jevkocfg
      result = jevkocfg(preppedJevko, options)
    } else if (format === 'jevkodata') {
      result = jevkodata(preppedJevko, options)
    } else throw Error(`Unrecognized format: ${format}`)
    
    await write(result, options)
  }  
}

const write = async (result, options) => {
  //?todo: rename /output to /to file
  let {
    output, 
    dir, 
    defaultOutput = defaultOutput_,
  } = options

  // infer output from input
  if (output === undefined && options['infer output'] === true) {
    const {input, format} = options
    if (input !== undefined) {
      const name = basename(input, extname(input))

      if (format === 'jevkoml') {
        output = name + '.xml'
      } else if (format === 'jevkodata') {
        output = name + '.json'
      } else if (format === 'json') {
        output = name + '.jevkodata'
      }
    }
  }

  // a helper fn
  const commit = async (output) => {
    // ask if overwrite
    if (existsSync(output)) {
      const {overwrite} = options

      if (typeof overwrite === 'function') {
        if (await overwrite(output) === false) {
          return
        }
      } else if (typeof overwrite === 'boolean') {
        if (overwrite === false) return
      } else {
        // note: default overwrite = false
        throw Error(`File ${output} exists!`)
      }
    }
    // create path if not exists
    mkdirRecursiveSync(dirname(output), {recursive: true})
    writeTextFileSync(output, result)
  }

  // todo: console.log makes no sense in vscode interface
  if (output === undefined) defaultOutput(result)
  else {
    const outpath = isAbsolute(output)?
      output: 
      join(dir, output)
    await commit(outpath)
    if (options.postout) {
      const {postout} = options
      let cmd
      if (typeof postout === 'string') {
        cmd = [postout]
      } else if (isArrayOfStrings(postout)) {
        cmd = postout
      }
      cmd.push(outpath)
      // todo: test different cases for cwd/dir
      const proc = run({cmd, cwd: dir})
      const exitCode = await endProc(proc)
      // todo: better error reporting
      if (exitCode !== 0) {
        throw Error(`Process ${cmd} exited with non-zero code: ${exitCode}`)
      }
    }
  }
}

// todo: extract?
const isArrayOfStrings = value => {
  if (Array.isArray(value) === false) return false
  if (value.every(v => typeof v === 'string') === false) return false
  return true
}

const withoutShebang = source => {
  if (source.startsWith('#!')) {
    const index = source.indexOf('\n')
    if (index === -1) return ""
    return source.slice(index)
  }
  return source
}

const extractOptions = source => {
  let depth = 0, a = 0
  for (let i = 0; i < source.length; ++i) {
    const c = source[i]
    if (c === '[') {
      if (depth === 0) {
        if (source.slice(0, i).trim() !== '') return {
          options: Object.create(null),
          source,
        }
        a = i + 1
      }
      ++depth
    } else if (c === ']') {
      if (depth === 0) throw Error(`Unbalanced ] while parsing options!`)
      --depth
      if (depth === 0) {
        const optionsText = source.slice(a, i)
        const optionsJevko = parseJevkoWithHeredocs(optionsText)

        const xyz = prepdata(optionsJevko)
        const options = map(xyz.subjevkos)

        return {
          options,
          source: source.slice(i + 1)
        }
      }
    }
  }
  if (depth > 0) throw Error(`Error while parsing options: unexpected end before ${depth} brackets closed!`)
  throw Error(`Error while parsing options!`)
}
