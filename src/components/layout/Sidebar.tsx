// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Building2,
  Store,
  Settings,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  {
    titulo: 'Dashboard',
    href: '/dashboards',
    icone: LayoutDashboard,
  },
  {
    titulo: 'Same Store Sales',
    href: '/dashboards/same-store-sales',
    icone: TrendingUp,
  },
  {
    titulo: 'Cobrança',
    href: '/dashboards/cobranca',
    icone: Receipt,
  },
  {
    titulo: 'ABL',
    href: '/dashboards/abl',
    icone: Building2,
  },
  {
    titulo: 'Lojas',
    href: '/dashboards/lojas',
    icone: Store,
  },
  {
    titulo: 'Importação',
    href: '/dashboards/importacao',
    icone: FileSpreadsheet,
  },
  {
    titulo: 'Auditoria',
    href: '/dashboards/auditoria',
    icone: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen bg-card border-r flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">Monte Carmo</h1>
              <p className="text-xs text-muted-foreground">Shopping BI</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboards' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.titulo : undefined}
            >
              <item.icone className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium text-sm">{item.titulo}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>Última atualização:</p>
            <p className="font-medium">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}