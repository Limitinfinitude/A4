import OpenAI from 'openai';

// 定义12种内置情绪标签
export const EMOTION_TAGS = {
  // 正向情绪（6）
  joy: { en: 'joy', zh: '快乐、开心' },
  satisfaction: { en: 'satisfaction', zh: '满足、认可' },
  calm: { en: 'calm', zh: '平静、放松' },
  hope: { en: 'hope', zh: '希望、期待' },
  // 负向情绪（6）
  sadness: { en: 'sadness', zh: '伤心、低落' },
  anger: { en: 'anger', zh: '愤怒、生气' },
  anxiety: { en: 'anxiety', zh: '焦虑、紧张' },
  fear: { en: 'fear', zh: '恐惧、不安' },
  frustration: { en: 'frustration', zh: '挫败、无力' },
  tired: { en: 'tired', zh: '疲惫、累' },
  // 中性/特殊（2）
  surprise: { en: 'surprise', zh: '惊讶' },
  neutral: { en: 'neutral', zh: '中性、平静无波' },
} as const;

export type EmotionTag = typeof EMOTION_TAGS[keyof typeof EMOTION_TAGS]['en'];
export type Role = 'mother' | 'teacher' | 'friend';

// 定义返回类型
export interface MoodAnalysisResult {
  keyWords: string[];
  emotionTag: EmotionTag; // AI 分析出的情绪标签
  feedback: string; // 选定角色的反馈内容
  slogan: string;
}

// 获取 OpenAI 客户端（延迟初始化，避免模块加载时错误）
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 环境变量未设置');
  }
  return new OpenAI({
    apiKey,
  });
}

/**
 * 分析情绪日记内容
 * @param content 日记内容
 * @param role 选择的角色（mother: 慈母, teacher: 严师, friend: 老友）
 * @param stream 是否使用流式输出（可选）
 * @returns 情绪分析结果
 */
export async function analyzeMood(
  content: string,
  role: Role,
  stream?: boolean
): Promise<MoodAnalysisResult> {
  // 参数验证
  if (!content || !role) {
    throw new Error('日记内容和角色选择不能为空');
  }

  if (!['mother', 'teacher', 'friend'].includes(role)) {
    throw new Error('角色选择无效，必须是 mother、teacher 或 friend');
  }


  try {
    const roleNames = {
      mother: '慈母',
      teacher: '严师',
      friend: '老友',
    };

    const roleDescriptions = {
      mother: '温柔、包容、理解，给予情感支持和温暖关怀',
      teacher: '理性、客观、引导，提供成长建议和人生智慧',
      friend: '真诚、平等、共情，分享相似经历和陪伴支持',
    };

    const emotionTagList = Object.values(EMOTION_TAGS)
      .map(tag => `${tag.en} - ${tag.zh}`)
      .join('、');

    const prompt = `你是一位专业的情绪分析师。请分析以下日记内容，并按照要求输出JSON格式的结果。

日记内容：${content}

请完成以下任务：
1. 提取1-2个潜意识情绪关键词（如「隐藏的疲惫」「深层的焦虑」等），这些关键词应该反映日记中隐含的、未直接表达的情绪。

2. 分析日记内容，从以下12种情绪标签中选择最符合的一个（必须选择且只能选择一个）：
   正向情绪：joy（快乐、开心）、satisfaction（满足、认可）、calm（平静、放松）、hope（希望、期待）
   负向情绪：sadness（伤心、低落）、anger（愤怒、生气）、anxiety（焦虑、紧张）、fear（恐惧、不安）、frustration（挫败、无力）、tired（疲惫、累）
   中性/特殊：surprise（惊讶）、neutral（中性、平静无波）

3. 以${roleNames[role]}的视角生成反馈（30-50字）。${roleDescriptions[role]}。请基于日记内容提供个性化、有针对性的回应，不要使用外部数据或通用模板。

4. 生成1句治愈系金句，能够给予温暖和力量。

请严格按照以下JSON格式输出，不要包含任何其他文字或markdown格式：
{
  "keyWords": ["关键词1", "关键词2"],
  "emotionTag": "选择的情绪标签（如：joy、anxiety等）",
  "feedback": "${roleNames[role]}视角的反馈内容，30-50字",
  "slogan": "治愈系金句"
}`;

    if (stream) {
      // 流式输出模式
      const openai = getOpenAIClient();
      const streamResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的情绪分析师，擅长从日记中提取深层情绪并提供多视角反馈。请始终以JSON格式输出结果。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        stream: true,
        response_format: { type: 'json_object' },
      });

      // 收集流式响应
      let fullResponse = '';
      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
      }

      // 解析JSON响应
      return parseResponse(fullResponse);
    } else {
      // 非流式输出模式
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的情绪分析师，擅长从日记中提取深层情绪并提供多视角反馈。请始终以JSON格式输出结果。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('API 返回内容为空');
      }

      return parseResponse(content);
    }
  } catch (error) {
    // 错误处理
    if (error instanceof OpenAI.APIError) {
      // OpenAI API 错误
      if (error.status === 401) {
        throw new Error('API 密钥无效，请检查 OPENAI_API_KEY 环境变量');
      } else if (error.status === 429) {
        throw new Error('API 调用频率过高，请稍后再试');
      } else if (error.status === 500) {
        throw new Error('OpenAI 服务暂时不可用，请稍后再试');
      } else {
        throw new Error(`API 调用失败：${error.message}`);
      }
    } else if (error instanceof Error) {
      // 其他错误
      throw new Error(`分析失败：${error.message}`);
    } else {
      // 未知错误
      throw new Error('分析失败：未知错误，请稍后再试');
    }
  }
}

/**
 * 解析API响应为结构化数据
 */
function parseResponse(content: string): MoodAnalysisResult {
  try {
    // 尝试提取JSON（去除可能的markdown代码块标记）
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonContent);

    // 验证必需字段
    if (!parsed.keyWords || !Array.isArray(parsed.keyWords)) {
      throw new Error('响应格式错误：缺少 keyWords 字段或格式不正确');
    }
    if (!parsed.emotionTag || typeof parsed.emotionTag !== 'string') {
      throw new Error('响应格式错误：缺少 emotionTag 字段或格式不正确');
    }
    // 验证情绪标签是否在允许的列表中
    const validTags = Object.values(EMOTION_TAGS).map(t => t.en);
    if (!validTags.includes(parsed.emotionTag)) {
      throw new Error(`响应格式错误：emotionTag 值无效，必须是以下之一：${validTags.join('、')}`);
    }
    if (typeof parsed.feedback !== 'string') {
      throw new Error('响应格式错误：缺少 feedback 字段或格式不正确');
    }
    if (typeof parsed.slogan !== 'string') {
      throw new Error('响应格式错误：缺少 slogan 字段或格式不正确');
    }

    return {
      keyWords: parsed.keyWords,
      emotionTag: parsed.emotionTag as EmotionTag,
      feedback: parsed.feedback,
      slogan: parsed.slogan,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('API 返回的JSON格式无效，无法解析');
    }
    throw error;
  }
}

/**
 * 流式输出版本的 analyzeMood（返回 AsyncGenerator）
 * @param content 日记内容
 * @param role 选择的角色（mother: 慈母, teacher: 严师, friend: 老友）
 * @returns 异步生成器，每次yield一个字符串片段，最后返回解析后的结果
 */
export async function* analyzeMoodStream(
  content: string,
  role: Role
): AsyncGenerator<string, MoodAnalysisResult> {
  // 参数验证
  if (!content || !role) {
    throw new Error('日记内容和角色选择不能为空');
  }

  if (!['mother', 'teacher', 'friend'].includes(role)) {
    throw new Error('角色选择无效，必须是 mother、teacher 或 friend');
  }


  const roleNames = {
    mother: '慈母',
    teacher: '严师',
    friend: '老友',
  };

  const roleDescriptions = {
    mother: '温柔、包容、理解，给予情感支持和温暖关怀',
    teacher: '理性、客观、引导，提供成长建议和人生智慧',
    friend: '真诚、平等、共情，分享相似经历和陪伴支持',
  };

  const emotionTagList = Object.values(EMOTION_TAGS)
    .map(tag => `${tag.en} - ${tag.zh}`)
    .join('、');

  const prompt = `你是一位专业的情绪分析师。请分析以下日记内容，并按照要求输出JSON格式的结果。

日记内容：${content}

请完成以下任务：
1. 提取1-2个潜意识情绪关键词（如「隐藏的疲惫」「深层的焦虑」等），这些关键词应该反映日记中隐含的、未直接表达的情绪。

2. 分析日记内容，从以下12种情绪标签中选择最符合的一个（必须选择且只能选择一个）：
   正向情绪：joy（快乐、开心）、satisfaction（满足、认可）、calm（平静、放松）、hope（希望、期待）
   负向情绪：sadness（伤心、低落）、anger（愤怒、生气）、anxiety（焦虑、紧张）、fear（恐惧、不安）、frustration（挫败、无力）、tired（疲惫、累）
   中性/特殊：surprise（惊讶）、neutral（中性、平静无波）

3. 以${roleNames[role]}的视角生成反馈（30-50字）。${roleDescriptions[role]}。请基于日记内容提供个性化、有针对性的回应，不要使用外部数据或通用模板。

4. 生成1句治愈系金句，能够给予温暖和力量。

请严格按照以下JSON格式输出，不要包含任何其他文字或markdown格式：
{
  "keyWords": ["关键词1", "关键词2"],
  "emotionTag": "选择的情绪标签（如：joy、anxiety等）",
  "feedback": "${roleNames[role]}视角的反馈内容，30-50字",
  "slogan": "治愈系金句"
}`;

  try {
    const openai = getOpenAIClient();
    const streamResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的情绪分析师，擅长从日记中提取深层情绪并提供多视角反馈。请始终以JSON格式输出结果。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      stream: true,
      response_format: { type: 'json_object' },
    });

    let fullResponse = '';
    for await (const chunk of streamResponse) {
      const chunkContent = chunk.choices[0]?.delta?.content || '';
      if (chunkContent) {
        fullResponse += chunkContent;
        yield chunkContent;
      }
    }

    // 返回最终解析的结果（调用者需要通过 generator.next() 获取）
    return parseResponse(fullResponse);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('API 密钥无效，请检查 OPENAI_API_KEY 环境变量');
      } else if (error.status === 429) {
        throw new Error('API 调用频率过高，请稍后再试');
      } else if (error.status === 500) {
        throw new Error('OpenAI 服务暂时不可用，请稍后再试');
      } else {
        throw new Error(`API 调用失败：${error.message}`);
      }
    } else if (error instanceof Error) {
      throw new Error(`分析失败：${error.message}`);
    } else {
      throw new Error('分析失败：未知错误，请稍后再试');
    }
  }
}

