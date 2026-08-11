import React, { useState } from 'react';
import { Header } from './components/Header';
import { SidebarNav, NavTab } from './components/SidebarNav';
import { OverviewDashboard } from './components/OverviewDashboard';
import { UnifiedInbox } from './components/UnifiedInbox';
import { CustomerCRM } from './components/CustomerCRM';
import { ProductInventory } from './components/ProductInventory';
import { OrderManagement } from './components/OrderManagement';
import { CampaignAutopilot } from './components/CampaignAutopilot';
import { ContentCalendar } from './components/ContentCalendar';
import { ApprovalCenter } from './components/ApprovalCenter';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { ChannelSimulator } from './components/ChannelSimulator';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { OnboardingWizard } from './components/OnboardingWizard';
import { CustomerChatWidget } from './components/CustomerChatWidget';
import { useAppStore } from './services/store';

export default function App() {
  const { state } = useAppStore();
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
  };

  const handleRunDemoScenario = () => {
    setActiveTab('campaigns');
  };

  return (
    <div className="h-screen w-screen bg-[#FAF8F5] text-[#222222] flex flex-col font-sans overflow-hidden selection:bg-[#C5A880]/30 selection:text-[#222222]">
      {/* Top Header */}
      <Header
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onNavigateTab={(tab) => handleSelectTab(tab as NavTab)}
      />

      {/* Main Container with Sticky/Fixed Left Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sticky/Fixed Sidebar */}
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onRunDemoScenario={handleRunDemoScenario}
        />

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto min-w-0 p-2 sm:p-4">
          {(activeTab === 'overview') && <OverviewDashboard onNavigateTab={(tab) => handleSelectTab(tab as NavTab)} />}
          {(activeTab === 'inbox') && <UnifiedInbox onNavigateTab={(tab) => handleSelectTab(tab as NavTab)} />}
          {(activeTab === 'crm' || activeTab === 'customers') && <CustomerCRM />}
          {(activeTab === 'products') && <ProductInventory />}
          {(activeTab === 'orders') && <OrderManagement />}
          {(activeTab === 'campaigns') && <CampaignAutopilot onNavigateTab={(tab) => handleSelectTab(tab as NavTab)} />}
          {(activeTab === 'calendar') && <ContentCalendar />}
          {(activeTab === 'approvals') && <ApprovalCenter />}
          {(activeTab === 'analytics') && <AnalyticsDashboard />}
          {(activeTab === 'simulator') && <ChannelSimulator />}
          {(activeTab === 'settings') && <SettingsPanel />}
        </main>
      </div>

      {/* Slide-over Business Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onNavigateTab={(tab) => handleSelectTab(tab as NavTab)}
      />

      {/* Floating Live Customer Chat Widget */}
      <CustomerChatWidget />
    </div>
  );
}


