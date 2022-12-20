const watcher = Deno.watchFs(["./portable"]);
import { dirname, join, extname, isAbsolute, relative, basename } from "https://deno.land/std@0.165.0/path/mod.ts";
for await (const event of watcher) {
  console.log(">>>> event", event);
  // { kind: "create", paths: [ "/foo.txt" ] }
  if (event.kind === 'modify') for (const path of event.paths) {
    const rel = relative('./portable', path)
    Deno.copyFileSync(path, './node/portable/' + rel);
  } 
}

// cat main.js | deno fmt --watch - > node/main.js
// cat importDirective.js | deno fmt --watch - > node/importDirective.js