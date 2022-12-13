import {main} from '../../portable/main.js'
import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";
import * as path from "https://deno.land/std@0.57.0/path/mod.ts";

// todo: use the same trick in other tests and in the remaining paths in this test
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

Deno.test('xml literals', async () => {
  Deno.mkdirSync(`${__dirname}/out`, {recursive: true})
  await main({input: `${__dirname}/test.jevkoml`, output: `${__dirname}/out/feed2.rss`})

  const document = Deno.readTextFileSync('tests/xml-literals/out/feed2.rss')

  const expected = Deno.readTextFileSync('tests/xml-literals/feed.expected.rss')

  assertEquals(document, expected)
})