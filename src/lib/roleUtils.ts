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
  // 固定角色颜色（橙，蓝，黄，绿，紫，彩，灰，棕）
  const fixedColors: Record<FixedRole, { bg: string; text: string; border: string }> = {
    warm_companion: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-400 dark:border-orange-500', // 橙 - 温暖陪伴者
    },
    rational_analyst: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-400 dark:border-blue-500', // 蓝 - 理性分析师
    },
    encouraging_supporter: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-400 dark:border-yellow-500', // 黄 - 鼓励支持者
    },
    practical_advisor: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-400 dark:border-green-500', // 绿 - 实用建议者
    },
    accepting_listener: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-400 dark:border-purple-500', // 紫 - 加强边框
    },
    perspective_shifter: {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-400 dark:border-pink-500', // 彩（粉色/彩虹色） - 加强边框
    },
    problem_solver: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-400 dark:border-gray-500', // 灰 - 加强边框
    },
    growth_guide: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-400 dark:border-amber-500', // 棕（琥珀色） - 加强边框
    },
  };

  if (roleId in fixedColors) {
    return fixedColors[roleId as FixedRole];
  }

  // 8种主题色定义（橙，蓝，黄，绿，紫，彩，灰，棕）
  const colorPalette: Record<string, { bg: string; text: string; border: string }> = {
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-400 dark:border-orange-500' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-400 dark:border-blue-500' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-400 dark:border-yellow-500' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-400 dark:border-green-500' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-400 dark:border-purple-500' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-400 dark:border-pink-500' },
    gray: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-400 dark:border-gray-500' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-400 dark:border-amber-500' },
  };

  // 检查是否是自定义角色，并尝试获取其颜色设置
  const customRole = getCustomRole(roleId);
  if (customRole && customRole.color && customRole.color in colorPalette) {
    return colorPalette[customRole.color];
  }
  
  // 如果没有设置颜色或颜色无效，根据角色ID生成稳定的哈希值，确保同一角色总是相同颜色
  const colorKeys = Object.keys(colorPalette);
  let hash = 0;
  for (let i = 0; i < roleId.length; i++) {
    hash = ((hash << 5) - hash) + roleId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const colorIndex = Math.abs(hash) % colorKeys.length;
  
  return colorPalette[colorKeys[colorIndex]];
}

