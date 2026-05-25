'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Map, MessageSquare, LogOut, Globe, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'

const links = [
  { href: '/dashboard', label: 'Leads', icon: LayoutDashboard },
  { href: '/scrape/maps', label: 'Google Maps', icon: Map },
  { href: '/scrape/reddit', label: 'Reddit', icon: MessageSquare },
]

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
  }

  const NavLinks = () => (
    <div className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
              active
                ? 'bg-[#0ea5e9] text-black'
                : 'text-slate-400 hover:bg-white/8 hover:text-white'
            }`}
            style={{ transition: 'background 0.15s, color 0.15s' }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-52 border-r border-white/10 h-screen p-4 gap-1 fixed top-0 left-0 overflow-y-auto" style={{ background: '#080d18' }}>
        <div className="flex items-center gap-2.5 px-3 py-3 mb-5 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center border border-[#0ea5e9]/20">
            <Globe className="w-4 h-4 text-[#0ea5e9]" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wide uppercase">Fast Websites</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Leads</p>
          </div>
        </div>

        <NavLinks />

        <div className="mt-auto pt-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full text-left"
            style={{ transition: 'background 0.15s, color 0.15s' }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 z-50" style={{ background: '#080d18' }}>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#0ea5e9]" />
          <span className="text-sm font-bold text-white uppercase tracking-wide">Fast Websites</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-white/10 text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile backdrop */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className="md:hidden fixed top-0 left-0 h-full w-60 z-50 flex flex-col border-r border-white/10"
        style={{ background: '#080d18', transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.22s cubic-bezier(0.25,1,0.5,1)' }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0ea5e9]" />
            <span className="text-sm font-bold text-white uppercase tracking-wide">Fast Websites</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t border-white/10 p-3">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full text-left">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
