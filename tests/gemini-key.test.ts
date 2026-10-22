import test from 'node:test';
import assert from 'node:assert/strict';
import { processTableInput } from '../services/geminiService.ts';
const table = {suggestedTitle: 'Example', summary: 'One row', columns: [{key: 'name', label: 'Name'}], data: [{name: 'Ada'}]};

test('missing visitor key rejects before any request, regardless of environment key', async () => {
  const oldKey = process.env.API_KEY; const oldFetch = globalThis.fetch; let requests = 0;
  process.env.API_KEY = 'OWNER_KEY_MUST_NOT_BE_USED';
  globalThis.fetch = async () => {requests++; return new Response(JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(table)}]}}]}));};
  try {
    await assert.rejects(() => processTableInput('name,Ada', 'text'), /Add your Gemini API key/);
    assert.equal(requests, 0);
  } finally {globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.API_KEY; else process.env.API_KEY = oldKey;}
});

test('visitor key uses a header and text/image input is preserved', async () => {
  const oldFetch = globalThis.fetch; const requests: {url: string; key: string | null; body: string}[] = [];
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init); requests.push({url: req.url, key: req.headers.get('x-goog-api-key'), body: await req.text()});
    return new Response(JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(table)}]}}]}));
  };
  try {
    assert.deepEqual(await processTableInput('name,Ada', 'text', undefined, ' VISITOR_TEST_KEY '), table);
    await processTableInput('data:image/png;base64,TEST_IMAGE_BYTES', 'image', 'image/png', 'VISITOR_TEST_KEY');
    for (const req of requests) {assert.equal(new URL(req.url).origin, 'https://generativelanguage.googleapis.com'); assert.equal(new URL(req.url).searchParams.has('key'), false); assert.equal(req.key, 'VISITOR_TEST_KEY');}
    assert.match(requests[0].body, /name,Ada/); assert.match(requests[1].body, /TEST_IMAGE_BYTES/); assert.match(requests[1].body, /image\/png/);
  } finally {globalThis.fetch = oldFetch;}
});

test('authentication errors explain the visitor key and do not echo credentials', async () => {
  const oldFetch = globalThis.fetch; let requests = 0;
  globalThis.fetch = async () => {requests++; return new Response(JSON.stringify({error:{message:'Invalid VISITOR_TEST_KEY',code:401}}),{status:401});};
  try { await assert.rejects(() => processTableInput('name,Ada', 'text', undefined, 'VISITOR_TEST_KEY'), (error: Error) => {assert.match(error.message,/key/i); assert.doesNotMatch(error.message,/VISITOR_TEST_KEY/); return true;}); assert.equal(requests, 1); }
  finally {globalThis.fetch = oldFetch;}
});
