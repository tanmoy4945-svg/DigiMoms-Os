import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { ChefHat, Smartphone, Lock, ArrowRight } from 'lucide-react';

export const StaffLogin: React.FC = () => {
  const { loginStaff, setActiveView } = useSaaS();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = loginStaff(mobile, password);
    if (staff) {
      if (staff.role === 'kitchen') {
        setActiveView('kitchen-terminal');
      } else {
        setActiveView('waiter-terminal');
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 blur-2xl rounded-full pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Staff Terminal Login</h1>
          <p className="text-slate-400 text-xs">
            Enter mobile & password provided by your restaurant owner
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Mobile Number</label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                placeholder="Enter Staff Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
          >
            Access Staff Terminal <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
