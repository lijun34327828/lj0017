import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Camera, History, Settings, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/workbench', label: '工作台', icon: Camera },
    { path: '/history', label: '历史记录', icon: History },
  ];

  return (
    <nav className="bg-[#1a1008]/95 backdrop-blur-md border-b border-[#C9A962]/20 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9A962] to-[#8B7355] flex items-center justify-center shadow-lg shadow-[#C9A962]/20">
              <Image className="w-5 h-5 text-[#2D1B0E]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#F5EDE0]" style={{ fontFamily: "'Playfair Display', serif" }}>
                老照片修复工作室
              </h1>
              <p className="text-xs text-[#C9A962]/70">AI 智能修复 · 重现珍贵回忆</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === '/workbench' && location.pathname === '/');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#C9A962]/20 text-[#C9A962]'
                      : 'text-[#F5EDE0]/70 hover:text-[#F5EDE0] hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-[#F5EDE0]/70 hover:text-[#F5EDE0] hover:bg-white/5 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3D5A54] to-[#2D4A44] flex items-center justify-center text-[#F5EDE0] text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
