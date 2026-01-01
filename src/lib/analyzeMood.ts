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

// 固定角色定义 - 每个角色关注不同的认知维度
export const FIXED_ROLES: Record<FixedRole, { 
  name: string; 
  emoji: string;
  description: string;  // 简短描述（用于 UI）
  focusDimension: string;  // 关注的认知维度
  coreQuestion: string;  // 核心提问
  responseStyle: string;  // 回应风格
}> = {
  warm_mother: {
    name: '暖心慈母',
    emoji: '🤱',
    description: '关注你的情感需求，给予无条件的接纳',
    focusDimension: '情感需求',
    coreQuestion: '你内心真正需要的是什么？在这件事里，你渴望被怎样对待？',
    responseStyle: '温柔共情，先看见情绪本身，再轻轻触碰背后的需求。不评判对错，只关心"你还好吗"。',
  },
  rational_teacher: {
    name: '理性严师',
    emoji: '👨‍🏫',
    description: '关注问题结构，帮你理清思路',
    focusDimension: '问题结构',
    coreQuestion: '这个情绪的来源是什么？可以拆解成哪几个部分？哪个是你能控制的？',
    responseStyle: '客观冷静，帮用户看清情绪背后的逻辑链条。不煽情，用"事实-原因-可控点"的框架回应。',
  },
  funny_friend: {
    name: '损友搭子',
    emoji: '😄',
    description: '关注情绪释放，帮你卸下包袱',
    focusDimension: '情绪释放',
    coreQuestion: '这事儿真有那么严重吗？换个角度看，是不是也挺好笑的？',
    responseStyle: '口语化、接地气，用轻松的视角消解沉重感。可以适度调侃，但不是嘲笑。目标是让用户笑出来或者至少"破防"。',
  },
  study_partner: {
    name: '学习伙伴',
    emoji: '📚',
    description: '关注学习体验，理解你的困境',
    focusDimension: '学习体验',
    coreQuestion: '这个学习/考试/任务让你感到困难的点是什么？是方法问题还是心态问题？',
    responseStyle: '像一个懂学习痛点的同路人，既理解焦虑，又能给出具体的视角。不喊空洞口号，关注"怎么学得下去"。',
  },
  work_mentor: {
    name: '职场前辈',
    emoji: '💼',
    description: '关注行动方案，帮你理顺优先级',
    focusDimension: '行动方案',
    coreQuestion: '接下来最重要的一步是什么？时间和精力应该怎么分配？',
    responseStyle: '务实派，把情绪问题转化为"下一步做什么"。关注资源分配、优先级排序，帮用户从情绪漩涡里拔出来。',
  },
  listener: {
    name: '树洞倾听者',
    emoji: '🌳',
    description: '关注被看见的需求，不评判只倾听',
    focusDimension: '被看见',
    coreQuestion: '（不提问，只复述和确认）你是说...？听起来你感到...？',
    responseStyle: '纯粹的倾听和复述。不分析、不建议、不评判。用"我听到了"、"你的感受是..."让用户感到被接住。',
  },
  growth_coach: {
    name: '成长教练',
    emoji: '🌟',
    description: '关注长期视角，从经历中提炼成长',
    focusDimension: '长期视角',
    coreQuestion: '五年后回看这件事，它教会了你什么？这个经历如何让你变得更完整？',
    responseStyle: '积极但不鸡汤，聚焦"这件事对你的意义"。帮用户从当下的情绪中拉出来，看到更长的时间线。',
  },
  zen_master: {
    name: '禅意居士',
    emoji: '🧘',
    description: '关注执念松绑，帮你放下内耗',
    focusDimension: '执念松绑',
    coreQuestion: '这件事真的有你以为的那么重要吗？如果放下这个念头，会发生什么？',
    responseStyle: '温和、佛系，帮用户看见自己的"执念"。不是让用户躺平，而是帮他们从"非做不可"的紧绷中松一口气。',
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
function getRoleInfo(role: Role, customRoles?: CustomRole[]): { 
  name: string; 
  focusDimension: string;
  coreQuestion: string;
  responseStyle: string;
  isCustom: boolean;
} {
  // 检查是否是固定角色
  if (role in FIXED_ROLES) {
    const fixedRole = role as FixedRole;
    const roleData = FIXED_ROLES[fixedRole];
    return {
      name: roleData.name,
      focusDimension: roleData.focusDimension,
      coreQuestion: roleData.coreQuestion,
      responseStyle: roleData.responseStyle,
      isCustom: false,
    };
  }
  
  // 检查是否是自定义角色（自定义角色使用通用维度）
  if (customRoles) {
    const customRole = customRoles.find(r => r.id === role);
    if (customRole) {
      return {
        name: customRole.name,
        focusDimension: '用户自定义',
        coreQuestion: '根据角色设定回应用户',
        responseStyle: customRole.description,
        isCustom: true,
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

    // 构建角色 prompt 部分
    const rolePromptSection = roleInfo.isCustom
      ? `## 角色设定（自定义角色）
- 角色名称：${roleInfo.name}
- 回应风格：${roleInfo.responseStyle}
- 请根据以上设定生成反馈`
      : `## 角色设定（认知维度差异化）
- 角色名称：${roleInfo.name}
- 关注维度：${roleInfo.focusDimension}
- 核心视角：${roleInfo.coreQuestion}
- 回应风格：${roleInfo.responseStyle}

【重要】不同角色的本质区别不是语气，而是**关注的维度**。
你要从「${roleInfo.focusDimension}」这个维度去理解用户的情绪，
用「${roleInfo.coreQuestion}」这个视角去回应。`;

    // 规整的 prompt
    const prompt = `你是一位专业的情绪分析师。请分析以下用户输入的情绪内容，并按照要求输出JSON格式的结果。

## 用户输入
${content}

## 任务

### 1. 提取潜意识情绪关键词（1-2个）
- 反映用户输入中隐含的、未直接表达的情绪
- 例如：「隐藏的疲惫」「深层的焦虑」「被压抑的愤怒」
- 如果用户只选择了心情图标，请根据图标推测可能的情绪关键词

### 2. 分析情绪标签（必须选择1个）
- 正向：joy（快乐）、satisfaction（满足）、calm（平静）、hope（希望）
- 负向：sadness（伤心）、anger（愤怒）、anxiety（焦虑）、fear（恐惧）、frustration（挫败）、tired（疲惫）
- 中性：surprise（惊讶）、neutral（中性）

${rolePromptSection}

### 3. 生成角色反馈（60-100字）
- 从「${roleInfo.focusDimension}」维度回应用户
- 不是泛泛而谈，而是针对这个具体输入
- 回应要体现这个角色独特的"看问题的角度"
- 可以分2-3个层次展开，让用户感到被理解和陪伴

### 4. 生成一记一句（1句）
- 与用户当前情绪状态相关
- 简短有力，给予温暖或力量

## 输出格式（严格JSON，无其他文字）
{
  "keyWords": ["关键词1", "关键词2"],
  "emotionTag": "情绪标签（如：joy、anxiety）",
  "feedback": "${roleInfo.name}从「${roleInfo.focusDimension}」维度的回应，60-100字",
  "slogan": "一记一句"
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

  // 构建角色 prompt 部分
  const rolePromptSection = roleInfo.isCustom
    ? `## 角色设定（自定义角色）
- 角色名称：${roleInfo.name}
- 回应风格：${roleInfo.responseStyle}
- 请根据以上设定生成反馈`
    : `## 角色设定（认知维度差异化）
- 角色名称：${roleInfo.name}
- 关注维度：${roleInfo.focusDimension}
- 核心视角：${roleInfo.coreQuestion}
- 回应风格：${roleInfo.responseStyle}

【重要】不同角色的本质区别不是语气，而是**关注的维度**。
你要从「${roleInfo.focusDimension}」这个维度去理解用户的情绪，
用「${roleInfo.coreQuestion}」这个视角去回应。`;

  // 规整的 prompt（与 analyzeMood 保持一致）
  const prompt = `你是一位专业的情绪分析师。请分析以下用户输入的情绪内容，并按照要求输出JSON格式的结果。

## 用户输入
${content}

## 任务

### 1. 提取潜意识情绪关键词（1-2个）
- 反映用户输入中隐含的、未直接表达的情绪
- 例如：「隐藏的疲惫」「深层的焦虑」「被压抑的愤怒」
- 如果用户只选择了心情图标，请根据图标推测可能的情绪关键词

### 2. 分析情绪标签（必须选择1个）
- 正向：joy（快乐）、satisfaction（满足）、calm（平静）、hope（希望）
- 负向：sadness（伤心）、anger（愤怒）、anxiety（焦虑）、fear（恐惧）、frustration（挫败）、tired（疲惫）
- 中性：surprise（惊讶）、neutral（中性）

${rolePromptSection}

### 3. 生成角色反馈（60-100字）
- 从「${roleInfo.focusDimension}」维度回应用户
- 不是泛泛而谈，而是针对这个具体输入
- 回应要体现这个角色独特的"看问题的角度"
- 可以分2-3个层次展开，让用户感到被理解和陪伴

### 4. 生成一记一句（1句）
- 与用户当前情绪状态相关
- 简短有力，给予温暖或力量

## 输出格式（严格JSON，无其他文字）
{
  "keyWords": ["关键词1", "关键词2"],
  "emotionTag": "情绪标签（如：joy、anxiety）",
  "feedback": "${roleInfo.name}从「${roleInfo.focusDimension}」维度的回应，60-100字",
  "slogan": "一记一句"
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

