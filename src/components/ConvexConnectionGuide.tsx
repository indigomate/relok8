import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check, 
  RefreshCw, Terminal, Key, ShieldCheck, Zap, Server, Send, ArrowRight
} from 'lucide-react';
import { 
  getActiveConvexUrl, 
  isConvexConfigured, 
  setCustomConvexUrl, 
  clearCustomConvexUrl, 
  testConvexConnection,
  useConvex 
} from '../lib/convex/client';

interface ConvexConnectionGuideProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ConvexConnectionGuide: React.FC<ConvexConnectionGuideProps> = ({ 
  onClose,
  isModal = false 
}) => {
  const convex = useConvex();
  const [activeUrl, setActiveUrl] = useState<string>(getActiveConvexUrl());
  const [isConfigured, setIsConfigured] = useState<boolean>(isConvexConfigured());
  const [inputUrl, setInputUrl] = useState<string>(getActiveConvexUrl());
  
  // Test diagnostic state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    endpoint?: string;
  } | null>(null);

  // Copied feedback states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Re-sync on custom URL events
  useEffect(() => {
    const handleUrlChange = () => {
      const url = getActiveConvexUrl();
      setActiveUrl(url);
      setIsConfigured(isConvexConfigured());
      setInputUrl(url);
    };
    window.addEventListener('relok8_convex_url_changed', handleUrlChange);
    return () => window.removeEventListener('relok8_convex_url_changed', handleUrlChange);
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTestConnection = async (target?: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConvexConnection(target || inputUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to ping Convex endpoint',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveUrl = async () => {
    const clean = inputUrl.trim();
    if (!clean) {
      clearCustomConvexUrl();
      setActiveUrl('');
      setIsConfigured(false);
      setTestResult(null);
      return;
    }
    setCustomConvexUrl(clean);
    setActiveUrl(clean);
    setIsConfigured(isConvexConfigured());
    await handleTestConnection(clean);
  };

  const handleResetToEnv = () => {
    clearCustomConvexUrl();
    const envUrl = getActiveConvexUrl();
    setActiveUrl(envUrl);
    setInputUrl(envUrl);
    setIsConfigured(isConvexConfigured());
    setTestResult(null);
  };

  const variableDocs = [
    {
      name: 'VITE_CONVEX_URL',
      category: 'Frontend / Client (Vite)',
      required: true,
      example: 'https://swift-otter-412.convex.cloud',
      description: 'The live client endpoint used by ConvexReactClient and reactive useQuery/useMutation hooks in the browser.',
      where: 'Root `.env` or in the input field above',
    },
    {
      name: 'CONVEX_DEPLOYMENT',
      category: 'Convex CLI / Build',
      required: true,
      example: 'dev:swift-otter-412',
      description: 'Generated automatically by `npx convex dev`. Tells the Convex CLI which cloud deployment to push schemas and functions to.',
      where: 'Root `.env.local` or `.env`',
    },
    {
      name: 'STRIPE_SECRET_KEY',
      category: 'Convex Backend Action',
      required: false,
      example: 'sk_test_51... or sk_live_51...',
      description: 'Used in `convex/payments.ts` for Stripe manual capture escrow holds (149 PLN EarlyLock base + optional add-on packs).',
      where: 'Convex Dashboard -> Settings -> Environment Variables',
    },
    {
      name: 'WHATSAPP_TOKEN',
      category: 'Convex Backend Action',
      required: false,
      example: 'EAAG...',
      description: 'Meta WhatsApp Cloud API token used in `convex/whatsapp.ts` to push interactive lease approvals with quick reply buttons.',
      where: 'Convex Dashboard -> Settings -> Environment Variables',
    },
    {
      name: 'WHATSAPP_PHONE_NUMBER_ID',
      category: 'Convex Backend Action',
      required: false,
      example: '109827364512345',
      description: 'Phone number ID registered under Meta WhatsApp Cloud API for dispatching landlord notifications.',
      where: 'Convex Dashboard -> Settings -> Environment Variables',
    },
    {
      name: 'GEMINI_API_KEY',
      category: 'Convex Backend Action',
      required: false,
      example: 'AIzaSy...',
      description: 'Powers zero-tenant-effort AI Proxy queries, campus proximity calculations, and listing embedding matching in `convex/aiMessages.ts`.',
      where: 'Convex Dashboard -> Settings -> Environment Variables',
    },
  ];

  return (
    <div className="bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Database className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Convex Engine Configuration</h2>
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  v2.0 PropTech
                </span>
              </div>
              <p className="text-sm text-emerald-100 mt-0.5">
                Real-time reactive backend for 15-minute EarlyLock atomic holds, Stripe escrow & AI proxy.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Current Status Pills */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/70 block font-medium">Connection Mode</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-sm font-semibold">
                {isConfigured ? 'Live Convex Cloud' : 'Local Deterministic Engine'}
              </span>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/70 block font-medium">Active Deployment URL</span>
            <span className="text-sm font-mono truncate block mt-1 text-emerald-200" title={activeUrl || 'Not set'}>
              {activeUrl ? activeUrl.replace('https://', '') : 'Local Reactive Fallback (No URL)'}
            </span>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/70 block font-medium">Reactive Listings Count</span>
            <span className="text-sm font-semibold block mt-1">
              {convex.db.listings.length} verified listings in memory
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Step-by-Step Connection Instructions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">How to Connect Convex in 3 Simple Steps</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step A */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-emerald-200 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Step A: Initialize</span>
                <Terminal className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 mb-3">
                In your terminal, run the Convex dev command to initialize or link your deployment:
              </p>
              <div className="flex items-center justify-between bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono">
                <span>npx convex dev</span>
                <button
                  onClick={() => handleCopy('npx-dev', 'npx convex dev')}
                  className="text-slate-400 hover:text-white transition"
                  title="Copy command"
                >
                  {copiedKey === 'npx-dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Follow the browser prompt to log in at <strong>dashboard.convex.dev</strong>.
              </p>
            </div>

            {/* Step B */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-emerald-200 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Step B: Copy URL</span>
                <ExternalLink className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Convex CLI will print your Deployment URL, or find it in your dashboard under <strong>Settings &gt; URL</strong>:
              </p>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-3 py-2 text-xs font-mono truncate">
                https://&lt;your-project&gt;.convex.cloud
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Format: <code className="font-mono text-emerald-700">https://*.convex.cloud</code>
              </p>
            </div>

            {/* Step C */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-emerald-200 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Step C: Connect</span>
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Paste your URL in the input field below to connect immediately, or add it to your <strong>.env</strong> file.
              </p>
              <div className="bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-xs font-mono truncate flex items-center justify-between">
                <span>VITE_CONVEX_URL=...</span>
                <button
                  onClick={() => handleCopy('vite-env', 'VITE_CONVEX_URL="https://your-deployment-name.convex.cloud"')}
                  className="text-slate-400 hover:text-white transition"
                  title="Copy variable template"
                >
                  {copiedKey === 'vite-env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Takes effect instantly without rebuilding!
              </p>
            </div>
          </div>
        </section>

        {/* Live URL Input & Diagnostic Tester */}
        <section className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Direct In-App URL Connection & Health Check</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Test and connect your live Convex deployment directly in this browser session. If no URL is supplied, Relok8 seamlessly runs on its deterministic local Convex reactive engine so every feature remains 100% operational.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://swift-otter-412.convex.cloud"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Connect &amp; Test
              </button>

              <button
                onClick={() => handleTestConnection(inputUrl)}
                disabled={isTesting || !inputUrl}
                className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                Ping
              </button>

              {activeUrl && (
                <button
                  onClick={handleResetToEnv}
                  className="px-3 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 text-xs rounded-xl transition"
                  title="Reset to environment variable"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Test Diagnostic Result */}
          {testResult && (
            <div
              className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block">{testResult.message}</span>
                {testResult.endpoint && (
                  <span className="font-mono text-[11px] opacity-80 mt-0.5 block">
                    Endpoint tested: {testResult.endpoint}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Variables Breakdown Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">All Environment Variables Explained</h3>
            </div>
            <button
              onClick={() => {
                const sampleEnv = `# Convex Engine Variables
VITE_CONVEX_URL="https://your-deployment-name.convex.cloud"
CONVEX_DEPLOYMENT="dev:your-deployment-name"
STRIPE_SECRET_KEY="sk_test_..."
WHATSAPP_TOKEN="EAAG..."
WHATSAPP_PHONE_NUMBER_ID="123456789"
GEMINI_API_KEY="..."`;
                handleCopy('all-env', sampleEnv);
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              {copiedKey === 'all-env' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copy All Variables Template
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Variable Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Where to Set</th>
                  <th className="p-3">Function / Role</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {variableDocs.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.required && (
                          <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{item.category}</td>
                    <td className="p-3 text-slate-700 font-medium">{item.where}</td>
                    <td className="p-3 text-slate-600 max-w-xs">{item.description}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleCopy(item.name, `${item.name}="${item.example}"`)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-mono text-[11px]"
                        title="Copy variable assignment"
                      >
                        {copiedKey === item.name ? <Check className="w-3 h-3 text-emerald-600 inline" /> : 'Copy'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CLI Helper Commands */}
        <section className="bg-slate-900 text-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold">Useful Convex CLI Commands</h4>
            </div>
            <span className="text-[11px] text-slate-400">Run in workspace root</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px] block">Start Local Convex Dev Loop</span>
                <span className="text-emerald-300">npx convex dev</span>
              </div>
              <button
                onClick={() => handleCopy('cmd-dev', 'npx convex dev')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd-dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px] block">Deploy Functions &amp; Schema to Production</span>
                <span className="text-emerald-300">npx convex deploy</span>
              </div>
              <button
                onClick={() => handleCopy('cmd-deploy', 'npx convex deploy')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd-deploy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between md:col-span-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Set Remote Action Environment Variables</span>
                <span className="text-emerald-300">npx convex env set STRIPE_SECRET_KEY=sk_test_...</span>
              </div>
              <button
                onClick={() => handleCopy('cmd-env', 'npx convex env set STRIPE_SECRET_KEY=sk_test_... GEMINI_API_KEY=...')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'cmd-env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </section>

        {/* Real-time Feature Guarantee */}
        <section className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950">
            <span className="font-bold block mb-1">Zero-Downtime Deterministic Guarantee</span>
            <p className="leading-relaxed">
              Whether you are running against a live Convex Cloud deployment or locally in development, Relok8’s Convex engine ensures 100% full functionality: real-time 15-minute EarlyLock atomic holds, cross-tab multi-user synchronization, Stripe manual capture escrow reservations (149 PLN hold), and WhatsApp landlord approvals are fully reactive and testable.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
