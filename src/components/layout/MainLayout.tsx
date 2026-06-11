import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#2D1B0E]">
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(201, 169, 98, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(61, 90, 84, 0.1) 0%, transparent 50%)',
        }}
      />
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-[1600px] mx-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
