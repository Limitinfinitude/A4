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

// 固定角色类型
export type FixedRole = 
  | 'warm_mother'      // 暖心慈母
  | 'rational_teacher' // 理性严师
  | 'funny_friend'     // 损友搭子
  | 'study_partner'    // 学习伙伴
  | 'work_mentor'      // 职场前辈
  | 'listener'         // 树洞倾听者
  | 'growth_coach'     // 成长教练
  | 'zen_master';      // 禅意居士

// 自定义角色
export interface CustomRole {
  id: string;
  name: string;
  description: string;
}

// 角色联合类型
export type Role = FixedRole | string; // string 用于自定义角色 ID

// 定义返回类型
export interface MoodAnalysisResult {
  keyWords: string[];
  emotionTag: EmotionTag; // AI 分析出的情绪标签
  feedback: string; // 选定角色的反馈内容
  slogan: string;
}

// 固定角色定义
export const FIXED_ROLES: Record<FixedRole, { name: string; description: string; emoji: string }> = {
  warm_mother: {
    name: '暖心慈母',
    description: '情感兜底，包容接纳。温柔、共情、鼓励，像家人一样给予安全感，不评判对错',
    emoji: '🤱',
  },
  rational_teacher: {
    name: '理性严师',
    description: '客观分析，精准提效。一针见血、逻辑清晰，指出情绪背后的问题并给可执行建议',
    emoji: '👨‍🏫',
  },
  funny_friend: {
    name: '损友搭子',
    description: '吐槽解压，轻松破防。口语化、接地气、带点小调侃，用玩笑化解负面情绪',
    emoji: '😄',
  },
  study_partner: {
    name: '学习伙伴',
    description: '适配学习场景，并肩同行。懂学习痛点，反馈结合「学习方法 + 心态调整」，不喊空洞口号',
    emoji: '📚',
  },
  work_mentor: {
    name: '职场前辈',
    description: '聚焦工作 / 日程管理。经验型、务实派，从「任务拆解 / 时间分配」角度疏导情绪',
    emoji: '💼',
  },
  listener: {
    name: '树洞倾听者',
    description: '纯倾听，无评判。不输出建议，只温柔回应、复述用户的情绪点，让用户感受到「被听见」',
    emoji: '🌳',
  },
  growth_coach: {
    name: '成长教练',
    description: '聚焦自我成长，激发内驱力。积极正向、聚焦长期，引导用户从情绪中提炼成长点',
    emoji: '🌟',
  },
  zen_master: {
    name: '禅意居士',
    description: '佛系开导，缓解内耗。温和、佛系，强调「顺其自然」，帮用户放下执念',
    emoji: '🧘',
  },
};

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
 * 获取角色信息（固定角色或自定义角色）
 */
function getRoleInfo(role: Role, customRoles?: CustomRole[]): { name: string; description: string } {
  // 检查是否是固定角色
  if (role in FIXED_ROLES) {
    const fixedRole = role as FixedRole;
    return {
      name: FIXED_ROLES[fixedRole].name,
      description: FIXED_ROLES[fixedRole].description,
    };
  }
  
  // 检查是否是自定义角色
  if (customRoles) {
    const customRole = customRoles.find(r => r.id === role);
    if (customRole) {
      return {
        name: customRole.name,
        description: customRole.description,
      };
    }
  }
  
  throw new Error(`角色 "${role}" 不存在`);
}

/**
 * 分析情绪日记内容
 * @param content 日记内容（可以是文字或心情图标）
 * @param role 选择的角色（固定角色ID或自定义角色ID）
 * @param customRoles 自定义角色列表（可选）
 * @param stream 是否使用流式输出（可选）
 * @returns 情绪分析结果
 */
export async function analyzeMood(
  content: string,
  role: Role,
  customRoles?: CustomRole[],
  stream?: boolean
): Promise<MoodAnalysisResult> {
  // 参数验证
  if (!content || !role) {
    throw new Error('日记内容和角色选择不能为空');
  }

  try {
    const roleInfo = getRoleInfo(role, customRoles);
    const emotionTagList = Object.values(EMOTION_TAGS)
      .map(tag => `${tag.en} - ${tag.zh}`)
      .join('、');

    // 规整的 prompt
    const prompt = `你是一位专业的情绪分析师。请分析以下用户输入的情绪内容，并按照要求输出JSON格式的结果。

用户输入：${content}

请完成以下任务：

1. 提取1-2个潜意识情绪关键词
   - 这些关键词应该反映用户输入中隐含的、未直接表达的情绪
   - 例如：「隐藏的疲惫」「深层的焦虑」「被压抑的愤怒」等
   - 如果用户只选择了心情图标，请根据图标推测可能的情绪关键词

2. 分析情绪标签
   - 从以下12种情绪标签中选择最符合的一个（必须选择且只能选择一个）：
   - 正向情绪：joy（快乐、开心）、satisfaction（满足、认可）、calm（平静、放松）、hope（希望、期待）
   - 负向情绪：sadness（伤心、低落）、anger（愤怒、生气）、anxiety（焦虑、紧张）、fear（恐惧、不安）、frustration（挫败、无力）、tired（疲惫、累）
   - 中性/特殊：surprise（惊讶）、neutral（中性、平静无波）

3. 生成角色反馈
   - 角色名称：${roleInfo.name}
   - 角色设定：${roleInfo.description}
   - 请严格按照角色设定生成反馈（30-50字）
   - 反馈要求：
     * 必须符合角色的定位和风格
     * 基于用户输入提供个性化、有针对性的回应
     * 不要使用外部数据或通用模板
     * 不要输出建议（除非角色设定明确要求提供建议）

4. 生成治愈系金句
   - 生成1句能够给予温暖和力量的话语
   - 与用户当前情绪状态相关

请严格按照以下JSON格式输出，不要包含任何其他文字或markdown格式：
{
  "keyWords": ["关键词1", "关键词2"],
  "emotionTag": "选择的情绪标签（如：joy、anxiety等）",
  "feedback": "${roleInfo.name}视角的反馈内容，30-50字",
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
 * @param content 日记内容（可以是文字或心情图标）
 * @param role 选择的角色（固定角色ID或自定义角色ID）
 * @param customRoles 自定义角色列表（可选）
 * @returns 异步生成器，每次yield一个字符串片段，最后返回解析后的结果
 */
export async function* analyzeMoodStream(
  content: string,
  role: Role,
  customRoles?: CustomRole[]
): AsyncGenerator<string, MoodAnalysisResult> {
  // 参数验证
  if (!content || !role) {
    throw new Error('日记内容和角色选择不能为空');
  }

  const roleInfo = getRoleInfo(role, customRoles);
  const emotionTagList = Object.values(EMOTION_TAGS)
    .map(tag => `${tag.en} - ${tag.zh}`)
    .join('、');

  // 规整的 prompt（与 analyzeMood 保持一致）
  const prompt = `你是一位专业的情绪分析师。请分析以下用户输入的情绪内容，并按照要求输出JSON格式的结果。

用户输入：${content}

请完成以下任务：

1. 提取1-2个潜意识情绪关键词
   - 这些关键词应该反映用户输入中隐含的、未直接表达的情绪
   - 例如：「隐藏的疲惫」「深层的焦虑」「被压抑的愤怒」等
   - 如果用户只选择了心情图标，请根据图标推测可能的情绪关键词

2. 分析情绪标签
   - 从以下12种情绪标签中选择最符合的一个（必须选择且只能选择一个）：
   - 正向情绪：joy（快乐、开心）、satisfaction（满足、认可）、calm（平静、放松）、hope（希望、期待）
   - 负向情绪：sadness（伤心、低落）、anger（愤怒、生气）、anxiety（焦虑、紧张）、fear（恐惧、不安）、frustration（挫败、无力）、tired（疲惫、累）
   - 中性/特殊：surprise（惊讶）、neutral（中性、平静无波）

3. 生成角色反馈
   - 角色名称：${roleInfo.name}
   - 角色设定：${roleInfo.description}
   - 请严格按照角色设定生成反馈（30-50字）
   - 反馈要求：
     * 必须符合角色的定位和风格
     * 基于用户输入提供个性化、有针对性的回应
     * 不要使用外部数据或通用模板
     * 不要输出建议（除非角色设定明确要求提供建议）

4. 生成治愈系金句
   - 生成1句能够给予温暖和力量的话语
   - 与用户当前情绪状态相关

请严格按照以下JSON格式输出，不要包含任何其他文字或markdown格式：
{
  "keyWords": ["关键词1", "关键词2"],
  "emotionTag": "选择的情绪标签（如：joy、anxiety等）",
  "feedback": "${roleInfo.name}视角的反馈内容，30-50字",
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

