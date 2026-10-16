import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  CheckCircle2, Circle, Plus, Loader2, Database, 
  Code2, Sparkles, Terminal, Copy, Check 
} from 'lucide-react';

interface ConvexTasksExampleProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ConvexTasksExample: React.FC<ConvexTasksExampleProps> = ({
  onClose,
  isModal = false,
}) => {
  const [taskText, setTaskText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // ---------------------------------------------------------------------------
  // STEP 4 CONVEX HOOKS INTEGRATION:
  // 1. useQuery: Automatically subscribes to real-time database changes
  // 2. useMutation: Deterministic server-side data mutations
  // ---------------------------------------------------------------------------
  const tasks = useQuery(api.tasks?.get);
  const addTask = useMutation(api.tasks?.add);
  const toggleTask = useMutation(api.tasks?.toggle);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = taskText.trim();
    if (!text || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addTask({ text });
      setTaskText('');
    } catch (err) {
      console.error('Failed to add task via Convex mutation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: any) => {
    try {
      await toggleTask({ id: taskId });
    } catch (err) {
      console.error('Failed to toggle task via Convex mutation:', err);
    }
  };

  const codeSnippet = `import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function TaskList() {
  // Real-time reactive query
  const tasks = useQuery(api.tasks.get);
  
  // Deterministic mutations
  const addTask = useMutation(api.tasks.add);
  const toggleTask = useMutation(api.tasks.toggle);

  return (
    <div>
      {tasks?.map(task => (
        <div key={task._id} onClick={() => toggleTask({ id: task._id })}>
          <input type="checkbox" checked={task.isCompleted} readOnly />
          <span>{task.text}</span>
        </div>
      ))}
      <button onClick={() => addTask({ text: "New Task" })}>Add</button>
    </div>
  );
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const containerContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              Convex Real-Time Tasks
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Backend
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live queries and mutations via <code className="text-indigo-600 font-mono text-[11px]">useQuery(api.tasks.get)</code> & <code className="text-indigo-600 font-mono text-[11px]">useMutation(api.tasks.add)</code>
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="e.g. Schedule Warsaw room inspection"
          className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={!taskText.trim() || isSubmitting}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Add Task</span>
        </button>
      </form>

      {/* Tasks List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>Active Tasks</span>
          <span>{tasks ? `${tasks.length} total` : 'Loading...'}</span>
        </div>

        {tasks === undefined ? (
          <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-xs text-slate-500">
              Connecting to Convex WebSocket backend...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">No tasks recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Add your first task above to execute a real Convex mutation.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {tasks.map((task: any) => (
              <div
                key={task._id}
                onClick={() => handleToggleTask(task._id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  task.isCompleted
                    ? 'bg-slate-50/60 border-slate-200/60 text-slate-400'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 hover:text-indigo-500 shrink-0" />
                  )}
                  <span className={`text-sm ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {task.text}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {task._creationTime ? new Date(task._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Integration Reference Box */}
      <div className="rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>React Integration Blueprint</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {copiedCode ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto p-1">
          {codeSnippet}
        </pre>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
          {containerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      {containerContent}
    </div>
  );
};
