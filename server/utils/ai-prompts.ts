export const SUMMARY_PROMPT = `
你是一个专业的新闻分析师。请根据提供的新闻标题和内容，生成一段简洁、客观、有洞察力的摘要。

要求：
1. 摘要长度：约 {summaryLength} 个句子。
2. 包含核心事实：时间、人物、地点、事件及其影响。
3. 语气：专业且中立。
4. 同时分析新闻的情感倾向（positive, neutral, negative）。
5. 评估新闻的重要性（1-10分，10分为最重要）。
6. 如果新闻非常重要或具有突破性，请标记为 highlight。
7. 判断新闻的分类，必须从以下列表中选择一个：politics (时政), economy (财经), tech (科技), entertainment (娱乐), sports (体育), society (社会), military (军事), culture (文化), health (健康), life (生活), education (教育), other (其他)。
8. 使用简体中文

请以 JSON 格式返回结果，包含以下字段：
- summary: 摘要文本
- sentiment: 情感倾向 (positive, neutral, negative)
- importance: 重要性评分 (1-10)
- highlight: 是否标记为高亮 (boolean)
- category: 新闻分类 (politics, economy, tech, entertainment, sports, society, military, culture, health, life, education, other)

新闻标题：{title}
新闻内容：{content}
`;

export const TRANSLATION_PROMPT = `
你是一个专业的翻译专家。请将以下文本翻译成中文。

要求：
1. 翻译准确、流畅，符合中文表达习惯。
2. 保留原文的语气和风格。
3. 如果原文包含专业术语，请准确翻译。
4. 仅返回翻译后的文本，不要包含任何解释或其他内容。

原文内容：
{content}
`;

export const QUERY_TRANSLATION_PROMPT = `
You are a professional translator. Please translate the following search query into English.

Requirements:
1. Translate accurately and concisely.
2. If the query contains technical terms, translate them accurately.
3. Only return the translated text, do not include any explanation or other content.

Query:
{content}
`;

export const STRUCTURED_TRANSLATION_PROMPT = `
你是一个专业的翻译专家。我将提供一组文本段落，请将它们逐一翻译成中文。

输入格式是一个 JSON 数组：
[
  { "id": 0, "text": "段落1内容..." },
  { "id": 1, "text": "段落2内容..." }
]

请返回一个 JSON 对象，包含 "translations" 字段，该字段是一个数组，格式如下：
{
  "translations": [
    { "id": 0, "translation": "段落1的中文翻译" },
    { "id": 1, "translation": "段落2的中文翻译" }
  ]
}

要求：
1. 必须返回合法的 JSON 格式。
2. 必须包含所有输入的 ID，且 ID 对应正确。
3. 翻译准确、流畅。
4. 不要包含任何 markdown 代码块标记（如 \`\`\`json），直接返回 JSON 字符串。
`;
