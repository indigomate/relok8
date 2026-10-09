import React, { useState, useEffect } from 'react';
import { 
  Bot, CheckCircle, XCircle, AlertTriangle, RefreshCw, Send, 
  Database, Mail, ShieldAlert, Cpu, Check, Activity, Search
} from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { ConvexConnectionGuide } from './ConvexConnectionGuide';

interface AdminConsoleProps {
  locale: SupportedLocale;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ locale }) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConvexGuide, setShowConvexGuide] = useState(false);

  // Live AI Tester state
  const [selectedTask, setSelectedTask] = useState<string>('parse_search');
  const [testInput, setTestInput] = useState<string>('Furnished private room in Kraków near AGH under 1800 PLN with meldunek from October');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingAI, setIsTestingAI] = useState(false);

  // Test email state
  const [testEmailTo, setTestEmailTo] = useState<string>('test@student.pw.edu.pl');
  const [testEmailStatus, setTestEmailStatus] = useState<any>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [runsRes, queueRes, emailRes, healthRes] = await Promise.all([
        fetch('/api/ai-gateway/runs?limit=30'),
        fetch('/api/ai-gateway/review-queue'),
        fetch('/api/email/status'),
        fetch('/api/health')
      ]);

      if (runsRes.ok) {
        const data = await runsRes.json();
        setRuns(data.runs || []);
      }
      if (queueRes.ok) {
        const data = await queueRes.json();
        setReviewQueue(data.items || []);
      }
      if (emailRes.ok) {
        setEmailStatus(await emailRes.json());
      }
      if (healthRes.ok) {
        setHealthStatus(await healthRes.json());
      }
    } catch (err) {
      console.error('Error fetching admin console data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResolveQueueItem = async (itemId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/ai-gateway/review-queue/${itemId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewer: 'Relok8 Admin Ops',
          final_decision: {
            resolved_at: new Date().toISOString(),
            status
          }
        })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAITest = async () => {
    setIsTestingAI(true);
    setTestResult(null);
    try {
      let parsedInput: any = testInput;
      if (selectedTask === 'parse_search') {
        parsedInput = { query: testInput };
      }

      const res = await fetch('/api/ai-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: selectedTask,
          input: parsedInput
        })
      });

      const data = await res.json();
      setTestResult(data);
      await fetchDashboardData();
    } catch (err: any) {
      setTestResult({ error: err?.message || 'Execution error' });
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) return;
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailTo,
          subject: 'Relok8 Operational Diagnostic Test',
          text: 'This is a test notification confirming email dispatch functionality on Relok8.'
        })
      });
      const data = await res.json();
      setTestEmailStatus(data);
    } catch (err: any) {
      setTestEmailStatus({ error: err.message });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const totalCost = runs.reduce((acc, r) => acc + (Number(r.cost_eur) || 0), 0);
  const avgLatency = runs.length > 0 
    ? Math.round(runs.reduce((acc, r) => acc + (r.latency_ms || 0), 0) / runs.length) 
    : 0;

  return (
    <div className="space-y-8 text-left">
      {/* Metric Cards Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>AI Operations & Review Console</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomy Ladder (Assist &rarr; Auto with audit &rarr; Autopilot)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total AI Runs
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{runs.length}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Gemini 3.8 Flash</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Review Queue
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${reviewQueue.filter(q => q.status === 'open').length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {reviewQueue.filter(q => q.status === 'open').length}
            </span>
            <span className="text-[11px] text-slate-500">pending audit</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Avg AI Latency
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{avgLatency} ms</span>
            <span className="text-[11px] text-slate-500">per task</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Est. AI Spend
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">€{totalCost.toFixed(4)}</span>
            <span className="text-[11px] text-emerald-600 font-medium">budget controlled</span>
          </div>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email Engine Status */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">Resend Transactional Email</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              emailStatus?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {emailStatus?.configured ? 'Live Mode' : 'Simulation Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {emailStatus?.hint || 'Emails log receipts in development mode; live dispatch ready with RESEND_API_KEY.'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isSendingTestEmail}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {isSendingTestEmail ? 'Sending...' : 'Test Send'}
            </button>
          </div>
          {testEmailStatus && (
            <div className="text-[11px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-200 overflow-x-auto">
              {JSON.stringify(testEmailStatus)}
            </div>
          )}
        </div>

        {/* Database & Marketplace Health */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Database & Marketplace</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Healthy
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-base font-bold text-slate-900">{healthStatus?.database?.listingsCount || 5}</span>
              <span className="text-[10px] text-slate-500">Live Listings</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-base font-bold text-slate-900">{healthStatus?.database?.inquiriesCount || 0}</span>
              <span className="text-[10px] text-slate-500">Inquiries</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-base font-bold text-slate-900">6</span>
              <span className="text-[10px] text-slate-500">Polish Cities</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              Warsaw · Kraków · Wrocław · Gdańsk · Poznań · Lublin
            </p>
            <button
              type="button"
              onClick={() => setShowConvexGuide(!showConvexGuide)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showConvexGuide ? 'Hide Convex Config' : 'Convex Setup & Variables'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Convex Connection & Variables Guide Accordion */}
      {showConvexGuide && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <ConvexConnectionGuide onClose={() => setShowConvexGuide(false)} />
        </div>
      )}

      {/* Review Queue (Slice D) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Review Queue ({reviewQueue.filter(q => q.status === 'open').length} open items)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Items flagged by the AI Gateway with confidence &lt; 90% for human audit.
            </p>
          </div>
        </div>

        {reviewQueue.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No items pending review. All recent AI operations were auto-approved or executed cleanly.
          </div>
        ) : (
          <div className="space-y-3">
            {reviewQueue.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-2xl border text-xs space-y-2.5 transition-all ${
                  item.status === 'open' 
                    ? 'bg-amber-50/50 border-amber-200' 
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{item.id}</span>
                    <span className="text-slate-500">· Type: {item.entity_type}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'open' 
                      ? 'bg-amber-200 text-amber-900' 
                      : item.status === 'approved' 
                      ? 'bg-emerald-200 text-emerald-900' 
                      : 'bg-rose-200 text-rose-900'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 overflow-x-auto">
                  Run ID: {item.ai_run_id} | Created: {new Date(item.created_at).toLocaleTimeString()}
                </div>

                {item.status === 'open' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleResolveQueueItem(item.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Decision</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveQueueItem(item.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Decision</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive AI Task Runner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Interactive AI Gateway Tester</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test gateway tasks with real prompt schemas and autonomy ladder decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Select Task</label>
            <select
              value={selectedTask}
              onChange={(e) => {
                setSelectedTask(e.target.value);
                if (e.target.value === 'extract_listing') {
                  setTestInput('Studio on Rakowiecka near SGH Warsaw. 2400 PLN rent, 450 czynsz. Deposit 2850 PLN. Meldunek allowed. Available Oct 15.');
                } else if (e.target.value === 'moderate_listing') {
                  setTestInput('{"title": "Cheap room", "monthly_rent_pln": 300, "description": "Pay wire to foreign IBAN directly"}');
                } else if (e.target.value === 'parse_search') {
                  setTestInput('Furnished private room in Kraków near AGH under 1800 PLN with meldunek from October');
                } else if (e.target.value === 'translate') {
                  setTestInput('Cesja umowy najmu wymaga pisemnej zgody wynajmującego.');
                } else if (e.target.value === 'draft_reply') {
                  setTestInput('{"message": "Can I see the room tomorrow evening?", "sender": "Student"}');
                } else if (e.target.value === 'parse_consent_reply') {
                  setTestInput('Zgadzam się na cesję umowy na nowego studenta pod warunkiem terminowej wpłaty kaucji.');
                }
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="parse_search">parse_search (Natural Search &rarr; Chips)</option>
              <option value="extract_listing">extract_listing (Notes &rarr; Validated Fields)</option>
              <option value="moderate_listing">moderate_listing (Scam & Safety Audit)</option>
              <option value="translate">translate (PL &harr; EN Tenancy Terms)</option>
              <option value="draft_reply">draft_reply (Tenant-Host Replies)</option>
              <option value="parse_consent_reply">parse_consent_reply (Landlord KC 509 Approval)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Test Input</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                type="button"
                onClick={handleRunAITest}
                disabled={isTestingAI}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {isTestingAI ? 'Running...' : 'Execute'}
              </button>
            </div>
          </div>
        </div>

        {testResult && (
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>Decision: <strong className="text-white">{testResult.run?.decision}</strong></span>
              <span>Confidence: <strong className="text-white">{testResult.run?.confidence}</strong></span>
              <span>Latency: <strong className="text-white">{testResult.run?.latency_ms} ms</strong></span>
              <span>Cost: <strong className="text-white">€{testResult.run?.cost_eur}</strong></span>
            </div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.run?.output || testResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* AI Runs Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Recent AI Execution Audit Logs ({runs.length})</span>
        </h3>

        {runs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No runs logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Task</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Cost</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {runs.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{r.id.slice(0, 12)}...</td>
                    <td className="py-2.5 px-3 text-slate-700">{r.task}</td>
                    <td className="py-2.5 px-3">{Math.round((r.confidence || 0) * 100)}%</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.decision === 'auto_approved' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : r.decision === 'needs_review' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{r.latency_ms} ms</td>
                    <td className="py-2.5 px-3 text-slate-500">€{r.cost_eur}</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(r.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
