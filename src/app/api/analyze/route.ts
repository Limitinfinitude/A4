import { NextRequest, NextResponse } from 'next/server';
import { analyzeMood, analyzeMoodStream, type MoodAnalysisResult, type Role, type CustomRole } from '@/lib/analyzeMood';
import type { AIConfig } from '@/lib/aiClient';

/**
 * POST /api/analyze
 * 分析情绪日记
 * 
 * 请求体：
 * {
 *   "content": "日记内容或心情图标",
 *   "role": "固定角色ID或自定义角色ID",
 *   "customRoles": [可选] 自定义角色列表
 *   "stream": false // 可选，是否使用流式输出
 *   "aiConfig": [可选] AI 配置（模式、API Key、模型名称等）
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[API /analyze] 收到请求，时间: ${new Date().toISOString()}`);
  
  try {
    const parseStart = Date.now();
    const body = await request.json();
    const parseEnd = Date.now();
    console.log(`[API /analyze] JSON 解析耗时: ${parseEnd - parseStart}ms`);
    
    const { content, role, customRoles, stream, aiConfig } = body;
    console.log(`[API /analyze] 参数:`, {
      contentLength: content?.length,
      role,
      hasCustomRoles: !!customRoles,
      stream,
      aiMode: aiConfig?.mode,
    });

    // 参数验证
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '缺少必需的参数：content（日记内容或心情图标）' },
        { status: 400 }
      );
    }

    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { error: '缺少必需的参数：role（角色选择）' },
        { status: 400 }
      );
    }

    // 验证自定义角色格式
    if (customRoles && !Array.isArray(customRoles)) {
      return NextResponse.json(
        { error: 'customRoles 必须是数组格式' },
        { status: 400 }
      );
    }

    // 流式输出
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const generator = analyzeMoodStream(content, role as Role, customRoles as CustomRole[]);
            
            // 使用 while 循环来正确处理 generator
            let result = await generator.next();
            while (!result.done) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: result.value })}\n\n`)
              );
              result = await generator.next();
            }
            
            // result.done 为 true 时，result.value 就是 return 的值
            if (result.value) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ done: true, result: result.value })}\n\n`)
              );
            }
            
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 非流式输出
    const aiStart = Date.now();
    console.log(`[API /analyze] 开始调用 analyzeMood`);
    
    const result = await analyzeMood(
      content, 
      role as Role, 
      customRoles as CustomRole[], 
      stream,
      aiConfig as AIConfig
    );
    
    const aiEnd = Date.now();
    console.log(`[API /analyze] analyzeMood 完成，耗时: ${aiEnd - aiStart}ms`);
    
    const totalTime = Date.now() - startTime;
    console.log(`[API /analyze] 总耗时: ${totalTime}ms`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('分析情绪失败：', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '分析失败：未知错误' },
      { status: 500 }
    );
  }
}

