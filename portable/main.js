import {jevkoml, jevkocfg, jevkodata, map, prep as prepdata, prettyFromJsonStr, parseJevkoWithHeredocs} from '../bundlable/deps.b.js'

import {importDirective} from './importDirective.js'

import {dirname, join, extname, basename, isAbsolute, readTextFileSync, readStdinText, writeTextFileSync, mkdirRecursiveSync, existsSync, run, endProc, readFullStdoutText, writeFullStdinText} from '../nonportable/deps.js'

const defaultOptions = {
  platform: 'deno'
}

const defaultOutput_ = (text) => console.log(text)
const defaultInput_ = async () => readStdinText()

const markdown = (jevko) => {
  const {tag, suffix, ...rest} = jevko
  const proc = run({
    cmd: ['pandoc', '-f', 'markdown', '-t', 'html']
  })
  writeFullStdinText(proc, suffix)
  return readFullStdoutText(proc)
}

const extendedJevkoml = (jevko, opts) => {
  return jevkoml(jevko, {
    ...opts,
		extensions: {
      elements: {
        markdown,
        md: markdown,
      }
    }
  })
}

const formatToHandler = new Map([
  ['jevkoml', extendedJevkoml],
  ['jevkomarkup', extendedJevkoml],
  ['jm', extendedJevkoml],

  // todo: support options in jevkocfg or lose jevkocfg
  ['jevkocfg', jevkocfg],
  ['jevkoconfig', jevkocfg],
  ['jc', jevkocfg],

  ['jevkodata', jevkodata],
  ['jd', jevkodata],
])

const defaultFormatHandler_ = (format) => {
  throw Error(`Unrecognized format: ${format}`)
}

// todo: don't do anything for unrecognized formats
const recognizedFormats = [...formatToHandler.keys()]

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

  // note: trying to extract options even for unrecognized formats -- one of the options might be "format"
  const {options: opts, source: src} = extractOptions(source)

  const options = Object.assign({}, defaultOptions, opts, argmap)
  {
    const {format, defaultFormatHandler = defaultFormatHandler_} = options

    // handle unrecognized formats
    if (recognizedFormats.includes(format) === false) return defaultFormatHandler(format)

    const jevko = parseJevkoWithHeredocs(src)

    // resolve imports
    // note: could be made optional
    const preppedJevko = importDirective(jevko, options)
    // if (format !== undefined) {
    //   const f = options.format
    //   if (f !== undefined && format !== f) throw Error(`declared format (${format}) inconsistent with command line format or file extension (${f})`)
    // }

    const handler = formatToHandler.get(format)
    
    let result = await handler(preppedJevko, options)
    
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

// todo: perhaps use a partial streaming parser instead -- this won't allow heredocs in options (only classic Jevko)
const extractOptions = source => {
  let depth = 0, a = 0
  let isEscaped = false

  const noOptions = (msg) => ({
    options: Object.create(null),
    source,
    msg,
  })

  for (let i = 0; i < source.length; ++i) {
    const c = source[i]
    if (isEscaped) {
      if (['[', ']', '`'].includes(c)) {
        isEscaped = false
      } else return noOptions(`Unrecognized digraph: \`${c}`)

    } else if (c === '[') {
      if (depth === 0) {
        if (source.slice(0, i).trim() !== '') return noOptions()
        a = i + 1
      }
      ++depth
    } else if (c === ']') {
      if (depth === 0) return noOptions(`Unbalanced ] while parsing options!`)
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
    } else if (c === '`') {
      if (depth === 0) {
        return noOptions()
      }
      isEscaped = true
    }
  }
  if (depth > 0) return noOptions(`Error while parsing options: unexpected end before ${depth} brackets closed!`)
  return noOptions(`Error while parsing options!`)
}
