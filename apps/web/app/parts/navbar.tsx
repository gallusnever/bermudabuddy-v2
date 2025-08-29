"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@bermuda/ui';
import { useState, useEffect, useRef } from 'react';
import { budTips } from '../../components/bud-says';
import { useAuth } from '../../contexts/auth-context';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: 'Gauge' },
  { href: '/yard-state', label: 'Yard State', icon: 'LawnLeaf' },
  { href: '/mix', label: 'Mix Builder', icon: 'Beaker' },
  { href: '/ok-to-spray', label: 'OK to Spray', icon: 'Wind' },
  { href: '/applications', label: 'Applications', icon: 'Layers' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function NavBar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Account menu state
  const isAuthed = !!user;
  const onboardingComplete = !!(user && profile?.nickname);
  const userNickname = profile?.nickname || '';
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    
    if (menuOpen || profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, profileOpen]);
  
  // Handle scroll detection with hysteresis to prevent bouncing
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          setScrolled(prev => {
            // Add hysteresis: different thresholds for scrolling down vs up
            if (!prev && currentScrollY > 120) {
              // Scrolling down - need to pass 120px to trigger
              return true;
            } else if (prev && currentScrollY < 80) {
              // Scrolling up - need to go below 80px to untrigger
              return false;
            }
            // No change if within the hysteresis zone
            return prev;
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Auto-cycle tips when scrolled
  useEffect(() => {
    if (!scrolled) return;
    
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % budTips.general.length);
    }, 8000); // Change tip every 8 seconds
    
    return () => clearInterval(interval);
  }, [scrolled]);
  
  return (
    <header className="sticky top-0 z-40 will-change-auto">
      {/* Full header when not scrolled */}
      <div 
        className={`relative transition-all duration-500 ease-in-out transform-gpu ${
          scrolled ? 'h-20' : 'h-48'
        }`}
        style={{
          backgroundImage: 'url(/bermudaheader.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: scrolled ? 'center 85%' : 'center 75%',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Gradient overlay for better readability */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          scrolled 
            ? 'bg-gradient-to-b from-black/60 to-black/80' 
            : 'bg-gradient-to-b from-black/30 via-transparent to-black/40'
        }`} />
        
        {/* Logo - properly centered and animated */}
        <Link href="/" className={`absolute z-50 transition-all duration-500 ease-in-out ${
          scrolled 
            ? 'left-4 sm:left-6 top-1/2 -translate-y-1/2' 
            : 'left-4 sm:left-10 top-1/2 -translate-y-1/2'
        }`}>
          <div className={`relative flex items-center justify-center transition-all duration-500 ${
            scrolled ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-28 h-28 sm:w-44 sm:h-44'
          }`}>
            {/* Black circle background */}
            <div className="absolute inset-0 rounded-full bg-black/70 backdrop-blur-sm border-2 border-white/30 shadow-2xl" />
            {/* Logo properly sized to fit within circle - adjusted position */}
            <img 
              src="/bud-logo.png" 
              alt="Bermuda Buddy" 
              className={`object-contain z-10 drop-shadow-2xl transition-all duration-500 ${
                scrolled ? 'h-10 sm:h-12 w-auto' : 'h-28 sm:h-48 w-auto'
              }`}
              style={{
                transform: scrolled ? 'translateY(-9px)' : 'translateY(-23px)'
              }}
            />
          </div>
        </Link>
        
        {/* Bud Says - only show when scrolled */}
        {scrolled && (
          <div className="absolute left-24 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 max-w-[70vw] sm:max-w-md transition-all duration-500 animate-in fade-in slide-in-from-left-2">
            <img 
              src="/bud-close.png" 
              alt="Bud" 
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className="text-xs text-emerald-400 font-medium">Bud says:</div>
              <div className="text-xs text-white/90 leading-tight">
                {budTips.general[tipIndex % budTips.general.length]}
              </div>
            </div>
            <div className="flex flex-col">
              <button 
                onClick={() => setTipIndex(prev => (prev + 1) % budTips.general.length)}
                className="text-xs px-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                aria-label="Next tip"
              >
                ↻
              </button>
            </div>
          </div>
        )}
        
        {/* Right side menu and profile - animated position */}
        <div className={`absolute right-6 transition-all duration-500 flex items-center gap-3 ${
          scrolled ? 'top-1/2 -translate-y-1/2' : 'top-6'
        }`}>
          {/* Profile button - always show; content depends on auth */}
          <div ref={profileRef} className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className={`
                relative z-50 px-3 py-2 rounded-lg transition-all
                ${profileOpen 
                  ? 'bg-green-700/80 border-green-500/50' 
                  : 'bg-black/50 border-white/20 hover:bg-black/60'
                }
                backdrop-blur-sm border shadow-lg
              `}
              aria-label="Account menu"
            >
              <div className="flex items-center gap-2">
                <Icons.User className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white max-w-[120px] truncate">
                  {userNickname || 'Account'}
                </span>
              </div>
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                <div className="bg-black/90 backdrop-blur-lg border border-white/10 rounded-lg">
                  {isAuthed && (
                    <div className="p-3 border-b border-white/10">
                      <p className="text-xs text-gray-400">Logged in as</p>
                      <p className="text-sm font-medium text-white truncate">{userNickname || 'User'}</p>
                    </div>
                  )}
                  <nav className="py-2">
                    {isAuthed ? (
                      <>
                        <Link 
                          href="/settings" 
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-white hover:bg-white/10 transition-all"
                        >
                          <Icons.Settings className="w-4 h-4" />
                          <span className="text-sm">Settings</span>
                        </Link>
                        <Link 
                          href="/profile" 
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-white hover:bg-white/10 transition-all"
                        >
                          <Icons.User className="w-4 h-4" />
                          <span className="text-sm">Edit Profile</span>
                        </Link>
                        <div className="border-t border-white/10 my-1" />
                        <button 
                          onClick={async () => {
                            await signOut();
                            localStorage.removeItem('bb_onboarding_complete');
                            localStorage.removeItem('bb_onboarding');
                            window.location.href = '/';
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-900/20 transition-all w-full text-left"
                        >
                          <Icons.LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link 
                          href="/login" 
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-white hover:bg-white/10 transition-all"
                        >
                          <Icons.User className="w-4 h-4" />
                          <span className="text-sm">Sign In</span>
                        </Link>
                        <Link 
                          href="/onboarding" 
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-white hover:bg-white/10 transition-all"
                        >
                          <Icons.UserPlus className="w-4 h-4" />
                          <span className="text-sm">Start Setup</span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </div>
            )}
          </div>
          
          {/* Main menu button */}
          <div ref={menuRef} className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className={`
              relative z-50 px-4 py-2 rounded-lg transition-all
              ${menuOpen 
                ? 'bg-emerald-700/80 border-emerald-500/50' 
                : 'bg-black/50 border-white/20 hover:bg-black/60'
              }
              backdrop-blur-sm border shadow-lg
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg text-white">{menuOpen ? '✕' : '☰'}</span>
              <span className={`font-medium text-white transition-all duration-500 ${
                scrolled ? 'text-sm' : 'text-sm'
              }`}>Menu</span>
            </div>
          </button>
            
            {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
              <div className="bg-black/90 backdrop-blur-lg border border-white/10 rounded-lg">
                <nav className="py-2">
                  {!onboardingComplete ? (
                    // Show only onboarding links if not complete
                    <>
                      <Link 
                        href="/onboarding" 
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-emerald-400 bg-emerald-900/30 border-l-4 border-emerald-500 transition-all"
                      >
                        <Icons.UserPlus size="sm" />
                        <span className="font-medium">Complete Setup</span>
                      </Link>
                      <div className="px-4 py-3 text-xs text-gray-400">
                        You must complete onboarding to access other features
                      </div>
                    </>
                  ) : (
                    // Show full menu if onboarding is complete
                    <>
                      {links.map((link) => {
                        const Icon = Icons[link.icon as keyof typeof Icons];
                        const active = isActive(pathname, link.href);
                        
                        return (
                          <Link 
                            key={link.href}
                            href={link.href} 
                            onClick={() => setMenuOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-3 transition-all
                              ${active 
                                ? 'bg-emerald-900/30 text-emerald-400 border-l-4 border-emerald-500' 
                                : 'text-white hover:bg-white/10 border-l-4 border-transparent'
                              }
                            `}
                          >
                            <Icon size="sm" />
                            <span className="font-medium">{link.label}</span>
                            {active && (
                              <span className="ml-auto text-xs">Current</span>
                            )}
                          </Link>
                        );
                      })}
                      
                      <div className="border-t border-white/10 my-2" />
                      
                      <Link 
                        href="/mix/print" 
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-all border-l-4 border-transparent"
                      >
                        <span className="text-base">🖨️</span>
                        <span className="font-medium">Print Garage Sheet</span>
                      </Link>
                    </>
                  )}
                  
                  <div className="px-4 py-2 mt-2 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <img src="/bud-close.png" alt="Bud" className="w-6 h-6 rounded-full" />
                      <span className="text-xs text-emerald-400 italic">Bud says:</span>
                    </div>
                    <p className="text-xs text-white/70 italic">
                      "Navigate like you mow - with purpose and direction."
                    </p>
                  </div>
                </nav>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
