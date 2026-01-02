import { NextRequest, NextResponse } from 'next/server';
import { generateQuote } from '@/lib/generateQuote';

/**
 * POST /api/quote
 * 根据心情图标生成一记一句
 * 
 * 请求体：
 * {
 *   "moodIcon": "😊" // 心情图标
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moodIcon } = body;

    // 参数验证
    if (!moodIcon || typeof moodIcon !== 'string') {
      return NextResponse.json(
        { error: '缺少必需的参数：moodIcon（心情图标）' },
        { status: 400 }
      );
    }

    const result = await generateQuote(moodIcon);
    return NextResponse.json(result);
  } catch (error) {
    console.error('生成一记一句失败：', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '生成一记一句失败：未知错误' },
      { status: 500 }
    );
  }
}

