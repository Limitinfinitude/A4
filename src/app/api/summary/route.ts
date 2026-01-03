import { NextRequest, NextResponse } from 'next/server';
import { generateSummary, type SummaryData } from '@/lib/generateSummary';
import type { AIConfig } from '@/lib/aiClient';

/**
 * POST /api/summary
 * 生成过去7天的情绪总结
 * 
 * 请求体：
 * {
 *   "summaryData": WeekSummaryData,
 *   "aiConfig": [可选] AI 配置
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summaryData, aiConfig } = body;

    // 参数验证
    if (!summaryData || typeof summaryData !== 'object') {
      return NextResponse.json(
        { error: '缺少必需的参数：summaryData' },
        { status: 400 }
      );
    }

    // 生成总结
    const summary = await generateSummary(summaryData as SummaryData, aiConfig as AIConfig);
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('生成总结失败：', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '生成总结失败：未知错误' },
      { status: 500 }
    );
  }
}

