'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const info = require('../src/info.json');
const pkg = require('../package.json');

function runtime(options = {}, responses = []) {
  const requests = [];
  const context = vm.createContext({
    $option: options,
    $http: { request(request) {
      requests.push(request);
      assert.ok(responses.length, 'Unexpected HTTP request');
      request.handler(responses.shift());
    } },
  });
  vm.runInContext(fs.readFileSync('src/main.js', 'utf8'), context);
  return { context, requests };
}

const query = { text: 'Hello', from: 'en', to: 'zh-Hans' };

test('metadata versions, identifiers, and options agree', () => {
  assert.equal(info.version, pkg.version);
  assert.equal(pkg.name, 'bob-openai-compatible-translate');
  assert.equal(info.options.find(o => o.identifier === 'apiKey').textConfig.type, 'secure');
});

test('missing key fails locally without a request', () => {
  const { context, requests } = runtime();
  let result;
  context.translate(query, r => { result = r; });
  assert.equal(result.error.type, 'param');
  assert.equal(requests.length, 0);
});

test('Responses request and output extraction', () => {
  const { context, requests } = runtime({ apiKey: 'test-placeholder' }, [{ data: { output: [{ content: [{ type: 'output_text', text: 'Translated' }] }] } }]);
  let result;
  context.translate(query, r => { result = r; });
  assert.equal(requests[0].url, 'https://api.openai.com/v1/responses');
  assert.equal(requests[0].body.reasoning.effort, 'low');
  assert.equal(result.result.toParagraphs[0], 'Translated');
  assert.equal(result.result.fromParagraphs[0], 'Hello');
});

test('Chat Completions request and output extraction', () => {
  const { context, requests } = runtime({ apiKey: 'test-placeholder', apiType: 'chat_completions', baseUrl: 'https://example.com/v1/', model: 'test-model' }, [{ data: { choices: [{ message: { content: 'Translated' } }] } }]);
  let result;
  context.translate(query, r => { result = r; });
  assert.equal(requests[0].url, 'https://example.com/v1/chat/completions');
  assert.equal(requests[0].body.model, 'test-model');
  assert.equal(result.result.toParagraphs[0], 'Translated');
});

test('unsupported reasoning effort falls back, then omits parameter', () => {
  const unsupported = () => ({ statusCode: 400, data: { error: { message: 'Unsupported reasoning effort' } } });
  const { context, requests } = runtime({ apiKey: 'test-placeholder', reasoningEffort: 'max' }, [unsupported(), unsupported(), unsupported(), unsupported(), { data: { output_text: 'Translated' } }]);
  let completions = 0;
  context.translate(query, () => { completions++; });
  assert.deepEqual(requests.map(r => r.body.reasoning?.effort), ['max', 'high', 'medium', 'low', undefined]);
  assert.equal(completions, 1);
});

test('authentication errors do not retry', () => {
  const { context, requests } = runtime({ apiKey: 'test-placeholder' }, [{ statusCode: 401, data: { error: { code: 'invalid_api_key' } } }]);
  let result;
  context.translate(query, r => { result = r; });
  assert.equal(requests.length, 1);
  assert.equal(result.error.type, 'api');
  assert.equal(result.error.message, 'Invalid API key');
});

test('network errors and malformed or empty output are reported', () => {
  for (const response of [{ error: { message: 'Offline' } }, { data: {} }, { data: { output_text: '' } }]) {
    const { context } = runtime({ apiKey: 'test-placeholder' }, [response]);
    let result;
    context.translate(query, r => { result = r; });
    assert.ok(result.error);
  }
});

test('language list and prompt preserve supplied text', () => {
  const { context } = runtime();
  assert.ok(context.supportLanguages().includes('zh-Hans'));
  assert.ok(context.buildTranslatePrompt('Hello\nWorld', 'English', 'French').endsWith('Hello\nWorld'));
});

test('Bob metadata follows the documented schema', () => {
  assert.match(info.identifier, /^[a-z0-9.]+$/);
  assert.equal(info.minBobVersion, '1.8.0');
  for (const option of info.options) {
    if (option.textConfig) {
      assert.ok(['visible', 'secure'].includes(option.textConfig.type));
      assert.equal('placeholder' in option.textConfig, false);
    }
  }
});
