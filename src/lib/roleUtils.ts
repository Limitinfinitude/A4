import { FIXED_ROLES, type FixedRole, type CustomRole } from './analyzeMood';
import { getCustomRoles, getCustomRole } from './customRoles';

export type Role = FixedRole | string;

/**
 * 获取角色信息（固定角色或自定义角色）
 */
export function getRoleInfo(roleId: Role): { name: string; emoji: string; description?: string } {
  // 特殊处理：名言模式
  if (roleId === 'quote') {
    return {
      name: '名言',
      emoji: '💬',
      description: '一句温暖的话语',
    };
  }

  // 检查是否是固定角色
  if (roleId in FIXED_ROLES) {
    const fixedRole = roleId as FixedRole;
    const role = FIXED_ROLES[fixedRole];
    return {
      name: role.name,
      emoji: role.emoji,
      description: role.description,
    };
  }
  
  // 检查是否是自定义角色
  const customRole = getCustomRole(roleId);
  if (customRole) {
    return {
      name: customRole.name,
      emoji: '✨',
      description: customRole.description,
    };
  }
  
  // 默认值（兼容旧数据）
  return {
    name: '未知角色',
    emoji: '❓',
  };
}

/**
 * 获取角色颜色（用于UI显示）
 */
export function getRoleColor(roleId: Role): {
  bg: string;
  text: string;
  border: string;
} {
  // 固定角色颜色
  const fixedColors: Record<FixedRole, { bg: string; text: string; border: string }> = {
    warm_mother: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-200 dark:border-pink-700',
    },
    rational_teacher: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-700',
    },
    funny_friend: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-700',
    },
    study_partner: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-700',
    },
    work_mentor: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-700',
    },
    listener: {
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-700',
    },
    growth_coach: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-700',
    },
    zen_master: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-700',
    },
  };

  if (roleId in fixedColors) {
    return fixedColors[roleId as FixedRole];
  }

  // 自定义角色使用默认颜色
  return {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  };
}

