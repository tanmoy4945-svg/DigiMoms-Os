import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { ShieldCheck, Lock, Smartphone, Key, ArrowRight, UserCheck } from 'lucide-react';

export const CeoLogin: React.FC = () => {
  const { loginCeo, loginCeoStaffMember, setActiveView } = useSaaS();
  const [loginMode, setLoginMode] = useState<'master' | 'staff'>('master');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'master') {
      if (loginCeo(mobile, password, pin, rememberMe)) {
        setActiveView('ceo-dashboard');
      }
    } else {
      const ok = await loginCeoStaffMember(mobile, password, rememberMe);
      if (ok) {
        setActiveView('ceo-dashboard');
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-2xl rounded-full pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
            {loginMode === 'master' ? <ShieldCheck className="w-8 h-8" /> : <UserCheck className="w-8 h-8 text-amber-400" />}
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {loginMode === 'master' ? 'CEO Control Center' : 'CEO Staff / Worker Login'}
          </h1>
          <p className="text-slate-400 text-xs">
            {loginMode === 'master' 
              ? 'Super Administrator Master Authentication' 
              : 'Amazon-Style Child Access (Restricted to Assigned Permissions)'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setLoginMode('master')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'master' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Master CEO
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('staff')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'staff' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Worker / Staff
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {loginMode === 'master' ? 'CEO Mobile Number' : 'Staff / Worker Mobile Number'}
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {loginMode === 'master' ? 'CEO Master Password' : 'Staff Terminal Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder={loginMode === 'master' ? 'Enter Master Password' : 'Enter Staff Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          {loginMode === 'master' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CEO Secret Security PIN (6 Digits)</label>
              <div className="relative">
                <Key className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="Enter 6-Digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-amber-300 font-mono tracking-widest focus:border-amber-400 outline-none placeholder:text-slate-600 placeholder:tracking-normal"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-950"
              />
              <span>Remember Me on this device</span>
            </label>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
              loginMode === 'master' 
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30' 
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            {loginMode === 'master' ? 'Authenticate Master CEO' : 'Login as Staff / Worker'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            {loginMode === 'master' ? (
              <span>Are you a worker/staff member? <button onClick={() => setLoginMode('staff')} className="text-amber-400 font-bold hover:underline">Click here for Worker Login</button></span>
            ) : (
              <span>Need Master Access? <button onClick={() => setLoginMode('master')} className="text-purple-400 font-bold hover:underline">Click here for Master CEO Login</button></span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
