'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const info = require('../src/info.json');
const filename = 'bob-openai-compatible-translate.bobplugin';
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const feed = {
  identifier: info.identifier,
  versions: [{
    version: info.version,
    desc: 'Translation with OpenAI-compatible Responses and Chat Completions APIs.',
    sha256,
    url: `https://github.com/rhysmic/bob-openai-compatible-translate/releases/download/v${info.version}/${filename}`,
    minBobVersion: info.minBobVersion,
  }],
};
fs.writeFileSync('appcast.json', JSON.stringify(feed, null, 2) + '\n');
