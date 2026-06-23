/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Role } from '../types';
import { motion } from 'motion/react';
import { Phone, Lock, LogIn, Sparkles } from 'lucide-react';
import AflatousLogo from './AflatousLogo';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const DEFAULT_USERS = [
  {
    id: '09121111111',
    role: 'secretary' as Role,
    title: 'منشی کلینیک',
    phone: '09121111111',
    password: '123456',
    name: 'سیمین حسینی'
  },
  {
    id: '09122222222',
    role: 'manager' as Role,
    title: 'مدیریت کلینیک',
    phone: '09122222222',
    password: '123456',
    name: 'دکتر مهران افلاطوس'
  },
  {
    id: '09123333333',
    role: 'teflatus' as Role,
    title: 'تفلاطوس (دسترسی ارشد)',
    phone: '09123333333',
    password: '123456',
    name: 'تفلاطوس کبیر'
  }
];

function getSavedUsers() {
  const saved = localStorage.getItem('aflatous_users');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        DEFAULT_USERS.forEach((defUser) => {
          if (!merged.some((u) => u.phone === defUser.phone)) {
            merged.push(defUser);
          }
        });
        return merged;
      }
    } catch (e) {
      // ignore
    }
  }
  return DEFAULT_USERS;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const usersList = getSavedUsers();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('لطفاً شماره تماس و رمز عبور را وارد کنید');
      return;
    }

    const matched = usersList.find(
      (u: any) => u.phone === phone && u.password === password
    );

    if (matched) {
      onLoginSuccess({
        id: matched.phone,
        name: matched.name,
        phone: matched.phone,
        role: matched.role
      });
    } else {
      setError('شماره تماس یا رمز عبور اشتباه است (می‌توانید از حساب‌های نمایشی زیر استفاده کنید)');
    }
  };

  const handleAutofill = (user: any) => {
    setPhone(user.phone);
    setPassword(user.password || '123456');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6 text-right" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-xl p-8"
      >
        {/* Clinic branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/10 shadow-lg shadow-emerald-900/5 p-2">
            <AflatousLogo size={50} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">پنل یکپارچه افلاطوس</h1>
          <p className="text-sm text-gray-500 mt-1 font-sans">پلتفرم مدیریت لید و فروش کلینیک‌های زیبایی</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-xs mb-6 border border-red-100 font-sans leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-sans">
              شماره همراه <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲XXXXXXX"
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent transition-all font-mono animate-none"
              />
              <Phone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 font-sans">
              رمز عبور <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent transition-all font-mono"
              />
              <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#0B5F3C] hover:bg-[#0B5F3C]/90 text-white rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#0B5F3C]/15 transition-all text-sm font-sans"
          >
            <LogIn size={18} />
            ورود به سیستم
          </button>
        </form>

        {/* Demo Fast Login presets */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-xs font-semibold text-gray-400 mb-4 font-sans uppercase tracking-wider">ورود سریع با حساب‌های آزمایشی</p>
          <div className="grid grid-cols-1 gap-2">
            {usersList.map((user: any) => (
              <button
                key={user.id || user.phone}
                type="button"
                onClick={() => handleAutofill(user)}
                className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50/50 hover:bg-[#0B5F3C]/5 hover:border-[#0B5F3C]/20 rounded-xl transition-all text-right group"
              >
                <div>
                  <p className="text-xs font-bold text-gray-800 font-sans group-hover:text-[#0B5F3C]">
                    {user.name} ({user.role === 'teflatus' ? 'تفلاطوس ارشد' : user.role === 'manager' ? 'مدیر کلینیک' : 'منشی کلینیک'})
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{user.phone}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 bg-white border border-gray-200 text-gray-500 group-hover:bg-[#0B5F3C] group-hover:text-white group-hover:border-[#0B5F3C] rounded-lg font-sans transition-all">
                  انتخاب کاربر
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
