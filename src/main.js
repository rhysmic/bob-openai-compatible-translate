/**
 * OpenAI Compatible Translation Plugin for Bob
 * Translation through OpenAI-compatible APIs
 *
 * Bob language codes https://ripperhe.gitee.io/bob/#/plugin/addtion/language
 */

// Language mappings
var items = [
    ['auto', 'auto'],
    ['zh-Hans', 'Chinese Simplified'],
    ['zh-Hant', 'Chinese Traditional'],
    ['en', 'English'],
    ['ja', 'Japanese'],
    ['ko', 'Korean'],
    ['fr', 'French'],
    ['de', 'German'],
    ['es', 'Spanish'],
    ['pt', 'Portuguese'],
    ['ru', 'Russian'],
    ['it', 'Italian'],
    ['ar', 'Arabic'],
    ['th', 'Thai'],
    ['vi', 'Vietnamese'],
    ['nl', 'Dutch'],
    ['pl', 'Polish'],
    ['tr', 'Turkish'],
    ['he', 'Hebrew'],
    ['hi', 'Hindi'],
    ['id', 'Indonesian'],
    ['ms', 'Malay'],
    ['sv', 'Swedish'],
    ['da', 'Danish'],
    ['no', 'Norwegian'],
    ['fi', 'Finnish'],
    ['cs', 'Czech'],
    ['hu', 'Hungarian'],
    ['el', 'Greek'],
    ['ro', 'Romanian'],
    ['bg', 'Bulgarian'],
    ['uk', 'Ukrainian'],
    ['sk', 'Slovak'],
    ['sl', 'Slovenian'],
    ['hr', 'Croatian'],
    ['lt', 'Lithuanian'],
    ['lv', 'Latvian'],
    ['et', 'Estonian'],
    ['fa', 'Persian']
];

var langMap = new Map(items);
var langMapReverse = new Map(items.map(([standardLang, lang]) => [lang, standardLang]));
var supportedReasoningEfforts = ['max', 'high', 'medium', 'low'];

function supportLanguages() {
    return items.map(([standardLang, lang]) => standardLang);
}

function translate(query, completion) {
    const { text, from, to } = query;

    // Read plugin options
    const apiKey = $option.apiKey;
    const baseUrl = $option.baseUrl || 'https://api.openai.com/v1';
    const model = $option.model || 'gpt-4.1';
    const apiType = $option.apiType === 'chat_completions' ? 'chat_completions' : 'responses';
    const reasoningEffort = normalizeReasoningEffort($option.reasoningEffort);

    // Validate required options
    if (!apiKey) {
        completion({
            error: {
                type: 'param',
                message: 'API Key is required',
                addition: 'Enter your API key in the plugin settings'
            }
        });
        return;
    }

    // Map language codes
    const fromLang = langMap.get(from) || from;
    const toLang = langMap.get(to) || to;

    // Build translation prompts
    let systemPrompt = "You are a professional translator. Rules: 1) Output only the translation result without any explanation or thinking process 2) Translate directly while maintaining the original format 3) For auto-detect, prioritize English-Chinese Simplified translation pairs 4) Preserve original formatting, line breaks, and spacing";

    let userPrompt = buildTranslatePrompt(text, fromLang, toLang);

    // Normalize the base URL
    let apiUrl = baseUrl.trim();
    if (!apiUrl.endsWith('/')) {
        apiUrl += '/';
    }
    apiUrl += apiType === 'chat_completions' ? 'chat/completions' : 'responses';

    const reasoningEffortFallbacks = buildReasoningEffortFallbacks(reasoningEffort);

    function requestWithFallback(attemptIndex) {
        const selectedEffort = reasoningEffortFallbacks[attemptIndex];
        const requestData = buildRequestData(
            apiType,
            model,
            systemPrompt,
            userPrompt,
            selectedEffort
        );

        // Call the API; retry only when reasoning effort is unsupported
        $http.request({
            method: 'POST',
            url: apiUrl,
            header: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: requestData,
            handler: function (resp) {
                const hasNextFallback = attemptIndex < reasoningEffortFallbacks.length - 1;

                if (
                    hasNextFallback &&
                    selectedEffort &&
                    isReasoningEffortUnsupported(resp)
                ) {
                    requestWithFallback(attemptIndex + 1);
                    return;
                }

                handleApiResponse(resp, text, from, to, completion, apiType);
            }
        });
    }

    requestWithFallback(0);
}

function normalizeReasoningEffort(value) {
    const effort = String(value || '').toLowerCase();
    return supportedReasoningEfforts.includes(effort) ? effort : 'low';
}

function buildReasoningEffortFallbacks(selectedEffort) {
    const startIndex = supportedReasoningEfforts.indexOf(selectedEffort);
    const fallbacks = supportedReasoningEfforts.slice(startIndex >= 0 ? startIndex : 3);

    // Finally omit reasoning parameters for providers that do not recognize them.
    fallbacks.push(null);
    return fallbacks;
}

function buildRequestData(apiType, model, systemPrompt, userPrompt, reasoningEffort) {
    if (apiType === 'chat_completions') {
        const requestData = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            stream: false
        };

        if (reasoningEffort) {
            requestData.reasoning_effort = reasoningEffort;
        }

        return requestData;
    }

    const requestData = {
        model: model,
        instructions: systemPrompt,
        input: userPrompt,
        stream: false
    };

    if (reasoningEffort) {
        requestData.reasoning = {
            effort: reasoningEffort
        };
    }

    return requestData;
}

function buildTranslatePrompt(text, fromLang, toLang) {
    // Handle automatic language detection
    if (toLang === 'auto') {
        if (fromLang === 'auto') {
            // Prefer English and Simplified Chinese for automatic translation
            return `Intelligently translate the following text. Priority rules:
1. If the text is in English, translate to Chinese Simplified
2. If the text is in Chinese (Simplified or Traditional), translate to English
3. For other languages, translate to the most appropriate target language
Text to translate:\n${text}`;
        } else {
            return `Translate from ${fromLang} to the most appropriate language:\n${text}`;
        }
    }

    // Build a translation request
    if (fromLang === 'auto') {
        return `Translate to ${toLang}:\n${text}`;
    } else {
        return `Translate from ${fromLang} to ${toLang}:\n${text}`;
    }
}

function isReasoningEffortUnsupported(resp) {
    const status = getResponseStatus(resp);

    if (status !== null && status !== 400 && status !== 422) {
        return false;
    }

    const errorText = getResponseErrorText(resp).toLowerCase();
    const mentionsReasoningEffort =
        errorText.includes('reasoning_effort') ||
        errorText.includes('reasoning effort') ||
        errorText.includes('reasoning') ||
        errorText.includes('effort');
    const indicatesUnsupported =
        errorText.includes('unsupported') ||
        errorText.includes('not support') ||
        errorText.includes('does not support') ||
        errorText.includes('invalid') ||
        errorText.includes('unknown') ||
        errorText.includes('unrecognized') ||
        errorText.includes('not allowed');

    return mentionsReasoningEffort && indicatesUnsupported;
}

function getResponseStatus(resp) {
    const candidates = [
        resp && resp.statusCode,
        resp && resp.status,
        resp && resp.error && resp.error.statusCode,
        resp && resp.httpResponse && resp.httpResponse.statusCode,
        resp && resp.response && resp.response.statusCode,
        resp && resp.response && resp.response.status
    ];

    for (let i = 0; i < candidates.length; i += 1) {
        if (candidates[i] !== undefined && candidates[i] !== null) {
            const status = parseInt(candidates[i], 10);
            return Number.isNaN(status) ? null : status;
        }
    }

    return null;
}

function getResponseErrorText(resp) {
    const data = resp && resp.data;
    const apiError = data && data.error;
    const error = resp && resp.error;
    const values = [];

    if (typeof apiError === 'string') {
        values.push(apiError);
    } else if (apiError) {
        values.push(apiError.code, apiError.type, apiError.message, apiError.param);
    }

    if (typeof error === 'string') {
        values.push(error);
    } else if (error) {
        values.push(error.code, error.type, error.message, error.localizedDescription);
    }

    return values.filter((value) => value).join(' ');
}

function handleApiResponse(resp, originalText, from, to, completion, apiType) {
    // Handle transport errors
    if (resp.error) {
        completion({
            error: {
                type: 'network',
                message: 'Network request failed',
                addition:
                    resp.error.localizedDescription ||
                    resp.error.message ||
                    'Check your network connection and API base URL'
            }
        });
        return;
    }

    const data = resp.data || {};

    // Handle API errors
    if (data.error) {
        const apiError = typeof data.error === 'string' ? { message: data.error } : data.error;
        const errorCode = String(apiError.code || '').toLowerCase();
        const errorType = String(apiError.type || '').toLowerCase();
        const errorMessageFromApi = apiError.message || 'Unknown error';
        const errorMessageLower = String(errorMessageFromApi).toLowerCase();
        let errorMessage = 'API error';
        let errorAddition = errorMessageFromApi;

        // Map common API errors
        if (errorCode === 'invalid_api_key' || errorType === 'authentication_error') {
            errorMessage = 'Invalid API key';
            errorAddition = 'Check your API key';
        } else if (
            errorCode === 'insufficient_quota' ||
            errorType === 'insufficient_quota'
        ) {
            errorMessage = 'API quota exceeded';
            errorAddition = 'Check your account quota or balance';
        } else if (
            errorCode === 'model_not_found' ||
            errorMessageLower.includes('model')
        ) {
            errorMessage = 'Model not found';
            errorAddition = `Model "${$option.model || 'gpt-4.1'}" was not found or is inaccessible; check the model name`;
        } else if (errorCode === 'rate_limit_exceeded') {
            errorMessage = 'Rate limit exceeded';
            errorAddition = 'Try again later';
        }

        completion({
            error: {
                type: 'api',
                message: errorMessage,
                addition: errorAddition
            }
        });
        return;
    }

    // Extract the translated text
    const translatedText = extractTranslatedText(data, apiType);

    if (typeof translatedText === 'string' && translatedText.trim()) {
        completion({
            result: {
                from: from,
                to: to,
                toParagraphs: [translatedText.trim()],
                fromParagraphs: [originalText]
            }
        });
    } else if (translatedText !== null) {
        completion({
            error: {
                type: 'api',
                message: 'Empty translation',
                addition: 'The API returned an empty translation'
            }
        });
    } else {
        completion({
            error: {
                type: 'api',
                message: 'Invalid response format',
                addition: 'The API returned an unexpected response format'
            }
        });
    }
}

function extractTranslatedText(data, apiType) {
    if (apiType === 'chat_completions') {
        return extractChatCompletionText(data);
    }

    return extractResponsesText(data);
}

function extractChatCompletionText(data) {
    if (!Array.isArray(data.choices) || data.choices.length === 0) {
        return null;
    }

    const message = data.choices[0] && data.choices[0].message;
    if (!message) {
        return null;
    }

    if (typeof message.content === 'string') {
        return message.content;
    }

    if (Array.isArray(message.content)) {
        return message.content
            .map((part) => (typeof part === 'string' ? part : part && part.text))
            .filter((part) => typeof part === 'string')
            .join('');
    }

    return null;
}

function extractResponsesText(data) {
    if (typeof data.output_text === 'string') {
        return data.output_text;
    }

    if (!Array.isArray(data.output)) {
        return null;
    }

    const textParts = [];

    data.output.forEach((outputItem) => {
        if (!outputItem) {
            return;
        }

        if (outputItem.type === 'output_text' && typeof outputItem.text === 'string') {
            textParts.push(outputItem.text);
        }

        if (!Array.isArray(outputItem.content)) {
            return;
        }

        outputItem.content.forEach((contentPart) => {
            if (
                contentPart &&
                typeof contentPart.text === 'string' &&
                (!contentPart.type || contentPart.type === 'output_text')
            ) {
                textParts.push(contentPart.text);
            }
        });
    });

    return textParts.length > 0 ? textParts.join('') : null;
}
