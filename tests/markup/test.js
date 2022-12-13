import {main} from '../../portable/main.js'
import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";

Deno.test('markup', async () => {
  await main({input: 'tests/markup/markup2.jevkoml'})

  const document = Deno.readTextFileSync('tests/markup/out/markup2.out.html')

  const expected = Deno.readTextFileSync('tests/markup/markup2.out.html')

  assertEquals(document, expected)
})