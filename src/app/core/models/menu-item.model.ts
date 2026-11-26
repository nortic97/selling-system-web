export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route: string;
  badge?: string;
  badgeClass?: string;
  requiredPermission?: string;
  children?: MenuItem[];
}

export interface MenuGroup {
  groupName?: string;
  items: MenuItem[];
}
