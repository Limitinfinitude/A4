'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { getCustomRoles } from '@/lib/customRoles';

type MoodRecord = {
  id: number;
  content: string;
  role: string;
  roleSnapshot?: {
    name: string;
    emoji: string;
    description?: string;
  };
  feedback: {
    keyWords: string[];
    emotionTag: string;
    feedback: string;
    slogan: string;
  };
  createTime: string;
};

type BackupData = {
  version: string;
  exportTime: string;
  moodHistory: MoodRecord[];
  customRoles: Array<{
    id: string;
    name: string;
    description: string;
  }>;
};

export default function SettingsPage() {
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown'>('json');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // 导出为 JSON
  const handleExportJSON = () => {
    try {
      const history = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
      const customRoles = getCustomRoles();

      const backupData: BackupData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        moodHistory: history,
        customRoles: customRoles,
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mood-mirror-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败：' + (error as Error).message);
    }
  };

  // 导出为 Markdown
  const handleExportMarkdown = () => {
    try {
      const history = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
      const customRoles = getCustomRoles();

      let markdown = `# Mood Mirror 数据备份\n\n`;
      markdown += `**导出时间**：${new Date().toLocaleString('zh-CN')}\n\n`;
      markdown += `**记录总数**：${history.length}\n`;
      markdown += `**自定义角色数**：${customRoles.length}\n\n`;
      markdown += `---\n\n`;

      // 自定义角色
      if (customRoles.length > 0) {
        markdown += `## 自定义角色\n\n`;
        customRoles.forEach((role) => {
          markdown += `### ${role.name}\n\n`;
          markdown += `- **ID**：\`${role.id}\`\n`;
          markdown += `- **描述**：${role.description}\n\n`;
        });
        markdown += `---\n\n`;
      }

      // 情绪记录
      markdown += `## 情绪记录\n\n`;
      history.forEach((record, index) => {
        const date = new Date(record.createTime);
        const roleInfo = record.roleSnapshot || { name: '未知角色', emoji: '❓' };
        
        markdown += `### 记录 #${index + 1}\n\n`;
        markdown += `**时间**：${date.toLocaleString('zh-CN')}\n\n`;
        markdown += `**角色**：${roleInfo.emoji} ${roleInfo.name}\n\n`;
        markdown += `**情绪标签**：${record.feedback.emotionTag}\n\n`;
        
        if (record.feedback.keyWords.length > 0) {
          markdown += `**关键词**：${record.feedback.keyWords.join('、')}\n\n`;
        }
        
        markdown += `**内容**：\n\n${record.content}\n\n`;
        
        if (record.feedback.feedback) {
          markdown += `**AI 反馈**：\n\n${record.feedback.feedback}\n\n`;
        }
        
        if (record.feedback.slogan) {
          markdown += `**治愈金句**：\n\n> ${record.feedback.slogan}\n\n`;
        }
        
        markdown += `---\n\n`;
      });

      const dataBlob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mood-mirror-backup-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败：' + (error as Error).message);
    }
  };

  // 导入数据
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backupData: BackupData = JSON.parse(text);

        // 验证数据格式
        if (!backupData.moodHistory || !Array.isArray(backupData.moodHistory)) {
          throw new Error('无效的备份文件格式');
        }

        // 确认导入
        const confirmMessage = `即将导入 ${backupData.moodHistory.length} 条记录和 ${backupData.customRoles?.length || 0} 个自定义角色。\n\n这将覆盖当前所有数据，确定要继续吗？`;
        if (!confirm(confirmMessage)) {
          setImportStatus('idle');
          // 重置文件输入
          event.target.value = '';
          return;
        }

        // 导入数据
        localStorage.setItem('mood_history', JSON.stringify(backupData.moodHistory));
        
        if (backupData.customRoles && backupData.customRoles.length > 0) {
          localStorage.setItem('mood_custom_roles', JSON.stringify(backupData.customRoles));
        }

        setImportStatus('success');
        setImportMessage(`成功导入 ${backupData.moodHistory.length} 条记录！`);
        
        // 重置文件输入
        event.target.value = '';
        
        // 2秒后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        setImportStatus('error');
        setImportMessage('导入失败：' + (error as Error).message);
        // 重置文件输入
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // 清空所有数据
  const handleClearAll = () => {
    if (confirm('⚠️ 警告：此操作将删除所有数据，包括情绪记录和自定义角色，且无法恢复！\n\n确定要继续吗？')) {
      localStorage.removeItem('mood_history');
      localStorage.removeItem('mood_custom_roles');
      localStorage.removeItem('mood_draft');
      localStorage.removeItem('mood_draft_icon');
      localStorage.removeItem('mood_draft_mode');
      alert('所有数据已清空');
      router.push('/');
    }
  };

  const history = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
  const customRoles = getCustomRoles();

  return (
    <MainLayout>
      <div className="py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
          数据备份与恢复
        </h1>

        {/* 数据统计 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总记录数</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{history.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">自定义角色</p>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{customRoles.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">存储大小</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {(JSON.stringify(history).length + JSON.stringify(customRoles).length).toLocaleString()} 字符
            </p>
          </div>
        </div>

        {/* 导出功能 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>💾</span>
            导出数据
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            将你的情绪记录和自定义角色导出为文件，方便备份和迁移。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                导出格式
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    exportFormat === 'json'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  JSON 格式
                </button>
                <button
                  onClick={() => setExportFormat('markdown')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    exportFormat === 'markdown'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Markdown 格式
                </button>
              </div>
            </div>

            <button
              onClick={exportFormat === 'json' ? handleExportJSON : handleExportMarkdown}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={history.length === 0}
            >
              {exportFormat === 'json' ? '📥 导出为 JSON' : '📥 导出为 Markdown'}
            </button>

            {history.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                暂无数据可导出
              </p>
            )}
          </div>
        </div>

        {/* 导入功能 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📤</span>
            导入数据
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            从之前导出的 JSON 文件恢复数据。⚠️ 注意：导入会覆盖当前所有数据！
          </p>

          <div className="space-y-4">
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <div
                onClick={() => document.getElementById('import-file')?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
              >
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  点击选择 JSON 备份文件
                </span>
              </div>
            </label>

            {importStatus === 'success' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                <p className="text-green-700 dark:text-green-300">{importMessage}</p>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                <p className="text-red-700 dark:text-red-300">{importMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* 危险操作 */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-red-200 dark:border-red-700">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-4 flex items-center gap-2">
            <span>⚠️</span>
            危险操作
          </h2>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            以下操作将永久删除数据，且无法恢复。请谨慎操作！
          </p>
          <button
            onClick={handleClearAll}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            清空所有数据
          </button>
        </div>

        {/* 返回按钮 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

