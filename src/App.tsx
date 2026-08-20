import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SaaSProvider, useSaaS } from './context/SaaSContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { NotificationToast } from './components/common/NotificationToast';

import { MainLandingPage } from './components/public/MainLandingPage';
import { PricingPage } from './components/public/PricingPage';
import { ContactPage } from './components/public/ContactPage';
import { RestaurantPublicWebsite } from './components/public/RestaurantPublicWebsite';

import { CeoLogin } from './components/ceo/CeoLogin';
import { CeoDashboard } from './components/ceo/CeoDashboard';

import { OwnerLogin } from './components/owner/OwnerLogin';
import { OwnerDashboard } from './components/owner/OwnerDashboard';

import { StaffLogin } from './components/staff/StaffLogin';
import { WaiterTerminal } from './components/staff/WaiterTerminal';
import { KitchenTerminal } from './components/staff/KitchenTerminal';

import { CustomerQrApp } from './components/customer/CustomerQrApp';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40 font-bold text-2xl">
              !
            </div>
            <h1 className="text-2xl font-black text-white">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected error occurred while rendering this page. Please try reloading or scan the table QR code again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (this.props as ErrorBoundaryProps).children;
  }
}

const AppContent: React.FC = () => {
  const { activeView } = useSaaS();

  // Special full-screen views (no standard header/footer overlay needed if customer QR or Kitchen KDS)
  if (activeView === 'customer-qr') {
    return (
      <main className="min-h-screen bg-slate-950">
        <NotificationToast />
        <CustomerQrApp />
      </main>
    );
  }

  if (activeView === 'kitchen-terminal') {
    return (
      <main className="min-h-screen bg-slate-950">
        <NotificationToast />
        <KitchenTerminal />
      </main>
    );
  }

  if (activeView === 'waiter-terminal') {
    return (
      <main className="min-h-screen bg-slate-950">
        <NotificationToast />
        <WaiterTerminal />
      </main>
    );
  }

  if (activeView === 'restaurant-public' || activeView === 'public-restaurant') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
        <NotificationToast />
        <RestaurantPublicWebsite />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      <Header />
      <NotificationToast />

      <main className="flex-1">
        {(activeView === 'landing' || activeView === 'public-home') && <MainLandingPage />}
        {(activeView === 'pricing' || activeView === 'public-pricing') && <PricingPage />}
        {(activeView === 'contact' || activeView === 'public-contact') && <ContactPage />}

        {activeView === 'ceo-login' && <CeoLogin />}
        {activeView === 'ceo-dashboard' && <CeoDashboard />}

        {activeView === 'owner-login' && <OwnerLogin />}
        {activeView === 'owner-dashboard' && <OwnerDashboard />}

        {activeView === 'staff-login' && <StaffLogin />}
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SaaSProvider>
        <AppContent />
      </SaaSProvider>
    </ErrorBoundary>
  );
}
