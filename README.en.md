# Bob OpenAI Compatible Translate

[简体中文](README.md)

A translation plugin for [Bob](https://bobtranslate.com/) on macOS. Supports OpenAI-compatible Responses and Chat Completions APIs with a configurable base URL, model, and reasoning effort.

## Install

Download `bob-openai-compatible-translate.bobplugin` from [Releases](https://github.com/rhysmic/bob-openai-compatible-translate/releases) and open it in Bob (1.8.0 or later). If no release is available yet, build it locally as described below.

This project has a new plugin identifier and installs separately from the old plugin. Configure it again after installation.

## Configure

- **API type**: Responses API by default; select Chat Completions API if your provider requires it
- **API Base URL**: defaults to `https://api.openai.com/v1`; omit `/responses` and `/chat/completions`
- **API Key**: your provider's API key, required
- **Model**: a model your provider supports; defaults to `gpt-4.1`
- **Reasoning effort**: defaults to `low`; unsupported levels are lowered before retrying without the parameter

Select text and translate with Bob. Providers must support the selected request format and Bearer authentication; compatibility is not guaranteed for every service advertised as OpenAI-compatible.

## Privacy

Translation text and your API key are sent to the API service you configure. Use HTTPS and a trusted provider for sensitive content. The plugin contains no telemetry or bundled credentials. API usage may incur charges. Redact keys, private endpoints, and translation text before reporting issues.

## Develop

Requires Node.js 22+, Bash, and zip. No dependency installation is needed.

```sh
npm test
npm run build
```

The output is `bob-openai-compatible-translate.bobplugin`. Tests use mocked requests, not live APIs; installation and live translation still need testing in Bob on macOS.

See [CONTRIBUTING.md](CONTRIBUTING.md) for releases. [MIT License](LICENSE).
