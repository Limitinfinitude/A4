import { NextRequest, NextResponse } from 'next/server';
import { analyzeMood, analyzeMoodStream, type MoodAnalysisResult, type Role, type CustomRole } from '@/lib/analyzeMood';

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
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, role, customRoles, stream } = body;

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
    const result = await analyzeMood(content, role as Role, customRoles as CustomRole[]);
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

