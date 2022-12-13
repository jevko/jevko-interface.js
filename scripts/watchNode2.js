import { dirname, join, extname, isAbsolute, relative, basename } from "https://deno.land/std@0.165.0/path/mod.ts";

import localConfig from '../localConfig.json' assert { type: "json" }

const targetPath = localConfig.jevkoVscodeTargetPath

if (targetPath === '$INVALID$') {
  const p = Deno.run({
    cmd: ['notify-send', `[jevko-cli live script] invalid local configuration!`]
  })
  await p.status()
  throw Error('invalid local configuration!')
}

// create dirs if not exist
Deno.mkdirSync(targetPath, { recursive: true });

const watcher = Deno.watchFs(["./node/bundle.js"]);

for await (const event of watcher) {
  console.log(">>>> event", event);
  // { kind: "create", paths: [ "/foo.txt" ] }
  if (event.kind === 'modify') for (const path of event.paths) {
    const rel = relative('./node', path)

    Deno.copyFileSync(path, targetPath + rel);
  } 
}