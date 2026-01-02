'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { FIXED_ROLES, type FixedRole, type CustomRole } from '@/lib/analyzeMood';
import { getCustomRoles, saveCustomRole, deleteCustomRole } from '@/lib/customRoles';
import { getRoleInfo } from '@/lib/roleUtils';

// 类型定义
type MoodAnalysisResult = {
  emotionLabels?: string[];
  keyWords?: string[]; // 兼容旧数据
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type Role = FixedRole | string; // string 用于自定义角色 ID

// 心情图标选项（仅表情，无文字描述）
// 常用表情
const COMMON_EMOJIS = [
  '😊', '😢', '😡', '😰', '😴', '😌', '🤔', '😎',
  '😔', '😍', '😤', '😐', '😃', '😭', '😨', '😪',
  '😇', '🤗', '😋', '😏', '😳', '🥳', '😓', '😖',
];

// 猫猫表情
const CAT_EMOJIS = [
  '😺', '😸', '😹', '😻', '😼', '😽',
];

// 天气表情
const WEATHER_EMOJIS = [
  '☀️', '🌤️', '⛅', '☁️', '🌦️', '🌧️', '⛈️', '❄️', '🌈', '☔',
];

const MOOD_ICONS = [...COMMON_EMOJIS, ...CAT_EMOJIS, ...WEATHER_EMOJIS];

export default function Home() {
  const [inputMode, setInputMode] = useState<'icon' | 'text'>('text');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [content, setContent] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('warm_companion'); // 默认使用温暖陪伴者
  const [isRoleExpanded, setIsRoleExpanded] = useState(false); // 角色选择展开状态
  const [loading, setLoading] = useState(false);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showCustomRoleModal, setShowCustomRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleAvatar, setNewRoleAvatar] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showIconModal, setShowIconModal] = useState(false); // 心情图标弹窗状态
  const router = useRouter();

  // 加载自定义角色
  useEffect(() => {
    setCustomRoles(getCustomRoles());
  }, []);

  // 从 localStorage 恢复草稿（仅恢复内容，不恢复模式）
  useEffect(() => {
    const savedContent = localStorage.getItem('mood_draft');
    if (savedContent) setContent(savedContent);
    // 不恢复模式，始终默认文字输入模式
  }, []);

  // 实时保存草稿
  useEffect(() => {
    if (content || selectedIcon) {
      localStorage.setItem('mood_draft', content);
      localStorage.setItem('mood_draft_icon', selectedIcon);
      localStorage.setItem('mood_draft_mode', inputMode);
    }
  }, [content, selectedIcon, inputMode]);

  // 提交心情图标记录
  const handleSubmitIcon = async () => {
    if (!selectedIcon) {
      alert('请选择一个心情图标～');
      return;
    }
    
    setLoading(true);
    try {
      const customRoles = JSON.parse(localStorage.getItem('custom_roles') || '[]');
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: selectedIcon,
          role: selectedRole,
          customRoles: customRoles,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '分析失败');
      }

      const data = await res.json();
      // 获取角色信息用于快照
      const roleInfo = getRoleInfo(selectedRole);
      
      // AI 分析的情绪标签和标准标签
      const moodRecord = {
        id: Date.now(),
        content: selectedIcon,
        role: selectedRole,
        roleSnapshot: {
          name: roleInfo.name,
          emoji: roleInfo.emoji,
          avatar: roleInfo.avatar,
          description: roleInfo.description,
        },
        feedback: data as MoodAnalysisResult,
        createTime: new Date().toISOString(),
      };

      // 存储到 localStorage
      const history = JSON.parse(localStorage.getItem('mood_history') || '[]');
      history.unshift(moodRecord);
      localStorage.setItem('mood_history', JSON.stringify(history));
      setSelectedIcon('');
      setShowIconModal(false);

      // 跳转到反馈页
      router.push(`/feedback?id=${moodRecord.id}`);
    } catch (error: any) {
      alert(error.message || '分析失败，请检查网络或API密钥～');
    } finally {
      setLoading(false);
    }
  };

  // 提交文字记录
  const handleSubmit = async () => {
    const finalContent = content.trim();
    
    if (!finalContent) {
      alert('请输入你的心情碎碎念～');
      return;
    }
    // 如果没有选择角色，使用默认角色（warm_companion）
    const finalRole = selectedRole || 'warm_companion';
    
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: finalContent, 
          role: finalRole,
          customRoles: customRoles.length > 0 ? customRoles : undefined,
          stream: false
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'AI分析失败');
      }

      const data = await res.json();
      
      // 获取角色快照信息，即使角色将来被删除也能显示
      const getRoleSnapshot = () => {
        // 检查是否是固定角色
        if (finalRole in FIXED_ROLES) {
          const fixedRole = finalRole as keyof typeof FIXED_ROLES;
          return {
            name: FIXED_ROLES[fixedRole].name,
            emoji: FIXED_ROLES[fixedRole].emoji,
            avatar: FIXED_ROLES[fixedRole].avatar,
            description: FIXED_ROLES[fixedRole].description,
          };
        }
        // 自定义角色
        const customRole = customRoles.find(r => r.id === finalRole);
        if (customRole) {
          return {
            name: customRole.name,
            emoji: '✨',
            avatar: customRole.avatar,
            description: customRole.description,
          };
        }
        return null;
      };
      
      const moodRecord = {
        id: Date.now(),
        content: finalContent,
        role: finalRole,
        roleSnapshot: getRoleSnapshot(), // 保存角色快照
        feedback: data as MoodAnalysisResult,
        createTime: new Date().toISOString(),
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

  // 处理头像上传
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 检查文件大小（限制 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setNewRoleAvatar(base64);
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // 保存自定义角色
  const handleSaveCustomRole = () => {
    if (!newRoleName.trim() || !newRoleDesc.trim()) {
      alert('请填写角色名称和描述');
      return;
    }
    
    // 编辑时保留原 ID，新建时生成新 ID
    const role: CustomRole = {
      id: editingRole ? editingRole.id : `custom_${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      avatar: newRoleAvatar || undefined,
    };
    
    saveCustomRole(role);
    setCustomRoles(getCustomRoles());
    setShowCustomRoleModal(false);
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleAvatar('');
    setAvatarPreview('');
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
    setNewRoleAvatar(role.avatar || '');
    setAvatarPreview(role.avatar || '');
    setShowCustomRoleModal(true);
  };

  // 获取所有角色（固定 + 自定义）
  const allRoles = [
    ...Object.entries(FIXED_ROLES).map(([id, role]) => ({
      id: id as FixedRole,
      name: role.name,
      emoji: role.emoji,
      avatar: role.avatar,
      desc: role.description,
      isCustom: false,
    })),
    ...customRoles.map(role => ({
      id: role.id,
      name: role.name,
      emoji: '✨',
      avatar: role.avatar || '/avatars/default.png',
      desc: role.description,
      isCustom: true,
    })),
  ];

  return (
    <MainLayout>
      <div className="py-8">
        {/* 欢迎区域 */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            今天心情如何？
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {inputMode === 'icon' 
              ? '选择一个心情图标，快速记录当下的情绪'
              : '选择一个角色，让 AI 为你提供温暖的陪伴'}
          </p>
        </div>

        {/* 输入模式选择 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                setInputMode('text');
                setSelectedIcon('');
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              文字输入
            </button>
            <button
              onClick={() => {
                setInputMode('icon');
                setContent('');
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                inputMode === 'icon'
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              心情图标
            </button>
          </div>

          {/* 角色选择（两种模式都显示） */}
          <div className="mb-4">
            <button
              onClick={() => setIsRoleExpanded(!isRoleExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <div className="flex items-center gap-2">
                {(() => {
                  const currentRole = allRoles.find(r => r.id === selectedRole);
                  return (
                    <>
                      {currentRole?.avatar ? (
                        <img 
                          src={currentRole.avatar} 
                          alt={currentRole.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {currentRole?.name || '温暖陪伴者'}
                      </span>
                    </>
                  );
                })()}
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  isRoleExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 展开的角色选择列表 */}
            {isRoleExpanded && (
              <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">选择角色</span>
                  <button
                    onClick={() => {
                      setEditingRole(null);
                      setNewRoleName('');
                      setNewRoleDesc('');
                      setNewRoleAvatar('');
                      setAvatarPreview('');
                      setShowCustomRoleModal(true);
                    }}
                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    + 自定义
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {allRoles.map((role) => (
                    <div key={role.id} className="relative">
                      <button
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                          selectedRole === role.id
                            ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setIsRoleExpanded(false);
                        }}
                        disabled={loading}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {role.avatar ? (
                            <img 
                              src={role.avatar} 
                              alt={role.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : null}
                          <span className="font-medium text-xs">{role.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{role.desc}</p>
                      </button>
                      {role.isCustom && (
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomRole(customRoles.find(r => r.id === role.id)!);
                            }}
                            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                            title="编辑"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomRole(role.id);
                            }}
                            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                            title="删除"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 文字输入模式 */}
          {inputMode === 'text' && (
            <div className="mt-4">
              <textarea
                className="w-full h-40 sm:h-48 p-5 border-2 border-gray-300 dark:border-gray-600 rounded-xl mb-3 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-300/30 resize-none text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm focus:shadow-md"
                placeholder="写下今天发生的事情，你的感受，或任何想说的话..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{content.length} 字</span>
              </div>
            </div>
          )}

          {/* 心情图标选择模式 */}
          {inputMode === 'icon' && (
            <div className="mt-4">
              <div className="grid grid-cols-6 gap-2">
                {MOOD_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => {
                      setSelectedIcon(icon);
                      setShowIconModal(true);
                    }}
                    className="aspect-square rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-105 transition-all flex items-center justify-center"
                    disabled={loading}
                  >
                    <span className="text-3xl">{icon}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 提交按钮（仅文字模式显示） */}
        {inputMode === 'text' && (
          <button
            className="w-full py-3.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>AI 正在分析...</span>
              </span>
            ) : (
              <span>记录</span>
            )}
          </button>
        )}

        {/* 心情图标弹窗 */}
        {showIconModal && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full shadow-xl">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{selectedIcon}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">确认记录这个心情？</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowIconModal(false);
                    setSelectedIcon('');
                  }}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitIcon}
                  className="flex-1 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>记录中...</span>
                    </span>
                  ) : (
                    '记录'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 自定义角色模态框 */}
        {showCustomRoleModal && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                {editingRole ? '编辑角色' : '创建自定义角色'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    角色头像（可选）
                  </label>
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      <div className="relative">
                        <img 
                          src={avatarPreview} 
                          alt="头像预览"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                        />
                        <button
                          onClick={() => {
                            setAvatarPreview('');
                            setNewRoleAvatar('');
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                      </div>
                    )}
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <div className="px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors bg-gray-50/50 dark:bg-gray-800/50">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {avatarPreview ? '更换头像' : '上传头像'}
                        </span>
                      </div>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    支持 JPG、PNG 格式，大小不超过 2MB
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700 focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
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
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-700 focus:ring-2 focus:ring-indigo-300/20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none transition-all"
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
                    setNewRoleAvatar('');
                    setAvatarPreview('');
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCustomRole}
                  className="flex-1 px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-all text-sm font-medium"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部提示 */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          <p>💡 提示：你的日记会自动保存，不用担心丢失</p>
        </div>
      </div>
    </MainLayout>
  );
}
