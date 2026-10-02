# Bob OpenAI Compatible Translate

[English](README.md)

适用于 macOS [Bob](https://bobtranslate.com/) 的翻译插件，支持 OpenAI 兼容的 Responses 和 Chat Completions API，可自定义服务地址、模型和思考等级。

## 安装

从 [Releases](https://github.com/rhysmic/bob-openai-compatible-translate/releases) 下载 `bob-openai-compatible-translate.bobplugin`，双击导入 Bob（1.8.0 或更新版本）。如果尚无发布包，可按下方说明自行构建。

本项目使用新的插件标识符，与旧插件独立安装；需要重新填写配置。

## 配置

- **API type**：默认 Responses API；服务不支持时选择 Chat Completions API
- **API Base URL**：默认 `https://api.openai.com/v1`；填写基础地址，不要附加 `/responses` 或 `/chat/completions`
- **API Key**：服务商提供的密钥，必填
- **Model**：服务支持的模型名称，默认 `gpt-4.1`
- **Reasoning effort**：默认 `low`；参数不受支持时会逐级降低，最后移除该参数重试

在 Bob 中选中文字并翻译即可。兼容性取决于服务是否支持所选 API 格式和 Bearer 认证，并非所有标称 OpenAI 兼容的服务都适用。

## 隐私

待翻译文本和 API Key 会发送到你配置的 API 服务。不要向不可信的地址发送敏感文本或密钥；使用 HTTPS。插件不包含遥测或内置密钥。服务商可能收取 API 费用；提交问题时请遮盖密钥、私有地址和待翻译内容。

## 开发

需要 Node.js 22+、Bash 和 zip，无需安装依赖。

```sh
npm test
npm run build
```

构建产物为 `bob-openai-compatible-translate.bobplugin`。测试使用模拟请求，不调用真实 API；仍需在 macOS Bob 中验证安装与实际翻译。

发布步骤见 [CONTRIBUTING.md](CONTRIBUTING.md)。[MIT License](LICENSE)。
