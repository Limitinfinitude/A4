'use client';

import { useState, useEffect } from 'react';
import { getPerformanceLogs, clearPerformanceLogs, type PerformanceLog } from '@/lib/performanceLogger';

export default function PerformanceMonitor() {
  const [logs, setLogs] = useState<PerformanceLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PerformanceLog | null>(null);

  const loadLogs = () => {
    const performanceLogs = getPerformanceLogs();
    setLogs(performanceLogs);
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const handleClear = () => {
    if (confirm('确定要清除所有性能日志吗？')) {
      clearPerformanceLogs();
      setLogs([]);
      setSelectedLog(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'analyze':
        return '情绪分析';
      case 'quote':
        return '生成一记一句';
      case 'summary':
        return '生成统计';
      default:
        return type;
    }
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          性能监控
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium"
        >
          {isOpen ? '收起' : '展开'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              记录最近 {logs.length} 次 AI 调用的性能数据
            </p>
            <div className="flex gap-2">
              <button
                onClick={loadLogs}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                刷新
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                清除日志
              </button>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              暂无性能数据，记录一次心情后将自动记录
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedLog?.id === log.id
                      ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          log.success
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {log.success ? '成功' : '失败'}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getTypeLabel(log.type)}
                      </span>
                      {log.metadata?.role && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          · {log.metadata.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(log.timestamp)}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          log.totalDuration > 20000
                            ? 'text-red-600 dark:text-red-400'
                            : log.totalDuration > 10000
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {formatDuration(log.totalDuration)}
                      </span>
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {selectedLog?.id === log.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      {log.error && (
                        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                          <p className="text-xs text-red-700 dark:text-red-300 font-mono">
                            错误: {log.error}
                          </p>
                        </div>
                      )}

                      {log.metadata && (
                        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {log.metadata.contentLength !== undefined && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">内容长度:</span>{' '}
                                <span className="text-gray-700 dark:text-gray-300">
                                  {log.metadata.contentLength} 字符
                                </span>
                              </div>
                            )}
                            {log.metadata.mode && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">AI 模式:</span>{' '}
                                <span className="text-gray-700 dark:text-gray-300">
                                  {log.metadata.mode === 'api' ? 'API 调用' : 'Ollama 本地'}
                                </span>
                              </div>
                            )}
                            {log.metadata.modelName && (
                              <div className="col-span-2">
                                <span className="text-gray-500 dark:text-gray-400">模型:</span>{' '}
                                <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                                  {log.metadata.modelName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Token 使用信息 */}
                      {log.tokens && (
                        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-1 mb-1">
                            <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Token 使用</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-blue-600 dark:text-blue-400">输入:</span>{' '}
                              <span className="text-blue-800 dark:text-blue-200 font-mono font-semibold">
                                {log.tokens.promptTokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-600 dark:text-blue-400">输出:</span>{' '}
                              <span className="text-blue-800 dark:text-blue-200 font-mono font-semibold">
                                {log.tokens.completionTokens.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-600 dark:text-blue-400">总计:</span>{' '}
                              <span className="text-blue-800 dark:text-blue-200 font-mono font-semibold">
                                {log.tokens.totalTokens.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          各阶段耗时：
                        </p>
                        {log.stages.map((stage, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-1.5 px-2 bg-gray-50 dark:bg-gray-900/30 rounded"
                          >
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {stage.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    stage.duration > 15000
                                      ? 'bg-red-500'
                                      : stage.duration > 5000
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${Math.min((stage.duration / log.totalDuration) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-mono text-gray-700 dark:text-gray-300 w-16 text-right">
                                {formatDuration(stage.duration)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

