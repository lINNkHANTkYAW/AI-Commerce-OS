import React, { useState } from 'react';
import { Store, Palette, Package, FileText, Bot, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../services/store';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { state, switchOrganization } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);

  const [bizName, setBizName] = useState('NovaTech Myanmar');
  const [industry, setIndustry] = useState('Electronics Retail');
  const [country, setCountry] = useState('Myanmar');
  const [currency, setCurrency] = useState('MMK');
  const [tone, setTone] = useState('Friendly, tech-savvy, professional');

  const handleFinish = () => {
    switchOrganization({
      ...state.currentOrg,
      name: bizName,
      industry,
      country,
      currency,
      toneOfVoice: tone,
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#222222] flex items-center justify-center p-6">
      <div className="max-w-xl w-full neu-flat rounded-2xl p-6 shadow-md space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#A98C63]" />
            <h2 className="font-bold text-sm text-[#222222]">Business Onboarding Wizard</h2>
          </div>
          <span className="text-xs text-[#A98C63] font-mono font-bold">Step {currentStep} of 5</span>
        </div>

        {/* Step 1: Business Profile */}
        {currentStep === 1 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-[#222222]">Step 1: Business Profile</h3>
            <div>
              <label className="block text-slate-600 mb-1">Business Name</label>
              <div className="neu-inset rounded-lg p-2.5">
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full bg-transparent text-[#222222] font-semibold focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Industry</label>
                <div className="neu-inset rounded-lg p-2.5">
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-transparent text-[#222222] font-semibold focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Currency</label>
                <div className="neu-inset rounded-lg p-2.5">
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-transparent text-[#222222] font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Brand Identity */}
        {currentStep === 2 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-[#222222]">Step 2: Brand Identity & Voice</h3>
            <div>
              <label className="block text-slate-600 mb-1">Tone of Voice</label>
              <div className="neu-inset rounded-lg p-2.5">
                <textarea
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-[#222222] focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Products */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-[#222222]">Step 3: Catalogue & Products</h3>
            <p className="text-slate-600 leading-relaxed">
              We have prefilled 7 high-demand electronics items for <strong>NovaTech Myanmar</strong> including Student Laptop Lite, Laptop Pro, Wireless Mouse, and Accessories.
            </p>
            <div className="p-3 neu-inset rounded-xl text-emerald-800 font-mono font-bold">
              ✅ 7 Products ready for sales agent tool calls!
            </div>
          </div>
        )}

        {/* Step 4: Business Policies */}
        {currentStep === 4 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-[#222222]">Step 4: Policies & FAQs</h3>
            <p className="text-slate-600 leading-relaxed">KBZPay, WavePay, COD Yangon, and 1-Year Hardware Warranty policies configured.</p>
          </div>
        )}

        {/* Step 5: AI Configuration */}
        {currentStep === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-base text-[#222222]">Step 5: Action-Taking AI Guardrails</h3>
            <div className="space-y-2 text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Auto-reply mode enabled with strict tool validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Human approval enforced for discounts & order cancellations</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#EAE5DC]">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              className="px-4 py-2 neu-button rounded-xl text-xs font-semibold text-[#222222]"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="px-5 py-2 neu-gold text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span>Next</span> <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition"
            >
              <span>Launch AI Commerce OS</span> <Sparkles className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
