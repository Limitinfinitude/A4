'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

// 类型定义（和 analyzeMood.ts 中的 MoodAnalysisResult 对齐）
type MoodAnalysisResult = {
  keyWords: string[];
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type Role = 'mother' | 'teacher' | 'friend';

export default function Home() {
  const [content, setContent] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 从 localStorage 恢复草稿
  useEffect(() => {
    const savedContent = localStorage.getItem('mood_draft');
    if (savedContent) setContent(savedContent);
  }, []);

  // 实时保存草稿
  useEffect(() => {
    if (content) {
      localStorage.setItem('mood_draft', content);
    }
  }, [content]);

  // 提交日记 → 调用 API 路由
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入你的心情碎碎念～');
      return;
    }
    if (!selectedRole) {
      alert('请选择一个角色～');
      return;
    }
    setLoading(true);
    try {
      // 调用 API 路由（非流式）
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          role: selectedRole,
          stream: false
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'AI分析失败');
      }

      const data = await res.json();
      const moodRecord = {
        id: Date.now(),
        content,
        role: selectedRole,
        feedback: data as MoodAnalysisResult,
        createTime: new Date().toLocaleString('zh-CN'),
      };

      // 存储到 localStorage
      const history = JSON.parse(localStorage.getItem('mood_history') || '[]');
      history.unshift(moodRecord);
      localStorage.setItem('mood_history', JSON.stringify(history));
      localStorage.removeItem('mood_draft');
      setContent('');
      setSelectedRole('');

      // 跳转到反馈页
      router.push(`/feedback?id=${moodRecord.id}`);
    } catch (error: any) {
      alert(error.message || '提交失败，请检查网络或API密钥～');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'mother' as Role, name: '慈母', emoji: '🤱', desc: '温柔包容，给予情感支持', color: 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200' },
    { id: 'teacher' as Role, name: '严师', emoji: '👨‍🏫', desc: '理性客观，提供成长建议', color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
    { id: 'friend' as Role, name: '老友', emoji: '👫', desc: '真诚共情，分享相似经历', color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' },
  ];

  return (
    <MainLayout>
      <div className="py-8">
        {/* 欢迎区域 */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            今天的心情如何？
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            写下你的情绪，选择一个角色，让 AI 为你提供个性化的温暖反馈
          </p>
        </div>

        {/* 日记输入卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            记录你的心情
          </label>
          <textarea
            className="w-full h-40 sm:h-48 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 transition-all"
            placeholder="今天发生了什么？你的感受是什么？想说什么都可以，碎碎念也没关系～"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          />
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>字数：{content.length}</span>
            <span>支持实时保存</span>
          </div>
        </div>

        {/* 角色选择 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            选择一个角色来回应你
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {roles.map((role) => (
              <button
                key={role.id}
                className={`px-6 py-4 rounded-xl text-sm font-medium border-2 transition-all transform hover:scale-105 active:scale-95 text-left ${
                  selectedRole === role.id
                    ? `${role.color} border-current shadow-md scale-105`
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => setSelectedRole(role.id)}
                disabled={loading}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{role.emoji}</span>
                  <span className="font-semibold text-base">{role.name}</span>
                </div>
                <p className="text-xs opacity-75">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6"
          onClick={handleSubmit}
          disabled={loading || !content.trim() || !selectedRole}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI 正在分析中...
            </span>
          ) : (
            '✨ 生成情绪镜像'
          )}
        </button>

        {/* 功能说明卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI 智能分析</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">GPT-4o-mini 深度理解你的情绪</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-2xl mb-2">💭</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">个性化反馈</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">AI 自动分析情绪并匹配角色</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">隐私安全</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">数据仅存储在本地</p>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          <p>💡 提示：你的日记会自动保存，不用担心丢失</p>
        </div>
      </div>
    </MainLayout>
  );
}
