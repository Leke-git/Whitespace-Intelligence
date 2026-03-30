'use client';

import Link from 'next/link';
import { BrandLoader } from './BrandLoader';
import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'About Us', href: '/about' },
      { name: 'Intelligence Hub', href: '/map' },
      { name: 'NGO Registry', href: '/registry' },
      { name: 'Methodology', href: '/methodology' },
    ],
    resources: [
      { name: 'News & Updates', href: '/news' },
      { name: 'Resource Library', href: '/resources' },
      { name: 'Partner With Us', href: '/partner' },
      { name: 'Donate', href: '/partner#donate' },
      { name: 'FAQ', href: '/about#faq' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Use', href: '/terms' },
    ],
  };

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <BrandLoader size="sm" variant="dots" isStatic={true} />
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display uppercase group-hover:text-emerald-600 transition-colors">
                Whitespace
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Nigeria&apos;s central intelligence platform for NGO coordination, 
              resource optimization, and humanitarian impact tracking.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="mailto:hello@whitespace.org" className="text-slate-400 hover:text-emerald-600 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Resources</h4>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 hover:text-emerald-600 text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs">
            © {currentYear} Whitespace NGO Registry. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            Built with <Heart className="w-3 h-3 text-red-500 fill-current" /> for Nigeria
          </div>
        </div>
      </div>
    </footer>
  );
}
