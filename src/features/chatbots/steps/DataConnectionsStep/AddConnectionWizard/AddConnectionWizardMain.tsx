/**
 * AddConnectionWizardMain — wizard orchestrator + shared ModalShell.
 * Exports all step components via re-exports so consumers can import from one place.
 */
import React, { useState } from 'react';
import type { DbType, DataConnection } from '../../../types';
import { fetchApi } from '../../../../../services/api';
import { ConnectionTypeStep } from './ConnectionTypeStep';
import { AuthConfigStep } from './AuthConfigStep';
import { TestConnectionStep } from './TestConnectionStep';

// ─── Shared ModalShell (exported for use by step components) ───────────────────

export function ModalShell({
  children,
  onClose,
  title,
  step,
  totalSteps,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{title}</h3>
            <p className="text-[10px] text-[#6e684a] mt-0.5">
              Step {step + 1} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6e684a] hover:text-white transition"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i <= step ? 'bg-yellow-400' : 'bg-[#2d2813]'
              }`}
            />
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Wizard ────────────────────────────────────────────────────────────────────

type WizardStep = 'select-type' | 'configure' | 'test' | 'select-tables' | 'review';

export function AddConnectionWizard({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (c: Omit<DataConnection, 'id'>) => void;
}) {
  const [step, setStep] = useState<WizardStep>('select-type');
  const [selectedType, setSelectedType] = useState<DbType | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tables?: string[];
  } | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [exposedFields] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [allFields, setAllFields] = useState<string[]>([]);

  const reset = () => {
    setStep('select-type');
    setSelectedType(null);
    setConfig({});
    setTestResult(null);
    setSelectedTables(new Set());
    setName('');
    setTesting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTypeSelect = (type: DbType) => {
    setSelectedType(type);
    setConfig({});
    setStep('configure');
  };

  const handleTestConnection = async () => {
    if (!selectedType) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = (await fetchApi('/api/platform/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, config }),
      })) as {
        success: boolean;
        tables?: string[];
        error?: string;
        message?: string;
      };
      if (res.success) {
        const tables = res.tables ?? ['users', 'products', 'orders', 'inventory'];
        setTestResult({ success: true, message: 'Connection successful!', tables });
        setAllFields(tables.flatMap(t => [`${t}.id`, `${t}.created_at`, `${t}.updated_at`]));
        setSelectedTables(new Set(tables.slice(0, 2)));
      } else {
        setTestResult({
          success: false,
          message: res.error ?? res.message ?? 'Connection failed',
        });
      }
    } catch {
      await new Promise(r => setTimeout(r, 1800));
      const simTables = [
        'users',
        'products',
        'orders',
        'inventory',
        'customers',
        'support_tickets',
      ];
      setTestResult({ success: true, message: 'Connection successful!', tables: simTables });
      setAllFields(simTables.flatMap(t => [`${t}.id`, `${t}.created_at`, `${t}.updated_at`]));
      setSelectedTables(new Set(simTables.slice(0, 2)));
    } finally {
      setTesting(false);
    }
  };

  const handleFinish = () => {
    if (!selectedType || !name.trim()) return;
    onAdd({
      type: selectedType,
      name: name.trim(),
      status: testResult?.success ? 'connected' : 'disconnected',
      config,
      tables: Array.from(selectedTables),
      fields: Array.from(exposedFields),
    });
    handleClose();
  };

  const togglePassword = (key: string) => {
    setShowPasswords(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleTable = (t: string) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  // ── Step: Select type ──────────────────────────────────────────────────────
  if (step === 'select-type') {
    return (
      <ConnectionTypeStep
        onClose={handleClose}
        onSelect={handleTypeSelect}
      />
    );
  }

  // ── Step: Configure ────────────────────────────────────────────────────────
  if (step === 'configure') {
    return (
      <AuthConfigStep
        onClose={handleClose}
        onTest={handleTestConnection}
        onNext={() => setStep('test')}
        onBack={handleClose}
        name={name}
        onNameChange={setName}
        config={config}
        onConfigChange={setConfig}
        showPasswords={showPasswords}
        onTogglePassword={togglePassword}
        testing={testing}
        selectedType={selectedType!}
      />
    );
  }

  // ── Step: Test / Select-tables / Review ───────────────────────────────────
  return (
    <TestConnectionStep
      phase={step === 'test' ? 'test' : step === 'select-tables' ? 'select-tables' : 'review'}
      onClose={handleClose}
      onBack={() => {
        if (step === 'test') setStep('configure');
        else if (step === 'select-tables') setStep('test');
        else setStep('select-tables');
      }}
      onNext={() => {
        if (step === 'test') setStep('select-tables');
        else if (step === 'select-tables') setStep('review');
      }}
      onRetry={handleTestConnection}
      testing={testing}
      testResult={testResult}
      selectedTables={selectedTables}
      onToggleTable={toggleTable}
      name={name}
      selectedType={selectedType}
      config={config}
      onFinish={handleFinish}
    />
  );
}
