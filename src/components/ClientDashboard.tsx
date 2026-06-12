import React, { useState, useEffect } from 'react';
import { Client, Instance, ApiKey, Transaction } from '../types';
import { 
  Plus, 
  Smartphone, 
  Radio, 
  Phone, 
  User, 
  Activity, 
  QrCode, 
  X, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Key,
  Copy,
  Check,
  Terminal,
  Trash2,
  Code,
  ArrowRight,
  Send,
  History,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientDashboardProps {
  client: Client;
  instances: Instance[];
  onUpdateClient: (updatedClient: Client) => void;
  onAddInstance: (newInst: Omit<Instance, 'id' | 'lastActive'>) => void;
  onDeleteInstance: (id: string) => void;
  onUpdateInstanceStatus: (id: string, status: 'Connected' | 'Connecting' | 'Disconnected') => void;
  onAddSystemLog: (message: string, source: string, level: any) => void;
  onLogout: () => void;
}

const MESSAGES_PER_KSH = 5; // 1 Ksh = 5 Messages -> 1 msg = 0.20 Ksh
const MINIMUM_SPEND_KSH = 20; // 100 messages

export default function ClientDashboard({
  client,
  instances,
  onUpdateClient,
  onAddInstance,
  onDeleteInstance,
  onUpdateInstanceStatus,
  onAddSystemLog,
  onLogout
}: ClientDashboardProps) {
  
  // Tab control inside Client Portal
  const [clientTab, setClientTab] = useState<'token-store' | 'instances' | 'api-keys' | 'api-access' | 'sandbox' | 'billing'>('token-store');

  // Input states for Buying Tokens (Token Store)
  const [customMessagesCount, setCustomMessagesCount] = useState<number>(1000);
  const [spendAmount, setSpendAmount] = useState<number>(200); // 1000 msgs / 5 = 200 KSH
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>(client.phone !== '—' ? client.phone : '254712345678');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showDarajaModal, setShowDarajaModal] = useState(false);
  const [mpesaPinSim, setMpesaPinSim] = useState('');
  const [pinError, setPinError] = useState('');

  // Internal keys because App.tsx might store keys globally for layout but Client Portal handles its own keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "key-internal-1",
      name: "Corporate CRM Live Hook",
      key: "evo_live_pk_8b2d41fc7a892f39281a179cbe87",
      created: "2026-06-11",
      lastUsed: "Just now",
      status: "Active"
    }
  ]);

  // Instance creation state
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');

  // Api Key creation state
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // QR Code Simulator Modal States
  const [pairingInstance, setPairingInstance] = useState<Instance | null>(null);
  const [pairingQR, setPairingQR] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);

  // Sandbox Test Tool State
  const [sandboxSelectedInstance, setSandboxSelectedInstance] = useState<string>('');
  const [sandboxDestinationPhone, setSandboxDestinationPhone] = useState<string>('254712345678');
  const [sandboxMessage, setSandboxMessage] = useState<string>('Hello! This is a secure testing notification via Evolution WhatsApp Gateway and Safaricom networks.');
  const [sandboxSending, setSandboxSending] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<string>('');

  // Handle message allocation typing
  const handleMessagesChange = (count: number) => {
    setCustomMessagesCount(count);
    setSpendAmount(count / MESSAGES_PER_KSH);
  };

  // Trigger payment authorization
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (spendAmount < MINIMUM_SPEND_KSH) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowDarajaModal(true);
    }, 1200);
  };

  const handleConfirmMpesaPinSim = () => {
    if (mpesaPinSim.length !== 4) {
      setPinError('Please enter a valid 4-digit mobile banking M-Pesa PIN.');
      return;
    }
    
    setShowDarajaModal(false);
    
    // Generate valid random transaction code like KST9X3J1K
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let reference = 'MPX';
    for (let i = 0; i < 7; i++) {
      reference += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      reference,
      amount: spendAmount,
      tokens: customMessagesCount,
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Success',
      phone: userPhoneNumber
    };

    const updatedClient: Client = {
      ...client,
      tokenBalance: (client.tokenBalance || 0) + customMessagesCount,
      transactions: [newTx, ...(client.transactions || [])]
    };

    onUpdateClient(updatedClient);
    onAddSystemLog(
      `Prepaid package acquired: +${customMessagesCount.toLocaleString()} outbox messages added to tenant ${client.name} via Daraja MPESA reference ${reference}`,
      'Billing Orchestrator',
      'SUCCESS'
    );

    setMpesaPinSim('');
    setPinError('');
  };

  const handleCreateInstance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;
    
    onAddInstance({
      name: newInstanceName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''),
      phone: '—',
      status: 'Connecting',
      client: client.name,
    });

    setNewInstanceName('');
    setShowNewInstanceModal(false);
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const shortHash = Math.random().toString(16).substring(2, 10);
    const freshKey: ApiKey = {
      id: `key-int-${Date.now()}`,
      name: newKeyName,
      key: `evo_live_pk_${shortHash}${Math.random().toString(16).substring(2, 12)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'Active',
    };

    setApiKeys((prev) => [freshKey, ...prev]);
    onAddSystemLog(
      `Generated secret live API Token: '${newKeyName}' generated under developer client lease.`,
      'Credential Core',
      'SUCCESS'
    );

    setNewKeyName('');
    setShowNewKeyModal(false);
  };

  const handleCopyKey = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2050);
  };

  const handleRevokeKey = (id: string, name: string) => {
    if (confirm(`Are you sure you want to completely revoke credentials for "${name}"? This decision is irreversible.`)) {
      setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'Revoked' as const } : k));
      onAddSystemLog(
        `Revoked key transmission lease for '${name}'. Security token destroyed.`,
        'Credential Core',
        'ERROR'
      );
    }
  };

  // Begin pairing QR
  const handleBeginPairing = (inst: Instance) => {
    setPairingInstance(inst);
    setGeneratingQR(true);
    setTimeout(() => {
      setGeneratingQR(false);
      setPairingQR(`evolution_qr_lease_${inst.id}_${Math.random().toString(36).substring(7)}`);
    }, 1000);
  };

  const handleSimulateSuccessfulScan = () => {
    if (!pairingInstance) return;
    onUpdateInstanceStatus(pairingInstance.id, 'Connected');
    setPairingInstance(null);
    setPairingQR('');
  };

  const handleSendSandboxMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxSelectedInstance || !sandboxDestinationPhone.trim() || !sandboxMessage.trim()) return;

    setSandboxSending(true);
    setSandboxResponse('');

    setTimeout(() => {
      const hasTokens = (client.tokenBalance || 0) > 0;
      setSandboxSending(false);
      
      if (hasTokens) {
        // Decrement balance by 1 token
        const updatedClient: Client = {
          ...client,
          tokenBalance: Math.max(0, (client.tokenBalance || 0) - 1)
        };
        onUpdateClient(updatedClient);
        
        onAddSystemLog(
          `Evolution client sandbox dispatch success under instance '${sandboxSelectedInstance}' directly over Safaricom port 443`,
          'REST Gateway',
          'SUCCESS'
        );

        setSandboxResponse(JSON.stringify({
          status: "SUCCESS",
          statusCode: 200,
          id: `msg_lease_${Math.random().toString(36).substring(7).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          data: {
            phone: sandboxDestinationPhone.trim(),
            instance: sandboxSelectedInstance,
            queued: true,
            networkCarrier: "Safaricom-KE",
            decrementedQuota: 1
          }
        }, null, 2));
      } else {
        setSandboxResponse(JSON.stringify({
          status: "ERROR",
          statusCode: 402,
          error: "Payment Required",
          message: "Outbox Token quota completely exhausted. Please purchase additional tokens inside the developer Token Store."
        }, null, 2));
      }
    }, 1100);
  };

  // Filter instances belonging specifically to this client
  const clientInstances = instances.filter(i => i.client === client.name);

  return (
    <div className="space-y-6">
      
      {/* Enterprise Portal banner card with gold accent gradient */}
      <div className="bg-gradient-to-r from-forest-deep via-[#111108] to-stone-900 border border-[#2d2b14] p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#eab308]/10 text-yellow-400 border border-[#eab308]/20 text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full">
                Developer Client Workspace
              </span>
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Welcome, {client.name}
            </h1>
            <p className="text-xs text-stone-300 max-w-xl font-medium">
              Oversee custom multi-device container processes, acquire Lipa Na M-Pesa token leases, and secure bearer API keys.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#1f1d0b] border border-yellow-500/10 p-4 rounded-2xl flex flex-col items-center md:items-end min-w-[140px]">
              <span className="text-[10px] text-yellow-500/80 font-mono font-bold uppercase tracking-wider">
                Outbox Quota Bank
              </span>
              <span className="text-2xl font-black font-mono text-yellow-400 my-0.5">
                {(client.tokenBalance || 0).toLocaleString()}
              </span>
              <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider">
                Remaining Messages
              </span>
            </div>

            <button
              onClick={onLogout}
              className="px-3 py-4 text-xs font-bold text-gray-400 hover:text-white bg-stone-900/40 border border-stone-800 rounded-2xl hover:bg-stone-800 focus:outline-none transition-colors h-full flex items-center"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Internal Client Portal Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white border border-[#eaebe4] p-1.5 rounded-2xl shadow-xs">
        <button
          onClick={() => setClientTab('token-store')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all focus:outline-none ${
            clientTab === 'token-store'
              ? 'bg-forest-deep text-white shadow-sm'
              : 'text-stone-600 hover:text-black hover:bg-stone-50'
          }`}
        >
          Token Store
        </button>
        <button
          onClick={() => setClientTab('instances')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 focus:outline-none ${
            clientTab === 'instances'
              ? 'bg-forest-deep text-white shadow-sm'
              : 'text-stone-600 hover:text-black hover:bg-stone-50'
          }`}
        >
          <span>WhatsApp Containers</span>
          <span className="bg-stone-100 group-hover:bg-black text-[#525345] text-[9px] font-bold px-1.5 py-0.1 rounded">
            {clientInstances.length}
          </span>
        </button>
        <button
          onClick={() => setClientTab('api-keys')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all focus:outline-none ${
            clientTab === 'api-keys'
              ? 'bg-forest-deep text-white shadow-sm'
              : 'text-stone-600 hover:text-black hover:bg-stone-50'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setClientTab('api-access')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all focus:outline-none ${
            clientTab === 'api-access'
              ? 'bg-forest-deep text-white shadow-sm'
              : 'text-stone-600 hover:text-black hover:bg-stone-50'
          }`}
        >
          Documentation Docs
        </button>
        <button
          onClick={() => setClientTab('sandbox')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all focus:outline-none ${
            clientTab === 'sandbox'
              ? 'bg-forest-deep text-white shadow-sm'
              : 'text-stone-600 hover:text-black hover:bg-stone-50'
          }`}
        >
          API Sandbox Test
        </button>
        <button
          onClick={() => setClientTab('billing')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all focus:outline-none ${
            clientTab === 'billing'
              ? 'bg-forest-deep text-white shadow-sm'
              : 'text-stone-600 hover:text-black hover:bg-stone-50'
          }`}
        >
          MPesa Audit Trail
        </button>
      </div>

      {/* CORE WORKSPACE PORTAL WRAPPERS */}
      {clientTab === 'token-store' && (
        <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              Safaricom Lipa Na M-Pesa - Prepaid Message Quota
            </h3>
            <p className="text-xs text-graphite mt-0.5">
              Acquire premium outbox message packets. Every successfully dispatched client notification decrements billing balance exactly by **1 Unit**.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Preset Package Options (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                AeuxGlobal Corporate Bundles
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1 */}
                <button
                  type="button"
                  onClick={() => handleMessagesChange(500)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[110px] transition-all focus:outline-none ${
                    customMessagesCount === 500
                      ? 'border-yellow-600 bg-yellow-50/10 ring-1 ring-yellow-500/20'
                      : 'border-stone-200 hover:border-yellow-400 hover:bg-stone-50/30'
                  }`}
                >
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Developer Mini</p>
                  <div>
                    <p className="text-lg font-black text-forest-deep">500 msgs</p>
                    <p className="text-[10px] text-yellow-700 font-bold">KES 100 Cashout</p>
                  </div>
                </button>

                {/* Option 2 */}
                <button
                  type="button"
                  onClick={() => handleMessagesChange(2500)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[110px] transition-all focus:outline-none ${
                    customMessagesCount === 2500
                      ? 'border-yellow-600 bg-yellow-50/10 ring-1 ring-yellow-500/20'
                      : 'border-stone-200 hover:border-yellow-400 hover:bg-stone-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Aggregator Lite</p>
                    <span className="bg-yellow-500/20 text-yellow-800 text-[8px] font-black px-1.5 py-0.1 rounded uppercase animate-pulse">PROMO</span>
                  </div>
                  <div>
                    <p className="text-lg font-black text-forest-deep">2,500 msgs</p>
                    <p className="text-[10px] text-yellow-700 font-bold">KES 500 Cashout</p>
                  </div>
                </button>

                {/* Option 3 */}
                <button
                  type="button"
                  onClick={() => handleMessagesChange(5000)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[110px] transition-all focus:outline-none ${
                    customMessagesCount === 5000
                      ? 'border-yellow-600 bg-yellow-50/10 ring-1 ring-yellow-500/20'
                      : 'border-stone-200 hover:border-yellow-400 hover:bg-stone-50/30'
                  }`}
                >
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Enterprise Pro</p>
                  <div>
                    <p className="text-lg font-black text-forest-deep">5,000 msgs</p>
                    <p className="text-[10px] text-yellow-700 font-bold">KES 1,000 Cashout</p>
                  </div>
                </button>
              </div>

              {/* Slider customization and calculations */}
              <div className="p-4 bg-stone-50 border border-stone-200/60 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#181711]">Scalable Custom Quota</p>
                    <p className="text-[10px] text-gray-500 leading-none">Scale exactly to matching budgets.</p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-stone-200">
                    <input
                      type="number"
                      min={100}
                      step={25}
                      value={customMessagesCount}
                      onChange={(e) => handleMessagesChange(Math.max(0, parseInt(e.target.value) || 0))}
                      className="text-lg font-bold bg-transparent text-black focus:outline-none w-20 border-b border-stone-200 pb-0.5"
                    />
                    <span className="font-bold text-gray-400 text-[10px]">msgs</span>
                  </div>
                </div>

                {/* Range Slider for messages */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>100 msgs</span>
                    <span>1,000 msgs</span>
                    <span>2,500 msgs</span>
                    <span>5,000 msgs</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={50}
                    value={customMessagesCount}
                    onChange={(e) => handleMessagesChange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-yellow-600"
                  />
                </div>
              </div>

              {/* Price rate summary check banner */}
              {spendAmount < MINIMUM_SPEND_KSH ? (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Your requested budget KES {spendAmount} is below the minimal threshold of KES {MINIMUM_SPEND_KSH} (100 messages). Please adjust slider.</span>
                </div>
              ) : (
                <div className="p-3.5 bg-yellow-550/5 border border-yellow-500/15 rounded-xl text-[#211f12] text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-600 shrink-0" />
                    <span>Purchase eligible! Under the <strong>{MESSAGES_PER_KSH}/KES 1</strong> rate, you will get <strong>{customMessagesCount.toLocaleString()}</strong> outbox tokens.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Safaricom STK Form (5 cols) */}
            <div className="lg:col-span-5 bg-[#f9f9f2] border border-[#eaebe4] p-5 rounded-3xl space-y-4">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-yellow-700 font-bold">
                Daraja Push Gateway
              </span>

              <form onSubmit={handleInitiatePayment} className="space-y-4 text-xs font-semibold text-forest-deep">
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase tracking-wide mb-1.5">
                    M-Pesa Phone Number (+254...)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="254712345678"
                    value={userPhoneNumber}
                    onChange={(e) => setUserPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                  />
                  <p className="text-[9px] text-[#7a7c6f] mt-1 normal-case font-normal leading-relaxed">
                    Used to simulate an automated Safaricom STK Push dialogue in AI Studio sandbox.
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-gray-500 font-normal">Package Cost:</span>
                    <span className="font-extrabold text-forest-deep">KES {spendAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-gray-500 font-normal">Quota Acquired:</span>
                    <span className="font-extrabold text-yellow-700">+{customMessagesCount.toLocaleString()} messages</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={spendAmount < MINIMUM_SPEND_KSH || isProcessingPayment}
                  className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#33301a] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none disabled:opacity-40 shadow-sm"
                >
                  <CreditCard className="w-4 h-4 text-yellow-400" />
                  <span>{isProcessingPayment ? 'Connecting Daraja Core...' : 'Sync M-Pesa STK Push'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {clientTab === 'instances' && (
        <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-forest-deep">My Custom WhatsApp Containers</h3>
              <p className="text-xs text-graphite mt-0.5">Initialize or pair active QR multi-device nodes specifically for your corporate tenant.</p>
            </div>
            <button
              onClick={() => setShowNewInstanceModal(true)}
              className="px-3.5 py-1.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] transition-all flex items-center gap-1 focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Instance</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientInstances.length > 0 ? (
              clientInstances.map((inst) => {
                const isConnected = inst.status === 'Connected';
                const isConnecting = inst.status === 'Connecting';
                return (
                  <div key={inst.id} className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-yellow-800 font-bold">
                          Multi-Device Lease
                        </span>
                        <h4 className="text-base font-bold text-forest-deep font-mono leading-none">
                          {inst.name}
                        </h4>
                        <div className="text-[11px] text-[#6a6c5d] mt-1">
                          Phone: <code className="font-mono bg-[#eaebe4] px-1 py-0.5 rounded text-xs select-all text-yellow-950 font-bold">{inst.phone}</code>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono ${
                        isConnected 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-250' 
                          : isConnecting 
                          ? 'bg-amber-100/60 text-amber-850 border border-amber-205 animate-pulse'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {inst.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#eaebe4] flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-semibold text-[10px]">Active since: Jun 12</span>
                      <div className="flex items-center gap-1.5">
                        {isConnecting && (
                          <button
                            onClick={() => handleBeginPairing(inst)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 focus:outline-none"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Sync QR</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteInstance(inst.id)}
                          className="text-stone-400 hover:text-red-700 p-1.5 bg-white border border-stone-200 hover:border-rose-200 rounded-lg transition-all"
                        >
                          Dismantle
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 py-12 text-center text-graphite space-y-3">
                <Smartphone className="w-12 h-12 text-yellow-300 mx-auto" />
                <p className="font-bold text-forest-deep">You have no instances provisioned yet.</p>
                <button
                  onClick={() => setShowNewInstanceModal(true)}
                  className="px-4 py-2 bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl focus:outline-none"
                >
                  Create your first allocated Instance
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {clientTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-stone-100 gap-3">
              <div>
                <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-yellow-700 font-bold" />
                  Client API Credentials & Bearer Tokens
                </h3>
                <p className="text-xs text-graphite mt-0.5">
                  Secure secret keys utilized by servers to issue automated carrier push streams. Keep keys secret.
                </p>
              </div>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="bg-forest-deep hover:bg-[#33301a] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 focus:outline-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Secret Key</span>
              </button>
            </div>

            <div className="overflow-hidden border border-[#eaebe4] rounded-2xl divide-y divide-[#eaebe4]">
              {apiKeys.length > 0 ? (
                apiKeys.map((k) => {
                  const isRevoked = k.status === 'Revoked';
                  return (
                    <div
                      key={k.id}
                      className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        isRevoked ? 'bg-stone-50/50 opacity-60' : 'bg-[#fcfdfa] hover:bg-stone-50/30'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold font-mono ${isRevoked ? 'text-gray-400 line-through' : 'text-forest-deep'}`}>
                            {k.name}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-[8px] font-bold rounded-full font-mono uppercase tracking-wider ${
                              isRevoked
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-yellow-50 text-yellow-800 border border-yellow-250'
                            }`}
                          >
                            {k.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 max-w-full">
                          <code className="text-[11px] font-mono bg-stone-100 px-2 py-1 rounded text-stone-700 block truncate select-all">
                            {copiedKeyId === k.id ? k.key : `${k.key.substring(0, 15)}••••••••••••••••••••••••`}
                          </code>
                          <button
                            onClick={() => handleCopyKey(k.id, k.key)}
                            disabled={isRevoked}
                            className="p-1.5 text-stone-400 hover:text-yellow-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors focus:outline-none"
                            title="Copy Bearer Key"
                          >
                            {copiedKeyId === k.id ? (
                              <Check className="w-3.5 h-3.5 text-yellow-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 text-[10px] font-mono text-gray-400 shrink-0">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-stone-400">Created date</p>
                          <p className="text-stone-700 font-bold mt-0.5">{k.created}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-stone-400">Last accessed</p>
                          <p className="text-stone-700 font-bold mt-0.5">{k.lastUsed}</p>
                        </div>

                        {!isRevoked ? (
                          <button
                            onClick={() => handleRevokeKey(k.id, k.name)}
                            className="p-2 text-stone-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-100 rounded-xl transition-all focus:outline-none"
                            title="Revoke and Nullify Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[9px] bg-stone-100/50 text-gray-400 p-2 rounded-xl border border-transparent font-bold">
                            Revoked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-graphite space-y-2">
                  <Key className="w-8 h-8 text-yellow-300 mx-auto" />
                  <p className="font-bold text-xs text-forest-deep">No keys generated yet.</p>
                  <p className="text-[10px] text-gray-500">
                    Click "Generate Secret Key" to retrieve a bearer token for CRM integrations.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-500/[0.03] border border-yellow-500/10 rounded-2xl flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-yellow-700 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-yellow-950">Credential Security Policy</p>
                <p className="text-[11px] text-[#6a6c5d] leading-relaxed font-semibold">
                  API Keys grant direct billing access to your outbox tokens. Always transmit keys exclusively over secure TLS/HTTPS channels. Never bake keys directly into client-side codebases or raw mobile bundles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {clientTab === 'api-access' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaebe4] rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-[#a18115]">
                Developer SDK Integration Specs
              </span>
              <h3 className="text-sm font-bold text-forest-deep mt-1 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-yellow-700" />
                Webhook Specs & Core API Endpoints
              </h3>
              <p className="text-xs text-graphite mt-0.5">
                Utilize standard tenant endpoints to fire individual outbox notifications. Each verified execution debit decrements exactly **1 Token (KES 0.20)**.
              </p>
            </div>

            {/* Endpoints specification section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: API Specs Table */}
              <div className="lg:col-span-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#3d3311] pb-2 border-b border-[#eaebe4]">
                  REST Routing List
                </h4>

                <div className="space-y-3.5">
                  {/* Endpoint 1 */}
                  <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-600 text-stone-950 font-bold text-[9px] px-2 py-0.5 rounded font-mono">
                        POST
                      </span>
                      <code className="text-xs font-mono font-bold text-forest-deep">/message/sendText</code>
                    </div>
                    <p className="text-[11px] text-graphite font-semibold">
                      Dispatches text payloads. Deducts **1 Token** upon delivery reports.
                    </p>

                    <div className="pt-2 border-t border-stone-200/60 space-y-1 text-[10px] font-mono">
                      <p className="text-gray-400 font-bold uppercase text-[8px]">Required Headers</p>
                      <div className="flex justify-between font-bold text-stone-700">
                        <span>X-API-Key</span>
                        <span>YOUR_SECRET_BEARER_KEY</span>
                      </div>
                      <div className="flex justify-between font-bold text-stone-700">
                        <span>Content-Type</span>
                        <span>application/json</span>
                      </div>
                    </div>
                  </div>

                  {/* Endpoint 2 */}
                  <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#1d4ed8] text-white font-bold text-[9px] px-2 py-0.5 rounded font-mono">
                        GET
                      </span>
                      <code className="text-xs font-mono font-bold text-forest-deep">/instance/status</code>
                    </div>
                    <p className="text-[11px] text-graphite font-semibold">
                      Queries real-time container connectivity state. **Free & Unlimited**.
                    </p>

                    <div className="pt-2 border-t border-stone-200/60 space-y-1 text-[10px] font-mono">
                      <p className="text-gray-400 font-bold uppercase text-[8px]">Query Parameters</p>
                      <div className="flex justify-between font-bold text-stone-700">
                        <span>instance</span>
                        <span>Container Name (String)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 text-yellow-955 rounded-2xl space-y-1.5 border border-yellow-100">
                  <p className="text-xs font-bold">Dynamic Token-Billing Policy</p>
                  <p className="text-[11px] text-yellow-905 leading-relaxed font-semibold">
                    Our Nairobi Carrier Cluster automatically synchronizes incoming M-Pesa payments (Ksh. 20 minimum spending rate) directly with live REST gateways. Quotas never expire.
                  </p>
                </div>
              </div>

              {/* Right Column: Code Snippets Generator */}
              <div className="lg:col-span-6 bg-[#13120d] text-[#e3ded2] rounded-2xl p-4 flex flex-col justify-between border border-[#3b351e]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#3b351e] mb-4">
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="font-mono text-[10px] uppercase font-bold text-[#b8ab81]">
                        Integration Snippets
                      </span>
                    </div>
                    <span className="text-[8px] font-mono bg-yellow-950 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">
                      Production Port 443
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* cURL Snippet */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-[#b5af9a] font-mono">1. Issue with cURL Bash</p>
                      <pre className="p-3 bg-[#0d0d09] border border-[#2d2813] rounded-xl overflow-x-auto text-[10px] font-mono text-yellow-100 leading-relaxed">
{`curl -X POST https://api.aeuxglobal.co.ke/v1/message/sendText \\
  -H "X-API-Key: evo_live_pk_8b2d41fc7a892f39281a" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instance": "${clientInstances[0]?.name || 'nairobi-dispatch-node'}",
    "phone": "2547XXXXXXXX",
    "message": "Order paid! KES 2,500 received."
  }'`}
                      </pre>
                    </div>

                    {/* Python requests */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-[#b5af9a] font-mono">2. Python requests Library</p>
                      <pre className="p-3 bg-[#0d0d09] border border-[#2d2813] rounded-xl overflow-x-auto text-[10px] font-mono text-yellow-101 leading-relaxed">
{`import requests

url = "https://api.aeuxglobal.co.ke/v1/message/sendText"
headers = {
    "X-API-Key": "evo_live_pk_8b2d41...",
    "Content-Type": "application/json"
}
payload = {
    "instance": "${clientInstances[0]?.name || 'nairobi-dispatch-node'}",
    "phone": "254722000000",
    "message": "Habari! Your OTP token is 9301"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#3b351e]">
                  <button
                    onClick={() => setClientTab('sandbox')}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-stone-950 py-2.5 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none shadow-sm"
                  >
                    <span>Launch API Message Sandbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {clientTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Side - 2 cols */}
          <div className="lg:col-span-2 bg-white border border-[#eaebe4] rounded-3xl p-5 space-y-4 shadow-sm">
            <div>
              <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-yellow-700">
                REST Request payload
              </span>
              <h3 className="text-sm font-bold text-forest-deep mt-1">Instant Carrier Dispatch</h3>
            </div>

            <form onSubmit={handleSendSandboxMessage} className="space-y-4 text-xs font-semibold text-stone-955">
              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase tracking-wide mb-1.5">
                  Sender allocated Instance
                </label>
                <select
                  value={sandboxSelectedInstance}
                  onChange={(e) => setSandboxSelectedInstance(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs text-[#181711]"
                >
                  <option value="">-- Choose Container --</option>
                  {clientInstances.map((inst) => (
                    <option key={inst.id} value={inst.name} disabled={inst.status !== 'Connected'}>
                      {inst.name} ({inst.status})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-[#6a6c5d] mt-1 normal-case font-normal">
                  Each successful send deducts <strong className="font-bold">1 Token (KES 0.20)</strong> from balance.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase tracking-wide mb-1.5">
                  Destination Phone (Safaricom/Kenyan Preferred)
                </label>
                <input
                  type="text"
                  required
                  placeholder="254712345678"
                  value={sandboxDestinationPhone}
                  onChange={(e) => setSandboxDestinationPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs text-[#181711]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase tracking-wide mb-1.5">
                  Message Payload Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={sandboxMessage}
                  onChange={(e) => setSandboxMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl focus:outline-none text-xs text-[#181711] resize-none"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#6a6c5d]">
                <span>Remaining Quota:</span>
                <span className="font-bold text-yellow-800">{(client.tokenBalance || 0).toLocaleString()} msgs</span>
              </div>

              <button
                type="submit"
                disabled={sandboxSending || !sandboxSelectedInstance || (client.tokenBalance || 0) <= 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#33301a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5 text-yellow-400" />
                <span>{sandboxSending ? 'Issuing packet to REST node...' : 'Dispatch REST SMS'}</span>
              </button>
            </form>
          </div>

          {/* Code Sandbox Terminal Response - 3 cols */}
          <div className="lg:col-span-3 bg-[#13120d] border border-[#2d2813] rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="p-4 bg-[#1f1d0b] border-b border-[#353116] flex items-center justify-between text-[#cbd4d0] font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-yellow-400" />
                <span>HTTPS REST Core Output</span>
              </div>
              <span className="text-[9px] uppercase font-bold text-[#8f834a]">node: Nairobi-HQ-East</span>
            </div>

            <div className="p-5 flex-1 min-h-[250px] font-mono text-[11px] whitespace-pre overflow-auto bg-[#0d0d0a] text-yellow-300">
              {sandboxSending ? (
                <div className="h-full flex flex-col items-center justify-center text-yellow-600/60 text-center space-y-2 py-12">
                  <Activity className="w-6 h-6 animate-pulse text-yellow-400" />
                  <span>POST /message/sendText ...</span>
                  <span>Executing transactional debit...</span>
                </div>
              ) : sandboxResponse ? (
                <code className="text-yellow-100 whitespace-pre leading-relaxed block">{sandboxResponse}</code>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#6e684a]/70 text-center space-y-2 py-12">
                  <Terminal className="w-8 h-8 text-[#4a452c]" />
                  <p className="font-bold text-xs text-white">Console waiting for execution</p>
                  <p className="text-[10px] text-[#7d7756] max-w-sm mx-auto">
                    Choose your paired custom WhatsApp instance, type in a target phone, and hit "Dispatch REST SMS" to test live billing hooks.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {clientTab === 'billing' && (
        <div className="bg-white border border-[#eaebe4] rounded-[28px] overflow-hidden shadow-sm">
          <div className="bg-[#f9f9f2] border-b border-[#eaebe4] px-6 py-4 flex items-center justify-between text-stone-500 font-bold">
            <div>
              <h3 className="text-sm text-forest-deep">Safaricom Payment Audit & Transactions</h3>
              <p className="text-xs text-graphite font-normal mt-0.5">Verified Daraja callbacks which successfully bought token packets.</p>
            </div>
            <span className="text-xs bg-yellow-50 text-yellow-800 px-2.5 py-1 rounded-full border border-yellow-250 font-bold uppercase tracking-wider">
              {client.transactions?.length || 0} callbacks
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {client.transactions && client.transactions.length > 0 ? (
              client.transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-stone-50/40 transition-all font-sans text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-forest-deep select-all bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
                          {tx.reference}
                        </span>
                        <span className="bg-yellow-50 text-yellow-850 text-[9px] font-bold px-2 py-0.5 rounded-full border border-yellow-200 uppercase tracking-wide">
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Acquired <strong className="text-yellow-850">+{tx.tokens.toLocaleString()} Outbox message tokens</strong> for <code className="font-mono font-bold bg-[#fafae3] border border-yellow-200/20 px-1 py-0.2 rounded">KES {tx.amount}</code>
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-graphite">
                      <div className="font-mono text-[10px] text-[#7a7c6f] font-bold">
                        TIMESTAMP: {tx.timestamp}
                      </div>
                      <div className="mt-0.5">
                        Hook payload dispatch target: +{tx.phone}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-graphite space-y-2">
                <History className="w-8 h-8 text-yellow-300 mx-auto" />
                <p className="font-bold text-xs text-forest-deep">No payments discovered</p>
                <p className="text-[10px] text-graphite">Navigate to the Token Store to purchase KES outbox quota instantly via M-Pesa push.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* M-PESA DARAJA SMS SIMULATOR STK MODAL */}
      <AnimatePresence>
        {showDarajaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#13120d] border border-[#2d2813] text-[#cbd3cf] rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-mono">
                  M
                </div>
                <h4 className="text-sm font-extrabold text-white tracking-widest uppercase">
                  SIMULATED M-PESA PUSH
                </h4>
                <p className="text-xs text-yellow-300">
                  LIPA NA M-PESA ONLINE (DARAJA GATEWAY)
                </p>
              </div>

              <div className="p-4 bg-[#1f1d0b] border border-[#353116] rounded-2xl text-xs space-y-2">
                <p className="text-center font-bold text-white text-sm">
                  Pay KES {spendAmount} to AeuxGlobal?
                </p>
                <p className="text-[11px] text-stone-300 leading-relaxed text-center normal-case">
                  This transaction will purchase {Math.floor(spendAmount * MESSAGES_PER_KSH).toLocaleString()} outbox message tokens for your tenant dashboard.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-yellow-450 uppercase tracking-widest text-center">
                  Enter Your 4-Digit M-Pesa PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={mpesaPinSim}
                  onChange={(e) => {
                    setMpesaPinSim(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  className="w-24 text-center tracking-widest text-lg font-bold bg-[#1f1d0b] border border-[#353116] text-white py-2.5 rounded-xl block mx-auto focus:outline-none focus:border-yellow-500"
                />
                {pinError && (
                  <p className="text-[10px] text-rose-400 text-center font-semibold">{pinError}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDarajaModal(false);
                    setMpesaPinSim('');
                    setPinError('');
                  }}
                  className="flex-1 bg-[#1c1b14] hover:bg-stone-850 text-gray-400 hover:text-white py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMpesaPinSim}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-stone-950 py-2.5 rounded-xl text-xs font-bold"
                >
                  Authorize Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW INSTANCE CREATION DIALOG MODAL */}
      <AnimatePresence>
        {showNewInstanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 font-sans"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-sm text-forest-deep">New Instance Configuration</h4>
                <button
                  type="button"
                  onClick={() => setShowNewInstanceModal(false)}
                  className="text-gray-400 hover:text-black focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateInstance} className="space-y-4 text-xs font-semibold text-forest-deep">
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase tracking-wide mb-1.5">
                    Instance Connection Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. nairobi-dispatch-node"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs text-[#181711]"
                  />
                  <p className="text-[9px] text-[#6a6c5d] mt-1 normal-case font-normal leading-relaxed">
                    This tag will label your isolated container on AeuxGlobal Nairobi cluster pipelines.
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewInstanceModal(false)}
                    className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-forest-deep text-white hover:bg-[#33301a] rounded-xl text-xs font-bold"
                  >
                    Provision Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW API KEY CREATION DIALOG MODAL */}
      <AnimatePresence>
        {showNewKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-sm text-forest-deep">Create Client API Credentials</h4>
                <button
                  type="button"
                  onClick={() => setShowNewKeyModal(false)}
                  className="text-gray-400 hover:text-black focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs font-semibold text-forest-deep">
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase tracking-wide mb-1.5">
                    Credential Name Tag
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ERP Sales Hook"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs text-[#181711]"
                  />
                  <p className="text-[9px] text-[#6a6c5d] mt-1 normal-case font-normal leading-relaxed">
                    A friendly label to distinguish these API bearer tokens inside your client portal.
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNewKeyModal(false)}
                    className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-600 hover:text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-stone-950 font-bold text-xs rounded-xl"
                  >
                    Generate Credential Key
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHATSAPP LINK SCAN DIALOG MODAL */}
      <AnimatePresence>
        {pairingInstance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-xs text-forest-deep uppercase tracking-widest">
                  Evolution Node Handshake QR
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setPairingInstance(null);
                    setPairingQR('');
                  }}
                  className="text-gray-400 hover:text-black focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold">Synchronize: <code className="font-mono text-yellow-800 font-bold bg-yellow-50 px-1.5 py-0.5 rounded">{pairingInstance.name}</code></p>
                <p className="text-[10px] text-graphite leading-relaxed">
                  Open WhatsApp on your device, navigate to Linked Devices, and point your camera at this QR code to link.
                </p>
              </div>

              <div className="w-44 h-44 border border-[#eaebe4] rounded-2xl bg-stone-50 mx-auto flex items-center justify-center p-4 relative">
                {generatingQR ? (
                  <div className="space-y-2 text-center text-[10px] text-graphite font-bold">
                    <span className="block w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <span>Allocating IP Socket...</span>
                  </div>
                ) : pairingQR ? (
                  <div className="relative">
                    <svg className="w-36 h-36 mx-auto" viewBox="0 0 100 100">
                      <rect x="0" y="0" width="25" height="25" fill="#181711" />
                      <rect x="5" y="5" width="15" height="15" fill="#fff" />
                      <rect x="9" y="9" width="7" height="7" fill="#181711" />

                      <rect x="75" y="0" width="25" height="25" fill="#181711" />
                      <rect x="80" y="5" width="15" height="15" fill="#fff" />
                      <rect x="84" y="9" width="7" height="7" fill="#181711" />

                      <rect x="0" y="75" width="25" height="25" fill="#181711" />
                      <rect x="5" y="80" width="15" height="15" fill="#fff" />
                      <rect x="9" y="84" width="7" height="7" fill="#181711" />

                      <rect x="35" y="10" width="5" height="5" fill="#eab308" />
                      <rect x="45" y="5" width="10" height="5" fill="#181711" />
                      <rect x="60" y="15" width="5" height="10" fill="#eab308" />
                      <rect x="30" y="30" width="15" height="5" fill="#181711" />
                      <rect x="50" y="40" width="10" height="10" fill="#181711" />
                      <rect x="35" y="55" width="5" height="15" fill="#eab308" />
                      <rect x="10" y="45" width="10" height="5" fill="#181711" />
                      <rect x="70" y="50" width="15" height="5" fill="#181711" />
                      <rect x="75" y="65" width="10" height="10" fill="#eab308" />
                      <rect x="55" y="75" width="5" height="15" fill="#181711" />
                      <rect x="35" y="85" width="15" height="5" fill="#181711" />
                    </svg>

                    <div className="absolute inset-0 bg-[#181711]/5 hover:bg-transparent transition-all flex items-center justify-center cursor-default group">
                      <span className="hidden group-hover:block bg-forest-deep text-white text-[9px] px-2 py-1 rounded shadow">
                        LEASE: ACTIVE
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSimulateSuccessfulScan}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold text-xs rounded-xl"
                >
                  Simulate QR Scanner Scan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPairingInstance(null);
                    setPairingQR('');
                  }}
                  className="w-full py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs text-gray-500 font-bold"
                >
                  Cancel pairing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
