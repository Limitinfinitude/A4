/**
 * 性能日志记录器
 * 用于记录和展示 AI 调用的性能数据
 */

export interface PerformanceLog {
  id: string;
  timestamp: number;
  type: 'analyze' | 'quote' | 'summary';
  stages: {
    name: string;
    duration: number;
    startTime: number;
    endTime: number;
  }[];
  totalDuration: number;
  success: boolean;
  error?: string;
  metadata?: {
    contentLength?: number;
    role?: string;
    mode?: string;
    modelName?: string;
  };
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const MAX_LOGS = 20; // 最多保存 20 条日志
const STORAGE_KEY = 'mood_performance_logs';

/**
 * 获取所有性能日志
 */
export function getPerformanceLogs(): PerformanceLog[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('获取性能日志失败：', error);
    return [];
  }
}

/**
 * 保存性能日志
 */
export function savePerformanceLog(log: PerformanceLog): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const logs = getPerformanceLogs();
    logs.unshift(log); // 添加到开头
    
    // 只保留最近的记录
    const trimmedLogs = logs.slice(0, MAX_LOGS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('保存性能日志失败：', error);
  }
}

/**
 * 清除所有性能日志
 */
export function clearPerformanceLogs(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除性能日志失败：', error);
  }
}

/**
 * 创建性能计时器
 */
export class PerformanceTimer {
  private stages: PerformanceLog['stages'] = [];
  private currentStage: { name: string; startTime: number } | null = null;
  private startTime: number;
  private id: string;
  private type: PerformanceLog['type'];
  private metadata: PerformanceLog['metadata'];

  constructor(type: PerformanceLog['type'], metadata?: PerformanceLog['metadata']) {
    this.startTime = Date.now();
    this.id = `${type}_${this.startTime}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.metadata = metadata;
  }

  /**
   * 开始一个新阶段
   */
  startStage(name: string): void {
    // 如果有正在进行的阶段，先结束它
    if (this.currentStage) {
      this.endStage();
    }

    this.currentStage = {
      name,
      startTime: Date.now(),
    };
  }

  /**
   * 结束当前阶段
   */
  endStage(): void {
    if (!this.currentStage) {
      return;
    }

    const endTime = Date.now();
    const duration = endTime - this.currentStage.startTime;

    this.stages.push({
      name: this.currentStage.name,
      duration,
      startTime: this.currentStage.startTime,
      endTime,
    });

    this.currentStage = null;
  }

  /**
   * 完成并保存日志
   */
  finish(success: boolean = true, error?: string, tokens?: PerformanceLog['tokens']): void {
    // 结束任何未完成的阶段
    if (this.currentStage) {
      this.endStage();
    }

    const totalDuration = Date.now() - this.startTime;

    const log: PerformanceLog = {
      id: this.id,
      timestamp: this.startTime,
      type: this.type,
      stages: this.stages,
      totalDuration,
      success,
      error,
      metadata: this.metadata,
      tokens,
    };

    savePerformanceLog(log);
  }

  /**
   * 获取当前统计信息（用于中间查看）
   */
  getStats(): {
    totalDuration: number;
    stages: PerformanceLog['stages'];
  } {
    return {
      totalDuration: Date.now() - this.startTime,
      stages: [...this.stages],
    };
  }
}

