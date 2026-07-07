/**
 * TestConnectionStep — Steps 3–5: test result → select tables → review.
 * The orchestrator drives which sub-phase is shown via `phase`.
 */
import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  RefreshCw,
  ArrowRight,
  Loader2,
  Plug,
  Database,
} from 'lucide-react';
import { ModalShell } from './AddConnectionWizardMain';

interface TestResult {
  success: boolean;
  message: string;
  tables?: string[];
}

interface Props {
  phase: 'test' | 'select-tables' | 'review';
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onRetry: () => void;
  testing: boolean;
  testResult: TestResult | null;
  selectedTables: Set<string>;
  onToggleTable: (table: string) => void;
  name: string;
  selectedType: string | null;
  config: Record<string, string>;
  onFinish: () => void;
}

export function TestConnectionStep({
  phase,
  onClose,
  onBack,
  onNext,
  onRetry,
  testing,
  testResult,
  selectedTables,
  onToggleTable,
  name,
  selectedType,
  config,
  onFinish,
}: Props) {
  const tables = testResult?.tables ?? [];

  if (phase === 'test') {
    return (
      <ModalShell onClose={onClose} title="Test Connection" step={2} totalSteps={4}>
        <div className="space-y-4">
          {testing ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-3" />
              <p className="text-white font-semibold">Testing connection...</p>
              <p className="text-xs text-[#6e684a] mt-1">
                {selectedType === 'postgresql' || selectedType === 'mysql'
                  ? `Connecting to ${config.host}:${config.port}`
                  : `Connecting to ${config.baseUrl ?? config.shopUrl ?? config.storeUrl}`}
              </p>
            </div>
          ) : testResult ? (
            <div
              className={`flex flex-col items-center py-6 text-center ${
                testResult.success ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-12 h-12 mb-3" />
              ) : (
                <XCircle className="w-12 h-12 mb-3" />
              )}
              <p className="text-white font-semibold text-base">{testResult.message}</p>
              {testResult.success && testResult.tables && (
                <p className="text-xs text-[#6e684a] mt-1">
                  Found {testResult.tables.length} tables in{' '}
                  {config.database ?? 'database'}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <XCircle className="w-10 h-10 text-yellow-400 mb-3" />
              <p className="text-white font-semibold">No test attempted</p>
              <p className="text-xs text-[#6e684a] mt-1">
                Go back and click "Test Connection" first
              </p>
            </div>
          )}
        </div>

        {!testing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {testResult?.success ? (
              <button
                onClick={onNext}
                disabled={!testResult.tables}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                Select Tables <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onRetry}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            )}
          </div>
        )}
      </ModalShell>
    );
  }

  if (phase === 'select-tables') {
    const toggleTable = (t: string) => onToggleTable(t);

    return (
      <ModalShell onClose={onClose} title="Expose Tables" step={3} totalSteps={4}>
        <div className="space-y-3">
          <p className="text-xs text-[#6e684a]">
            Choose which tables your chatbot can query.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tables.map(table => {
              const isSelected = selectedTables.has(table);
              return (
                <button
                  key={table}
                  onClick={() => toggleTable(table)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${
                      isSelected ? 'bg-yellow-400 border-yellow-400' : 'border-[#3d3823]'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                  </div>
                  <Database className="w-4 h-4 text-[#6e684a] shrink-0" />
                  <span
                    className={`text-sm font-mono ${
                      isSelected ? 'text-white' : 'text-[#6e684a]'
                    }`}
                  >
                    {table}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedTables.size === 0 && (
            <p className="text-xs text-center text-[#6e684a] py-2">
              Select at least one table to continue
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={onNext}
            disabled={selectedTables.size === 0}
            className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            Review <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </ModalShell>
    );
  }

  // phase === 'review'
  return (
    <ModalShell onClose={onClose} title="Review Connection" step={4} totalSteps={4}>
      <div className="space-y-4">
        <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Connection name</span>
            <span className="text-sm text-white font-semibold">{name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Type</span>
            <span className="text-sm text-white">{selectedType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Status</span>
            <span className="text-sm text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e684a]">Tables exposed</span>
            <span className="text-sm text-white">{selectedTables.size}</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
            Exposed Tables
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedTables).map(t => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-xs bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] px-2.5 py-1 rounded-full font-mono"
              >
                <Database className="w-3 h-3 text-[#6e684a]" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {(selectedType === 'postgresql' || selectedType === 'mysql') && (
          <div>
            <p className="text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-1.5">
              Connection String
            </p>
            <p className="text-xs font-mono text-[#6e684a] bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2 truncate">
              {selectedType}://{config.username}@{config.host}:{config.port}/
              {config.database}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onFinish}
          disabled={!name.trim()}
          className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          <Plug className="w-4 h-4" /> Add Connection
        </button>
      </div>
    </ModalShell>
  );
}
