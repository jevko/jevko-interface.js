# assuming this script is only used for local development
sh scripts/linkLocalDeps.sh
deno bundle --watch bundlable/deps.b.js node/bundlable/deps.b.js &
deno run -A --watch scripts/watchNode.js &
deno run -A --watch scripts/watchNode2.js &
esbuild node/portable/main.js --outfile=node/bundle.js --bundle --watch --platform=node