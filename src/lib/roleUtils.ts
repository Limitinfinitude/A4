import { FIXED_ROLES, type FixedRole, type CustomRole } from './analyzeMood';
import { getCustomRoles, getCustomRole } from './customRoles';

export type Role = FixedRole | string;

/**
 * 获取角色信息（固定角色或自定义角色）
 */
export function getRoleInfo(roleId: Role): { name: string; emoji: string; avatar?: string; description?: string } {
  // 特殊处理：图标记录模式
  if (roleId === 'quote') {
    return {
      name: '图标记录',
      emoji: '💬',
      avatar: '/avatars/default.png',
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
      avatar: role.avatar,
      description: role.description,
    };
  }
  
  // 检查是否是自定义角色
  const customRole = getCustomRole(roleId);
  if (customRole) {
    return {
      name: customRole.name,
      emoji: '✨',
      avatar: customRole.avatar || '/avatars/default.png',
      description: customRole.description,
    };
  }
  
  // 默认值（兼容旧数据）
  return {
    name: '未知角色',
    emoji: '❓',
    avatar: '/avatars/default.png',
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
  // 固定角色颜色（匹配原神角色主题色）
  const fixedColors: Record<FixedRole, { bg: string; text: string; border: string }> = {
    warm_companion: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-700',
    },
    rational_analyst: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-700',
    },
    encouraging_supporter: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-700',
    },
    practical_advisor: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-700',
    },
    accepting_listener: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200 dark:border-cyan-700',
    },
    perspective_shifter: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-700',
    },
    problem_solver: {
      bg: 'bg-slate-50 dark:bg-slate-900/20',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
    },
    growth_guide: {
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

