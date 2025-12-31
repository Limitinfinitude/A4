import type { CustomRole } from './analyzeMood';

const CUSTOM_ROLES_STORAGE_KEY = 'mood_custom_roles';

/**
 * 获取所有自定义角色
 */
export function getCustomRoles(): CustomRole[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CUSTOM_ROLES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * 保存自定义角色
 */
export function saveCustomRole(role: CustomRole): void {
  if (typeof window === 'undefined') return;
  const roles = getCustomRoles();
  const index = roles.findIndex(r => r.id === role.id);
  if (index >= 0) {
    roles[index] = role;
  } else {
    roles.push(role);
  }
  localStorage.setItem(CUSTOM_ROLES_STORAGE_KEY, JSON.stringify(roles));
}

/**
 * 删除自定义角色
 */
export function deleteCustomRole(id: string): void {
  if (typeof window === 'undefined') return;
  const roles = getCustomRoles();
  const filtered = roles.filter(r => r.id !== id);
  localStorage.setItem(CUSTOM_ROLES_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 获取自定义角色
 */
export function getCustomRole(id: string): CustomRole | undefined {
  const roles = getCustomRoles();
  return roles.find(r => r.id === id);
}

