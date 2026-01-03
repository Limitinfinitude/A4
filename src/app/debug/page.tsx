'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { 
  getModelName, 
  setModelName as saveModelName, 
  getDefaultModelName,
  resetModelName as resetModelNameConfig,
  getAIMode,
  setAIMode,
  getOllamaURL,
  setOllamaURL,
  getOllamaModel,
  setOllamaModel,
  type AIMode
} from '@/lib/config';
import { getOllamaModels, checkOllamaAvailable } from '@/lib/aiClient';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Ollama 相关状态
  const [aiMode, setAIModeState] = useState<AIMode>('api');
  const [ollamaUrl, setOllamaUrlState] = useState('');
  const [ollamaModel, setOllamaModelState] = useState('');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // 时间修改功能相关状态
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [moodRecords, setMoodRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  
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
      
      // 加载 AI 模式和 Ollama 配置
      setAIModeState(getAIMode());
      setOllamaUrlState(getOllamaURL());
      setOllamaModelState(getOllamaModel());
      
      // 如果是 Ollama 模式，检测可用性并加载模型列表
      if (getAIMode() === 'ollama') {
        checkOllamaStatus();
      }
    }
  };
  
  // 检测 Ollama 服务状态
  const checkOllamaStatus = async () => {
    setOllamaStatus('checking');
    const available = await checkOllamaAvailable();
    setOllamaStatus(available ? 'available' : 'unavailable');
    if (available) {
      loadOllamaModels();
    }
  };
  
  // 加载 Ollama 模型列表
  const loadOllamaModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await getOllamaModels();
      setOllamaModels(models);
    } catch (error) {
      console.error('加载 Ollama 模型失败：', error);
      setOllamaModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  // 处理 AI 模式切换
  const handleAIModeChange = (mode: AIMode) => {
    setAIModeState(mode);
    if (mode === 'ollama') {
      checkOllamaStatus();
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

  // 暂时保存配置（临时配置）
  const handleSave = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug_api_url', apiUrl);
      localStorage.setItem('debug_api_key', apiKey);
      // 使用 config.ts 中的函数保存模型名称
      try {
        saveModelName(modelName);
        setAIMode(aiMode);
        setOllamaURL(ollamaUrl);
        setOllamaModel(ollamaModel);
        setShowConfirmModal(false);
        alert('配置已保存！注意：这些配置仅存储在当前浏览器本地，不会影响服务器环境变量。');
        loadConfig();
      } catch (error) {
        alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
      }
    }
  };

  // 恢复到初始用户状态
  const handleResetUserState = () => {
    if (confirm('确定要恢复到初始用户状态吗？这将清除所有首次访问标记，下次进入将重新显示隐私协议和引导。')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('privacy_agreement_accepted');
        localStorage.removeItem('has_viewed_guide');
        alert('已恢复到初始用户状态！刷新页面即可看到隐私协议。');
      }
    }
  };
  
  // 加载心情记录
  const loadMoodRecords = () => {
    if (typeof window !== 'undefined') {
      const records = JSON.parse(localStorage.getItem('mood_history') || '[]');
      setMoodRecords(records);
      setShowTimeEditor(true);
    }
  };
  
  // 开始编辑时间
  const handleEditTime = (record: any) => {
    setEditingRecord(record);
    const date = new Date(record.date);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = date.toTimeString().slice(0, 5); // HH:mm
    setNewDate(dateStr);
    setNewTime(timeStr);
  };
  
  // 保存修改后的时间
  const handleSaveTime = () => {
    if (!editingRecord || !newDate || !newTime) {
      alert('请选择日期和时间！');
      return;
    }
    
    const newDateTime = new Date(`${newDate}T${newTime}`);
    if (isNaN(newDateTime.getTime())) {
      alert('无效的日期时间！');
      return;
    }
    
    if (typeof window !== 'undefined') {
      const records = JSON.parse(localStorage.getItem('mood_history') || '[]');
      const index = records.findIndex((r: any) => r.id === editingRecord.id);
      if (index !== -1) {
        records[index].date = newDateTime.toISOString();
        localStorage.setItem('mood_history', JSON.stringify(records));
        alert('时间已修改！');
        loadMoodRecords();
        setEditingRecord(null);
        setNewDate('');
        setNewTime('');
      }
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置所有配置吗？这将清除所有配置（包括永久配置）并恢复为默认值。')) {
      const defaultModel = getDefaultModelName();
      setApiUrl('');
      setApiKey('');
      setModelName(defaultModel);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('debug_api_url');
        localStorage.removeItem('debug_api_key');
        // 使用 config.ts 中的函数重置模型配置（清除所有配置）
        try {
          resetModelNameConfig();
        } catch (error) {
          console.error('重置模型配置失败', error);
        }
      }
      alert('配置已重置');
      loadConfig();
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
            {/* AI 模式选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI 模式
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAIModeChange('api')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    aiMode === 'api'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  🌐 API 模式
                  <p className="text-xs mt-1 opacity-75">使用 OpenAI API</p>
                </button>
                <button
                  onClick={() => handleAIModeChange('ollama')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    aiMode === 'ollama'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-800'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  🏠 Ollama 本地
                  <p className="text-xs mt-1 opacity-75">使用本地模型</p>
                </button>
              </div>
            </div>

            {/* API 模式配置 */}
            {aiMode === 'api' && (
              <>
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
              </>
            )}

            {/* Ollama 模式配置 */}
            {aiMode === 'ollama' && (
              <>
                {/* Ollama URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ollama 服务地址
                  </label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrlState(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    placeholder="http://localhost:11434"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      默认: http://localhost:11434
                    </p>
                    <button
                      onClick={checkOllamaStatus}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      检测连接
                    </button>
                  </div>
                  
                  {/* 连接状态 */}
                  <div className="mt-2">
                    {ollamaStatus === 'checking' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">⏳ 检测中...</p>
                    )}
                    {ollamaStatus === 'available' && (
                      <p className="text-xs text-green-600 dark:text-green-400">✅ Ollama 服务可用</p>
                    )}
                    {ollamaStatus === 'unavailable' && (
                      <p className="text-xs text-red-600 dark:text-red-400">❌ 无法连接到 Ollama 服务，请确保 Ollama 正在运行</p>
                    )}
                  </div>
                </div>

                {/* Ollama 模型选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ollama 模型
                  </label>
                  
                  {ollamaStatus === 'available' ? (
                    <>
                      {isLoadingModels ? (
                        <div className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          加载模型列表中...
                        </div>
                      ) : ollamaModels.length > 0 ? (
                        <>
                          <select
                            value={ollamaModel}
                            onChange={(e) => setOllamaModelState(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                          >
                            <option value="">-- 请选择模型 --</option>
                            {ollamaModels.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={loadOllamaModels}
                            className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                          >
                            🔄 刷新模型列表
                          </button>
                        </>
                      ) : (
                        <div className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
                          未检测到可用模型，请先在 Ollama 中下载模型
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      请先检测 Ollama 服务连接
                    </div>
                  )}
                  
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    💡 提示：可在终端运行 <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">ollama list</code> 查看已下载的模型
                  </p>
                </div>
              </>
            )}

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
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                重置所有
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
                <li>配置仅保存在当前浏览器，清除缓存或切换设备后会恢复默认</li>
                <li>如需永久修改默认配置，请编辑项目源代码 <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">src/lib/config.ts</code></li>
              </ul>
            </div>

            {/* 当前配置显示 */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">当前配置：</p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono">
                <p>AI 模式: {aiMode === 'api' ? '🌐 API 模式' : '🏠 Ollama 本地'}</p>
                {aiMode === 'api' ? (
                  <>
                    <p>API URL: {apiUrl || '(使用默认)'}</p>
                    <p>API Key: {apiKey ? '***已设置***' : '(使用环境变量)'}</p>
                    <p>Model: {modelName}</p>
                  </>
                ) : (
                  <>
                    <p>Ollama URL: {ollamaUrl || '(使用默认)'}</p>
                    <p>Ollama Model: {ollamaModel || '(未选择)'}</p>
                    <p>服务状态: {ollamaStatus === 'available' ? '✅ 可用' : ollamaStatus === 'checking' ? '⏳ 检测中' : '❌ 不可用'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 数据管理 */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📦 数据管理
          </h2>
          
          <div className="space-y-4">
            {/* 恢复初始状态 */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                🔄 恢复到初始用户状态
              </h3>
              <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                清除所有首次访问标记（隐私协议、用户引导等），下次进入将重新显示。适用于测试和演示。
              </p>
              <button
                onClick={handleResetUserState}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                恢复初始状态
              </button>
            </div>

            {/* 修改记录时间 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                ⏰ 修改记录时间
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                修改心情记录的日期和时间，便于制作演示数据和测试不同时间段的统计功能。
              </p>
              <button
                onClick={loadMoodRecords}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                管理记录时间
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 确认弹窗 */}
      {/* 性能监控面板 */}
      <PerformanceMonitor />

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              保存配置
            </h3>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                配置将保存在当前浏览器中，清除浏览器缓存或切换设备后会恢复为默认配置。
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                模型名称：<span className="font-mono">{modelName}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 py-2.5 rounded-xl font-medium transition-colors text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/40"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 时间编辑器弹窗 */}
      {showTimeEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                ⏰ 修改记录时间
              </h3>
              <button
                onClick={() => {
                  setShowTimeEditor(false);
                  setEditingRecord(null);
                  setNewDate('');
                  setNewTime('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {moodRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                暂无心情记录
              </div>
            ) : (
              <div className="space-y-3">
                {moodRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {new Date(record.date).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {record.emotionLabels && record.emotionLabels.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {record.emotionLabels.join('、')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {record.content || record.icon || '无内容'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditTime(record)}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        修改时间
                      </button>
                    </div>

                    {/* 时间编辑表单 */}
                    {editingRecord?.id === record.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              日期
                            </label>
                            <input
                              type="date"
                              value={newDate}
                              onChange={(e) => setNewDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              时间
                            </label>
                            <input
                              type="time"
                              value={newTime}
                              onChange={(e) => setNewTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveTime}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecord(null);
                              setNewDate('');
                              setNewTime('');
                            }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

