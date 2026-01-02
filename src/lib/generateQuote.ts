import OpenAI from 'openai';
import { getModelName } from './config';
import { EMOTION_TAGS, type EmotionTag } from './analyzeMood';

// 获取 OpenAI 客户端（延迟初始化）
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
 * 根据心情图标生成一记一句并分析情绪
 * @param moodIcon 心情图标（emoji）
 * @returns 包含一记一句、情绪标签和标准情绪标签的对象
 */
export async function generateQuote(moodIcon: string): Promise<{
  quote: string;
  emotionLabels: string[];
  emotionTag: EmotionTag;
}> {
  if (!moodIcon) {
    throw new Error('心情图标不能为空');
  }

  try {
    const openai = getOpenAIClient();
    console.log('生成一记一句 - 输入图标：', moodIcon);

    const prompt = `用户选择了心情图标：${moodIcon}。

请分析这个表情所代表的情绪，并完成以下任务：

### 1. 生成情绪标签（1-3个）
- 根据这个表情，用简洁的词语描述情绪状态
- 不要局限于固定词汇，可以自由表达，但要准确
- 每个标签 1-7 个字，简洁有力
- 例如：「疲惫」「焦虑」「期待」「失落」「释然」「矛盾」「压抑」「无力」「兴奋」「平静」「有点累」「非常开心」

### 2. 内部标准情绪标签（仅用于系统分类，用户不可见）
- 从以下12个标准标签中选择1个最接近的：
  - 正向：joy（快乐）、satisfaction（满足）、calm（平静）、hope（希望）
  - 负向：sadness（伤心）、anger（愤怒）、anxiety（焦虑）、fear（恐惧）、frustration（挫败）、tired（疲惫）
  - 中性：surprise（惊讶）、neutral（中性）
- 这个标签仅用于内部统计和分析，不直接展示给用户

### 3. 生成一记一句（1句）
- 可以是经典名言、诗句、或者原创的温暖话语
- 要与当前情绪状态相关，能够给予力量或安慰
- 语言简洁有力，不超过30字
- 如果是引用名言，请注明出处（如"—— 鲁迅"），如果是原创，则不需要出处

## 输出格式（严格JSON，无其他文字）
{
  "emotionLabels": ["情绪标签1", "情绪标签2"],
  "emotionTag": "内部标准标签（从12个中选1个，如：joy、anxiety）",
  "quote": "一记一句"
}`;

    console.log('生成一记一句 - 使用模型：', getModelName());
    console.log('生成一记一句 - Prompt：', prompt);

    const requestParams: any = {
      model: getModelName(),
      messages: [
        {
          role: 'system',
          content: '你是一位专业的情绪分析师，擅长分析表情所代表的情绪，并生成温暖的话语。请根据用户选择的表情，分析情绪并生成一记一句。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    };

    const response = await openai.chat.completions.create(requestParams);

    console.log('生成一记一句 - API 响应：', JSON.stringify(response, null, 2));

    const content = response.choices[0]?.message?.content?.trim();
    console.log('生成一记一句 - 提取的内容：', content);
    
    if (!content) {
      console.error('生成一记一句 - AI 返回内容为空，完整响应：', JSON.stringify(response, null, 2));
      throw new Error('AI 返回内容为空');
    }

    const parsed = JSON.parse(content);

    // 验证必需字段
    if (!parsed.emotionLabels || !Array.isArray(parsed.emotionLabels)) {
      throw new Error('响应格式错误：缺少 emotionLabels 字段或格式不正确');
    }
    if (!parsed.emotionTag || typeof parsed.emotionTag !== 'string') {
      throw new Error('响应格式错误：缺少 emotionTag 字段或格式不正确');
    }
    // 验证情绪标签是否在允许的列表中
    const validTags = Object.values(EMOTION_TAGS).map(t => t.en);
    if (!validTags.includes(parsed.emotionTag)) {
      throw new Error(`响应格式错误：emotionTag 值无效，必须是以下之一：${validTags.join('、')}`);
    }
    if (typeof parsed.quote !== 'string') {
      throw new Error('响应格式错误：缺少 quote 字段或格式不正确');
    }

    return {
      quote: parsed.quote,
      emotionLabels: parsed.emotionLabels,
      emotionTag: parsed.emotionTag as EmotionTag,
    };
  } catch (error) {
    console.error('生成一记一句时出错：', error);
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('API 密钥无效，请检查 OPENAI_API_KEY 环境变量');
      } else if (error.status === 429) {
        throw new Error('API 调用频率过高，请稍后再试');
      } else if (error.status === 500) {
        throw new Error('OpenAI 服务暂时不可用，请稍后再试');
      } else {
        throw new Error(`API 调用失败：${error.status} ${error.message}`);
      }
    } else if (error instanceof Error) {
      throw error; // 直接抛出原始错误，避免重复包装
    } else {
      throw new Error('生成一记一句失败：未知错误，请稍后再试');
    }
  }
}

