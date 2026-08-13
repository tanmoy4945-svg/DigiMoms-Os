import React, { useState, useEffect } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Wifi, WifiOff, RefreshCw, Bell, Volume2, VolumeX, CheckCheck, Trash2, X, Sliders, Volume1, Volume2 as VolIcon } from 'lucide-react';
import { requestNotificationPermission, getNotificationPermissionState } from '../../utils/notificationService';
import { 
  isSoundEnabled, setSoundEnabled, 
  isNotificationsEnabled, setNotificationsEnabled, 
  getSoundVolume, setSoundVolume, 
  unlockAudioContext, isAudioContextSuspended, 
  playNotificationSound, runAudioDiagnosticTest 
} from '../../utils/sound';

export const RealtimeStatusBadge: React.FC = () => {
  const { 
    realtimeStatus, reconnectRealtime, showToast, 
    notifications, unreadNotificationCount, markNotificationAsRead, clearAllNotifications 
  } = useSaaS();

  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [notifsOn, setNotifsOn] = useState<boolean>(isNotificationsEnabled());
  const [volume, setVolumeState] = useState<number>(getSoundVolume());
  const [permState, setPermState] = useState(getNotificationPermissionState());
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(isAudioContextSuspended());

  useEffect(() => {
    const checkAudioState = () => {
      setAudioBlocked(isAudioContextSuspended());
    };
    checkAudioState();
    window.addEventListener('click', checkAudioState);
    window.addEventListener('touchstart', checkAudioState);
    return () => {
      window.removeEventListener('click', checkAudioState);
      window.removeEventListener('touchstart', checkAudioState);
    };
  }, []);

  const handleEnableSoundAction = () => {
    unlockAudioContext();
    setSoundEnabled(true);
    setSoundOn(true);
    setAudioBlocked(false);
    playNotificationSound('new_order', `test_enable_${Date.now()}`);
    showToast('Notification sound enabled.', 'success');
  };

  const handleToggleSound = () => {
    unlockAudioContext();
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) {
      setAudioBlocked(false);
      playNotificationSound('general', `test_toggle_${Date.now()}`);
    }
    showToast(next ? 'Notification Sounds Enabled' : 'Notification Sounds Muted', 'info');
  };

  const handleToggleNotifs = () => {
    const next = !notifsOn;
    setNotificationsEnabled(next);
    setNotifsOn(next);
    showToast(next ? 'Visual Notifications Enabled' : 'Notifications Muted', 'info');
  };

  const handleVolumeChange = (val: number) => {
    setSoundVolume(val);
    setVolumeState(val);
  };

  const handleTestDiagnosticSound = async () => {
    unlockAudioContext();
    setAudioBlocked(false);
    const result = await runAudioDiagnosticTest();
    playNotificationSound('new_order', `test_diagnostic_${Date.now()}`);
    if (result.success) {
      showToast('🔊 Notification sound test successful!', 'success');
    } else {
      showToast(`⚠️ Audio blocked by browser: ${result.message}`, 'error');
    }
  };

  const handleTestChime = () => {
    handleTestDiagnosticSound();
  };

  const handleEnablePush = async () => {
    unlockAudioContext();
    const granted = await requestNotificationPermission();
    setPermState(getNotificationPermissionState());
    if (granted) {
      showToast('Browser Push Notifications Enabled!', 'success');
    } else {
      showToast('Notification permission denied by browser settings.', 'error');
    }
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {/* Realtime Connection Status Pill */}
      <div
        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm transition-all ${
          realtimeStatus === 'connected'
            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
            : realtimeStatus === 'connecting'
            ? 'bg-amber-950/80 text-amber-400 border-amber-500/40 animate-pulse'
            : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
        }`}
        title={realtimeStatus === 'connected' ? 'Connected to Supabase Realtime orders engine' : 'Reconnecting to order stream...'}
      >
        {realtimeStatus === 'connected' ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Sync</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span>{realtimeStatus === 'connecting' ? 'Connecting...' : 'Reconnecting'}</span>
            <button
              onClick={reconnectRealtime}
              className="ml-1 p-0.5 hover:bg-slate-800 rounded text-slate-300"
              title="Manual Reconnect"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
            </button>
          </>
        )}
      </div>

      {/* Enable Sound Banner/Button if audio is blocked by browser autoplay */}
      {audioBlocked && (
        <button
          onClick={handleEnableSoundAction}
          className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 animate-bounce transition-all"
          title="Click to unlock notification sound in browser"
        >
          <Volume2 className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Enable Notification Sound</span>
        </button>
      )}

      {/* Sound Toggle Button */}
      {!audioBlocked && (
        <button
          onClick={handleToggleSound}
          className={`p-1.5 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
            soundOn
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600 hover:text-white'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title={soundOn ? 'Notification Sound ON' : 'Notification Sound MUTED'}
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span className="hidden sm:inline">{soundOn ? 'Sound On' : 'Muted'}</span>
        </button>
      )}

      {/* Test Notification Sound Button */}
      <button
        onClick={handleTestDiagnosticSound}
        className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
        title="Click to test notification sound and log audio diagnostics"
      >
        <Volume2 className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden md:inline">🔊 TEST NOTIFICATION SOUND</span>
        <span className="md:hidden">🔊 Test Sound</span>
      </button>

      {/* Settings Gear Popover Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
        title="Notification & Sound Settings"
      >
        <Sliders className="w-3.5 h-3.5" />
      </button>

      {/* Notification Bell with Unread Count Badge */}
      <button
        onClick={() => setShowDrawer(!showDrawer)}
        className="relative p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition-all"
        title="View Notifications"
      >
        <Bell className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Alerts</span>
        {unreadNotificationCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[10px] font-extrabold animate-pulse">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Push Notification Button if not granted */}
      {permState !== 'granted' && (
        <button
          onClick={handleEnablePush}
          className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold flex items-center gap-1 transition-all"
          title="Enable Background Push Notifications"
        >
          <Bell className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Enable Push</span>
        </button>
      )}

      {/* --- SOUND & NOTIFICATION SETTINGS MODAL / POPOVER --- */}
      {showSettings && (
        <div className="absolute right-0 top-10 z-50 w-80 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-xs text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Notification & Sound Settings</span>
            </h4>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Enable Sound Action Button */}
            <button
              onClick={handleEnableSoundAction}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Enable Notification Sound</span>
            </button>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-bold text-white">Visual Notifications</div>
                <div className="text-[10px] text-slate-400">Show toasts and alerts</div>
              </div>
              <button
                onClick={handleToggleNotifs}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors ${notifsOn ? 'bg-purple-600' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifsOn ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="font-bold text-white">Notification Sound</div>
                <div className="text-[10px] text-slate-400">Play chimes for events</div>
              </div>
              <button
                onClick={handleToggleSound}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors ${soundOn ? 'bg-blue-600' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundOn ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Sound Volume</span>
                <span className="font-mono text-purple-400">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume1 className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <VolIcon className="w-4 h-4 text-purple-400" />
              </div>
            </div>

            {/* Test Sound Button */}
            <button
              onClick={handleTestChime}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Chime Sound</span>
            </button>
          </div>
        </div>
      )}

      {/* --- NOTIFICATIONS LIST DRAWER / OVERLAY --- */}
      {showDrawer && (
        <div className="absolute right-0 top-10 z-50 w-80 sm:w-96 max-h-[75vh] flex flex-col p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-xs text-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Live System Alerts</span>
              {unreadNotificationCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px]">
                  {unreadNotificationCount} Unread
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllNotifications}
                className="p-1 hover:bg-rose-950 hover:text-rose-300 rounded text-slate-400 transition-all"
                title="Clear All Notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-80 space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-600" />
                <p>No system notifications yet.</p>
                <p className="text-[10px]">Live events will appear here automatically.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    n.read 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-400' 
                      : 'bg-slate-800/80 border-purple-500/40 text-slate-100 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse inline-block" />}
                      {n.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
