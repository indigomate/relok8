import React, { useState, useEffect } from 'react';
import { Relok8User, UserRole } from '../types/relok8';
import { getDevUsers, getActiveUserId, setActiveUserId, updateUserAvailability } from '../lib/api';
import { UserCheck, Shield, ChevronUp, ChevronDown, Moon, Sun, Check, Sparkles, X } from 'lucide-react';

interface DevRoleSwitcherProps {
  onUserChanged?: (user: Relok8User) => void;
}

export const DevRoleSwitcher: React.FC<DevRoleSwitcherProps> = ({ onUserChanged }) => {
  // Hide in production builds per Section 11
  if (import.meta.env.PROD) {
    return null;
  }

  const [isHidden, setIsHidden] = useState(() => {
    try {
      return localStorage.getItem('r8_dev_switcher_hidden') === 'true';
    } catch {
      return false;
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      const stored = localStorage.getItem('r8_dev_switcher_minimized');
      return stored !== null ? stored === 'true' : true; // Default minimized
    } catch {
      return true;
    }
  });
  const [users, setUsers] = useState<Relok8User[]>([]);
  const [activeId, setActiveId] = useState<string>(getActiveUserId());
  const [activeUser, setActiveUser] = useState<Relok8User | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await getDevUsers();
      setUsers(data);
      const current = data.find((u) => u.id === activeId) || data[0];
      if (current) {
        setActiveUser(current);
        if (onUserChanged) onUserChanged(current);
      }
    } catch (err) {
      console.warn('Failed to fetch dev users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeId]);

  const handleSelectUser = (user: Relok8User) => {
    setActiveId(user.id);
    setActiveUserId(user.id);
    setActiveUser(user);
    if (onUserChanged) onUserChanged(user);
    window.dispatchEvent(new CustomEvent('relok8_user_switched', { detail: user }));
  };

  const handleToggleAvailability = async () => {
    if (!activeUser) return;
    try {
      const updated = await updateUserAvailability(!activeUser.isAvailable, activeUser.quietHours);
      setActiveUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      if (onUserChanged) onUserChanged(updated);
    } catch (err) {
      console.warn('Failed to update availability:', err);
    }
  };

  const handleSetMinimized = (val: boolean) => {
    setIsMinimized(val);
    try {
      localStorage.setItem('r8_dev_switcher_minimized', String(val));
    } catch {}
  };

  const handleDismiss = () => {
    setIsHidden(true);
    try {
      localStorage.setItem('r8_dev_switcher_hidden', 'true');
    } catch {}
  };

  if (isHidden) return null;
  if (!activeUser) return null;

  const roleBadgeColors: Record<UserRole, string> = {
    prospect: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tenant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    landlord: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  if (isMinimized) {
    return (
      <aside
        aria-label="Developer role simulation controls"
        className="fixed bottom-20 md:bottom-4 left-3 md:left-4 z-40 select-none text-left font-sans group"
      >
        <div className="relative inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSetMinimized(false)}
            className="w-10 h-10 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center p-0.5 hover:scale-105 transition-transform cursor-pointer relative"
            title={`Simulating ${activeUser.name} (${activeUser.role}) - Click to switch role`}
          >
            <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full rounded-full object-cover" />
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              activeUser.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
            }`} />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 shadow-xs cursor-pointer"
            title="Hide dev switcher"
            aria-label="Hide dev switcher"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Developer role simulation controls"
      className="fixed bottom-20 md:bottom-4 left-3 md:left-4 z-40 select-none text-left font-sans"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-xs transition-all">
        {/* Header bar */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2 bg-slate-50 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                <span className="truncate">{activeUser.name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border shrink-0 ${roleBadgeColors[activeUser.role]}`}>
                  {activeUser.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">{activeUser.email}</div>
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleAvailability}
              className={`px-1.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                activeUser.isAvailable
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-100 border-slate-300 text-slate-500'
              }`}
              title={activeUser.isAvailable ? "You are Available (Onlo steps back after 2m)" : "Unavailable (Onlo covers immediately)"}
            >
              {activeUser.isAvailable ? 'Available' : 'Away'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              aria-label="Expand role switcher"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleSetMinimized(true)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer text-[10px] font-bold"
              title="Minimize to avatar icon"
              aria-label="Minimize"
            >
              —
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title="Close dev switcher"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dropdown panel to switch between Anna, Mr Nowak, Mateo, Priya */}
        {isOpen && (
          <div className="p-2 space-y-1 bg-white divide-y divide-slate-100 animate-in fade-in duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Switch role / user (Seed data)
            </div>
            <div className="space-y-1 pt-1">
              {users.map((u) => {
                const isCurrent = u.id === activeUser.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      handleSelectUser(u);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isCurrent ? 'bg-indigo-50/70 border border-indigo-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${roleBadgeColors[u.role]}`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{u.university || u.email}</div>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="p-2 text-[10px] text-slate-500 leading-tight">
              Test multi-user perspectives in Lublin:
              <br />
              • <strong>Anna</strong>: Current tenant (Exit flow, Rewards, Place room)
              <br />
              • <strong>Mr Nowak</strong>: Landlord (Approval, Checklist, Rules)
              <br />
              • <strong>Mateo / Priya</strong>: Prospects (Messaging & Onlo)
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
