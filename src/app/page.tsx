'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { FIXED_ROLES, type FixedRole, type CustomRole } from '@/lib/analyzeMood';
import { getCustomRoles, saveCustomRole, deleteCustomRole } from '@/lib/customRoles';
import { iconToEmotionTag, iconToKeywords } from '@/lib/iconToEmotion';

// 类型定义
type MoodAnalysisResult = {
  keyWords: string[];
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type Role = FixedRole | string; // string 用于自定义角色 ID

// 心情图标选项
const MOOD_ICONS = [
  { emoji: '😊', label: '开心', value: '😊' },
  { emoji: '😢', label: '难过', value: '😢' },
  { emoji: '😡', label: '愤怒', value: '😡' },
  { emoji: '😰', label: '焦虑', value: '😰' },
  { emoji: '😴', label: '疲惫', value: '😴' },
  { emoji: '😌', label: '平静', value: '😌' },
  { emoji: '🤔', label: '思考', value: '🤔' },
  { emoji: '😎', label: '满足', value: '😎' },
  { emoji: '😔', label: '失落', value: '😔' },
  { emoji: '😍', label: '兴奋', value: '😍' },
  { emoji: '😤', label: '挫败', value: '😤' },
  { emoji: '😐', label: '中性', value: '😐' },
];

export default function Home() {
  const [inputMode, setInputMode] = useState<'icon' | 'text'>('text');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [content, setContent] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [loading, setLoading] = useState(false);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showCustomRoleModal, setShowCustomRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const router = useRouter();

  // 加载自定义角色
  useEffect(() => {
    setCustomRoles(getCustomRoles());
  }, []);

  // 从 localStorage 恢复草稿
  useEffect(() => {
    const savedContent = localStorage.getItem('mood_draft');
    const savedIcon = localStorage.getItem('mood_draft_icon');
    const savedMode = localStorage.getItem('mood_draft_mode');
    if (savedContent) setContent(savedContent);
    if (savedIcon) setSelectedIcon(savedIcon);
    if (savedMode === 'icon') setInputMode('icon');
  }, []);

  // 实时保存草稿
  useEffect(() => {
    if (content || selectedIcon) {
      localStorage.setItem('mood_draft', content);
      localStorage.setItem('mood_draft_icon', selectedIcon);
      localStorage.setItem('mood_draft_mode', inputMode);
    }
  }, [content, selectedIcon, inputMode]);

  // 提交日记
  const handleSubmit = async () => {
    // 图标模式：直接生成名言
    if (inputMode === 'icon') {
      if (!selectedIcon) {
        alert('请选择一个心情图标～');
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moodIcon: selectedIcon }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || '生成名言失败');
        }

        const data = await res.json();
        // 根据图标获取对应的情绪标签和关键词
        const emotionTag = iconToEmotionTag(selectedIcon);
        const keyWords = iconToKeywords(selectedIcon);
        
        const moodRecord = {
          id: Date.now(),
          content: selectedIcon,
          role: 'quote', // 特殊标记，表示这是名言模式
          feedback: {
            keyWords: keyWords,
            emotionTag: emotionTag,
            feedback: '',
            slogan: data.quote, // 名言作为 slogan
          } as MoodAnalysisResult,
          createTime: new Date().toISOString(),
        };

        // 存储到 localStorage
        const history = JSON.parse(localStorage.getItem('mood_history') || '[]');
        history.unshift(moodRecord);
        localStorage.setItem('mood_history', JSON.stringify(history));
        localStorage.removeItem('mood_draft');
        localStorage.removeItem('mood_draft_icon');
        localStorage.removeItem('mood_draft_mode');
        setSelectedIcon('');

        // 跳转到反馈页
        router.push(`/feedback?id=${moodRecord.id}`);
      } catch (error: any) {
        alert(error.message || '生成名言失败，请检查网络或API密钥～');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 文字模式：需要角色选择，进行完整分析
    const finalContent = content.trim();
    
    if (!finalContent) {
      alert('请输入你的心情碎碎念～');
      return;
    }
    if (!selectedRole) {
      alert('请选择一个角色～');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: finalContent, 
          role: selectedRole,
          customRoles: customRoles.length > 0 ? customRoles : undefined,
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
        content: finalContent,
        role: selectedRole,
        feedback: data as MoodAnalysisResult,
        createTime: new Date().toLocaleString('zh-CN'),
      };

      // 存储到 localStorage
      const history = JSON.parse(localStorage.getItem('mood_history') || '[]');
      history.unshift(moodRecord);
      localStorage.setItem('mood_history', JSON.stringify(history));
      localStorage.removeItem('mood_draft');
      localStorage.removeItem('mood_draft_icon');
      localStorage.removeItem('mood_draft_mode');
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

  // 保存自定义角色
  const handleSaveCustomRole = () => {
    if (!newRoleName.trim() || !newRoleDesc.trim()) {
      alert('请填写角色名称和描述');
      return;
    }
    
    const role: CustomRole = editingRole || {
      id: `custom_${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
    };
    
    saveCustomRole(role);
    setCustomRoles(getCustomRoles());
    setShowCustomRoleModal(false);
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  // 删除自定义角色
  const handleDeleteCustomRole = (id: string) => {
    if (confirm('确定要删除这个自定义角色吗？')) {
      deleteCustomRole(id);
      setCustomRoles(getCustomRoles());
      if (selectedRole === id) {
        setSelectedRole('');
      }
    }
  };

  // 编辑自定义角色
  const handleEditCustomRole = (role: CustomRole) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDesc(role.description);
    setShowCustomRoleModal(true);
  };

  // 获取所有角色（固定 + 自定义）
  const allRoles = [
    ...Object.entries(FIXED_ROLES).map(([id, role]) => ({
      id: id as FixedRole,
      name: role.name,
      emoji: role.emoji,
      desc: role.description,
      isCustom: false,
    })),
    ...customRoles.map(role => ({
      id: role.id,
      name: role.name,
      emoji: '✨',
      desc: role.description,
      isCustom: true,
    })),
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
            {inputMode === 'icon' 
              ? '选择心情图标，记录你的心情'
              : '输入文字，选择一个角色，让 AI 为你提供个性化的温暖反馈'}
          </p>
        </div>

        {/* 输入模式选择 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            记录方式
          </label>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                setInputMode('text');
                setSelectedIcon('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📝 文字输入
            </button>
            <button
              onClick={() => {
                setInputMode('icon');
                setContent('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === 'icon'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              😊 心情图标
            </button>
          </div>

          {/* 文字输入模式 */}
          {inputMode === 'text' && (
            <div>
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
          )}

          {/* 心情图标选择模式 */}
          {inputMode === 'icon' && (
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {MOOD_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    onClick={() => setSelectedIcon(selectedIcon === icon.value ? '' : icon.value)}
                    className={`aspect-square rounded-xl border-2 transition-all transform hover:scale-110 active:scale-95 ${
                      selectedIcon === icon.value
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 scale-110'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-purple-300'
                    }`}
                    disabled={loading}
                  >
                    <div className="text-3xl">{icon.emoji}</div>
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">{icon.label}</div>
                  </button>
                ))}
              </div>
              {selectedIcon && (
                <div className="mt-4 text-center">
                  <span className="text-4xl">{selectedIcon}</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">已选择心情图标</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 角色选择（仅在文字模式显示） */}
        {inputMode === 'text' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                选择一个角色来回应你
              </label>
              <button
                onClick={() => {
                  setEditingRole(null);
                  setNewRoleName('');
                  setNewRoleDesc('');
                  setShowCustomRoleModal(true);
                }}
                className="px-3 py-1 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                + 自定义角色
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allRoles.map((role) => (
                <div key={role.id} className="relative">
                  <button
                    className={`w-full px-4 py-4 rounded-xl text-sm font-medium border-2 transition-all transform hover:scale-105 active:scale-95 text-left ${
                      selectedRole === role.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 shadow-md scale-105'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{role.emoji}</span>
                      <span className="font-semibold text-base">{role.name}</span>
                    </div>
                    <p className="text-xs opacity-75 line-clamp-2">{role.desc}</p>
                  </button>
                  {role.isCustom && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomRole(customRoles.find(r => r.id === role.id)!);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomRole(role.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6"
          onClick={handleSubmit}
          disabled={
            loading || 
            (inputMode === 'icon' ? !selectedIcon : (!content.trim() || !selectedRole))
          }
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {inputMode === 'icon' ? '正在记录心情...' : 'AI 正在分析中...'}
            </span>
          ) : (
            inputMode === 'icon' ? '✨ 记录心情' : '✨ 生成情绪镜像'
          )}
        </button>

        {/* 自定义角色模态框 */}
        {showCustomRoleModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingRole ? '编辑自定义角色' : '创建自定义角色'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="例如：心理咨询师"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    角色设定描述
                  </label>
                  <textarea
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows={4}
                    placeholder="描述这个角色的特点、风格和反馈方式，例如：专业、温和、提供心理支持..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCustomRoleModal(false);
                    setEditingRole(null);
                    setNewRoleName('');
                    setNewRoleDesc('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCustomRole}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

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
