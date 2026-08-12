import React, { useState, useEffect } from 'react';
import { User, LogIn, UserPlus, Building, X, Check, ShieldCheck, LogOut, PlusCircle } from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getCurrentUser,
  getUserOrganizations,
  createOrganizationForUser,
} from '../services/supabase';
import { useAppStore } from '../services/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { state, switchOrganization } = useAppStore();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mode, setMode] = useState<'login' | 'signup' | 'org_setup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgCountry, setOrgCountry] = useState('Myanmar');
  const [orgCurrency, setOrgCurrency] = useState('MMK');

  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const checkAuth = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const orgs = await getUserOrganizations(user.id);
        setUserOrgs(orgs);
      }
    } catch (e) {
      console.warn('checkAuth Notice:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await signInWithEmail(email, password);

      if (res?.error) {
        setErrorMsg(res.error.message || 'Failed to sign in');
      } else if (res?.data?.user) {
        setSuccessMsg('Logged in successfully!');
        const user = res.data.user;
        setCurrentUser(user);
        const orgs = await getUserOrganizations(user.id);
        setUserOrgs(orgs);
        if (orgs.length === 0) {
          setMode('org_setup');
        } else {
          setTimeout(() => onClose(), 800);
        }
      } else {
        // Mock fallback if offline/mock auth
        const mockUser = { id: `usr_${Math.random().toString(36).substring(2, 8)}`, email: email };
        setCurrentUser(mockUser);
        setSuccessMsg(`Signed in as ${email}`);
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await signUpWithEmail(email, password, fullName);

      if (res?.error) {
        setErrorMsg(res.error.message || 'Failed to create account');
      } else if (res?.data?.user) {
        setSuccessMsg('Account created successfully! Set up your organization now.');
        const user = res.data.user;
        setCurrentUser(user);
        setMode('org_setup');
      } else {
        const mockUser = { id: `usr_${Math.random().toString(36).substring(2, 8)}`, email: email };
        setCurrentUser(mockUser);
        setSuccessMsg('Account created!');
        setMode('org_setup');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !currentUser) {
      setErrorMsg('Please enter an organization name');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const newOrg = await createOrganizationForUser(currentUser.id, {
        name: orgName.trim(),
        country: orgCountry,
        currency: orgCurrency,
      });

      if (newOrg) {
        switchOrganization(newOrg);
        setSuccessMsg(`Organization "${newOrg.name}" created!`);
        const orgs = await getUserOrganizations(currentUser.id);
        setUserOrgs(orgs);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Fallback create local org state
        switchOrganization({
          id: `org_${Math.random().toString(36).substring(2, 8)}`,
          name: orgName.trim(),
          industry: 'Retail & Electronics',
          country: orgCountry,
          currency: orgCurrency,
          timeZone: 'Asia/Yangon',
          description: 'AI Store',
          toneOfVoice: 'Friendly, professional',
          createdAt: new Date().toISOString(),
        });
        setSuccessMsg(`Organization "${orgName}" activated!`);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setCurrentUser(null);
      setUserOrgs([]);
      setSuccessMsg('Logged out.');
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    setSuccessMsg('Connected as Demo Store Owner');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#EAE5DC] rounded-2xl shadow-2xl overflow-hidden text-[#222222] animate-slide-up">
        {/* Header */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#EAE5DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full neu-gold flex items-center justify-center text-white font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#222222]">Sale Brain Account & Store Access</h3>
              <p className="text-[10px] text-[#A98C63] font-semibold">
                {currentUser ? `Signed in as ${currentUser.email}` : 'Sign in or create a business store'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-black rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> {successMsg}
            </div>
          )}

          {/* If Logged In View */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">User Account:</span>
                  <span className="font-bold text-[#222222]">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Active Store:</span>
                  <span className="font-bold text-[#A98C63]">{state.currentOrg?.name || 'Default Store'}</span>
                </div>
              </div>

              {/* Organization Switcher & List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Registered Stores</h4>
                  <button
                    onClick={() => setMode('org_setup')}
                    className="text-[11px] font-bold text-[#A98C63] hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> New Store
                  </button>
                </div>

                {userOrgs.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {userOrgs.map((org) => (
                      <div
                        key={org.id}
                        onClick={() => {
                          switchOrganization(org);
                          setSuccessMsg(`Switched to "${org.name}"`);
                        }}
                        className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center justify-between ${
                          state.currentOrg?.id === org.id
                            ? 'neu-gold text-white font-bold border-transparent shadow-sm'
                            : 'bg-[#FFFFFF] border-[#EAE5DC] hover:border-[#C5A880] text-[#222222]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{org.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/10">
                          {org.country || 'Store'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No DB organizations found for this account.</p>
                )}
              </div>

              {mode === 'org_setup' && (
                <form onSubmit={handleCreateOrg} className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[#222222]">Create Business Store</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Store / Business Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Yangon Tech Mart"
                      className="w-full mt-1 px-3 py-2 border border-[#EAE5DC] rounded-xl text-xs text-[#222222] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Country</label>
                      <input
                        type="text"
                        value={orgCountry}
                        onChange={(e) => setOrgCountry(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-[#EAE5DC] rounded-xl text-xs text-[#222222]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Currency</label>
                      <input
                        type="text"
                        value={orgCurrency}
                        onChange={(e) => setOrgCurrency(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-[#EAE5DC] rounded-xl text-xs text-[#222222]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 neu-gold text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    {loading ? 'Processing...' : 'Save Organization'}
                  </button>
                </form>
              )}

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-2.5 neu-button text-rose-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-rose-200"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            /* Logged Out Login / Signup View */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex border-b border-[#EAE5DC]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                    mode === 'login' ? 'border-[#A98C63] text-[#A98C63]' : 'border-transparent text-slate-400'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 inline mr-1" /> Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                    mode === 'signup' ? 'border-[#A98C63] text-[#A98C63]' : 'border-transparent text-slate-400'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" /> Create Account
                </button>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aung Kyaw"
                      className="w-full mt-1 px-3 py-2 border border-[#EAE5DC] rounded-xl text-xs text-[#222222] focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com"
                    className="w-full mt-1 px-3 py-2 border border-[#EAE5DC] rounded-xl text-xs text-[#222222] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full mt-1 px-3 py-2 border border-[#EAE5DC] rounded-xl text-xs text-[#222222] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 neu-gold text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="relative my-2 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#EAE5DC]"></div></div>
                <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">or</span>
              </div>

              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full py-2.5 neu-button text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 hover:border-[#C5A880]"
              >
                ⚡ Explore as Demo Store Owner
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
