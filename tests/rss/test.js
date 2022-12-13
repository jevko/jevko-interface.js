import {main} from '../../portable/main.js'
import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";

Deno.test('rss', async () => {
  await main({input: 'tests/rss/feed.jevkoml'})

  const document = Deno.readTextFileSync('tests/rss/out/feed.rss')

  const expected = Deno.readTextFileSync('tests/rss/feed.expected.rss')

  assertEquals(document, expected)
})