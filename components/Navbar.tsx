'use client';

import Link from 'next/link';
import { Shield, Map, Users, LayoutDashboard, Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { name: 'Coordination Map', href: '/map', icon: Map },
    { name: 'NGO Registry', href: '/registry', icon: Users },
    { name: 'Intelligence', href: '/intelligence', icon: LayoutDashboard },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, protected: true },
    { name: 'Log Activity', href: '/programme/new', icon: Shield, protected: true },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 mr-8">
              <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-white rounded-sm" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display whitespace-nowrap">
                WHITESPACE
              </span>
            </Link>
          </div>

          {/* Desktop Nav - Hidden on smaller screens to prevent breaking */}
          <div className="hidden lg:flex items-center gap-x-8 whitespace-nowrap">
            {navLinks.filter(link => !link.protected || user).map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-slate-600 hover:text-emerald-600 font-medium transition-colors flex items-center gap-2"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Hamburger Menu Button - Visible on lg and below if content is tight, but here we force it below lg */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.filter(link => !link.protected || user).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-4 text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-md flex items-center gap-3"
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              <div className="pt-4">
                {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full text-center text-red-600 font-medium py-3"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
