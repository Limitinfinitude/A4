'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { getModelName, setModelName as saveModelName, getDefaultModelName } from '@/lib/config';

// 调试页面密码（8位数）
const DEBUG_PASSWORD = '12345678';

export default function DebugPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  
  // 从 localStorage 读取配置
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gpt-4o-mini');
  
  useEffect(() => {
    // 检查是否已认证（从 sessionStorage）
    const auth = sessionStorage.getItem('debug_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadConfig();
    }
  }, []);

  const loadConfig = () => {
    if (typeof window !== 'undefined') {
      setApiUrl(localStorage.getItem('debug_api_url') || '');
      setApiKey(localStorage.getItem('debug_api_key') || '');
      // 使用 config.ts 中的函数读取模型名称
      setModelName(getModelName());
    }
  };

  const handleLogin = () => {
    if (password === DEBUG_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('debug_auth', 'true');
      setError('');
      loadConfig();
    } else {
      setError('密码错误');
      setPassword('');
    }
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug_api_url', apiUrl);
      localStorage.setItem('debug_api_key', apiKey);
      // 使用 config.ts 中的函数保存模型名称
      try {
        saveModelName(modelName);
        alert('配置已保存！注意：这些配置仅存储在本地，不会影响服务器环境变量。');
      } catch (error) {
        alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
      }
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置所有配置吗？')) {
      const defaultModel = getDefaultModelName();
      setApiUrl('');
      setApiKey('');
      setModelName(defaultModel);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('debug_api_url');
        localStorage.removeItem('debug_api_key');
        // 使用 config.ts 中的函数重置模型配置
        try {
          saveModelName(defaultModel);
        } catch (error) {
          console.error('重置模型配置失败', error);
        }
      }
      alert('配置已重置');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('debug_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="py-8 max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              🔒 调试页面
            </h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  请输入8位数密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="输入密码"
                  maxLength={8}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
              >
                登录
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-8 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔧 调试配置
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              退出
            </button>
          </div>

          <div className="space-y-6">
            {/* API URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API URL（可选，留空使用默认）
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="例如：https://api.openai.com/v1"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                留空则使用默认 OpenAI API URL
              </p>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key（可选，留空使用环境变量）
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="输入 API Key（不会显示）"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                留空则使用环境变量 OPENAI_API_KEY
              </p>
            </div>

            {/* Model Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                模型名称
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                placeholder="例如：gpt-4o-mini"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                输入要使用的模型名称（支持自定义）
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">快速选择：</span>
                {['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'].map((model) => (
                  <button
                    key={model}
                    onClick={() => setModelName(model)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      modelName === model
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
              >
                保存配置
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                重置
              </button>
            </div>

            {/* 提示信息 */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 <strong>提示</strong>：
              </p>
              <ul className="mt-2 text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                <li>API URL 和 API Key 仅存储在浏览器本地，不会上传</li>
                <li>模型配置会应用到所有情绪分析和总结功能</li>
                <li>如需永久更改，请修改服务器环境变量或 .env 文件</li>
              </ul>
            </div>

            {/* 当前配置显示 */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">当前配置：</p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono">
                <p>API URL: {apiUrl || '(使用默认)'}</p>
                <p>API Key: {apiKey ? '***已设置***' : '(使用环境变量)'}</p>
                <p>Model: {modelName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

