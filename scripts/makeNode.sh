cp -r portable node
deno bundle bundlable/deps.b.js node/bundlable/deps.b.js
esbuild node/portable/main.js --outfile=node/bundle.js --bundle --platform=node