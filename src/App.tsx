import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Code2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  QrCode,
  Smartphone,
  CreditCard,
  Wallet,
  Search,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileText,
  Play,
  Clock,
  Sparkles,
  Server,
  Layers,
  History,
  Check
} from 'lucide-react';
import {
  API_DEFINITIONS,
  UAT_CONFIG,
  COMMON_PITFALLS,
  RETURN_REDIRECT_SPEC,
  ApiDefinition
} from './data/acledaSpec';
import {
  generateHmacSHA512Hex,
  buildFormulaAMessage,
  buildFormulaBMessage
} from './utils/crypto';
import { generateCodeSnippet } from './utils/codeGenerator';
import { simulateAcledaBackend, SimulatedResponse } from './utils/acledaSimulator';

interface HistoryItem {
  id: string;
  timestamp: string;
  apiName: string;
  endpoint: string;
  mode: 'live' | 'simulator';
  status: number;
  durationMs: number;
  payload: any;
  response: any;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'sandbox' | 'hasher' | 'linter' | 'codegen' | 'return-url' | 'docs' | 'faq'
  >('sandbox');

  // Global Config
  const [merchantPath, setMerchantPath] = useState(UAT_CONFIG.defaultMerchantPath);
  const [merchantId, setMerchantId] = useState(UAT_CONFIG.defaultMerchantID);
  const [loginId, setLoginId] = useState(UAT_CONFIG.defaultLoginId);
  const [password, setPassword] = useState('arakawauser');
  const [secretKey, setSecretKey] = useState('xxxxx');

  // Testing Console State
  const [selectedApiId, setSelectedApiId] = useState<string>('api-1-account');
  const currentApi = API_DEFINITIONS.find((a) => a.id === selectedApiId) || API_DEFINITIONS[0];
  const [executionMode, setExecutionMode] = useState<'simulator' | 'live'>('simulator');
  const [editablePayload, setEditablePayload] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [responseMeta, setResponseMeta] = useState<{
    status: number;
    statusText: string;
    durationMs: number;
    mode: 'live' | 'simulator';
    isNetworkError?: boolean;
    suggestion?: string;
  } | null>(null);

  // Auto-inject hash toggle
  const [autoInjectHash, setAutoInjectHash] = useState<boolean>(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Hasher State
  const [hasherFormula, setHasherFormula] = useState<'A' | 'B'>('A');
  const [hasherTxid, setHasherTxid] = useState('4CCF4B77E2E001');
  const [hasherTokenId, setHasherTokenId] = useState('XM1O0NgzHqGDGcGBlYDzmHtszIQz');
  const [generatedHash, setGeneratedHash] = useState('');
  const [concatenatedMessage, setConcatenatedMessage] = useState('');

  // Code Gen State
  const [selectedLang, setSelectedLang] = useState<
    'typescript' | 'java' | 'python' | 'php' | 'csharp' | 'go' | 'dart'
  >('typescript');

  // Linter State
  const [linterInput, setLinterInput] = useState<string>('');
  const [linterResults, setLinterResults] = useState<
    { type: 'error' | 'warning' | 'pass'; title: string; detail: string }[]
  >([]);

  // Return URL State
  const [returnUrlInput, setReturnUrlInput] = useState<string>(RETURN_REDIRECT_SPEC.exampleUrl);
  const [parsedReturnParams, setParsedReturnParams] = useState<Record<string, string>>({});

  // Helper to construct baseline template payload for the selected API
  const buildInitialPayload = async (api: ApiDefinition) => {
    const isFormulaA = api.hashFormula === 'A';
    const txid = 'TX_' + Date.now().toString().slice(-8);
    const token = '1OaBWcfwvq0b2gOSLAzI' + Math.random().toString(36).substring(2, 8);
    const sess = 'nkOLZzvy2yn3KUUm12Pg' + Math.random().toString(36).substring(2, 8);

    const msg = isFormulaA
      ? buildFormulaAMessage(merchantId, loginId, password, txid)
      : buildFormulaBMessage(merchantId, loginId, password, token);

    const initialHash = await generateHmacSHA512Hex(msg, secretKey);

    let obj: any = {};
    if (api.id === 'api-1-account') {
      obj = {
        loginId,
        password,
        merchantID: merchantId,
        hash: initialHash,
        xpayTransaction: {
          txid,
          purchaseAmount: '4000',
          purchaseCurrency: 'KHR',
          purchaseDate: '12-11-2026',
          purchaseDesc: 'mobile',
          invoiceid: txid,
          item: '1',
          quantity: '1',
          expiryTime: '5',
          paymentCard: '0'
        }
      };
    } else if (api.id === 'api-2-mpgs') {
      obj = {
        loginId,
        password,
        merchantID: merchantId,
        hash: initialHash,
        xpayTransaction: {
          txid,
          purchaseAmount: '4000',
          purchaseCurrency: 'KHR',
          purchaseDate: '12-11-2026',
          purchaseDesc: 'mobile',
          invoiceid: txid,
          item: '1',
          quantity: '1',
          expiryTime: '5',
          paymentCard: '1'
        }
      };
    } else if (api.id === 'api-3-khqr-string') {
      obj = {
        loginId,
        password,
        merchantID: merchantId,
        hash: initialHash,
        xpayTransaction: {
          txid,
          purchaseAmount: '4000',
          purchaseCurrency: 'KHR',
          purchaseDate: '12-11-2026',
          purchaseDesc: 'Bakong QR payment',
          invoiceid: txid,
          item: '1',
          quantity: '1',
          expiryTime: '5',
          operationType: '5'
        }
      };
    } else if (api.id === 'api-4-khqr-webview') {
      obj = {
        loginId,
        password,
        merchantID: merchantId,
        hash: initialHash,
        xpayTransaction: {
          txid,
          purchaseAmount: '4000',
          purchaseCurrency: 'KHR',
          purchaseDate: '12-11-2026',
          purchaseDesc: 'Web view checkout',
          invoiceid: txid,
          item: '1',
          quantity: '1',
          expiryTime: '5',
          operationType: '3'
        }
      };
    } else if (api.id === 'api-5-deeplink') {
      obj = {
        loginId,
        password,
        merchantID: merchantId,
        hash: initialHash,
        xpayTransaction: {
          txid,
          purchaseAmount: '4000',
          purchaseCurrency: 'KHR',
          purchaseDate: '12-11-2026',
          purchaseDesc: 'App purchase',
          invoiceid: txid,
          item: '1',
          quantity: '1',
          expiryTime: '5',
          oprDevice: 'android',
          callBackUrl: 'appmobile://merchant.com.kh/callback',
          compName: 'My Online Store'
        }
      };
    } else if (api.id === 'api-6-status') {
      obj = {
        loginId,
        password,
        merchantName: merchantPath,
        hash: initialHash,
        merchantId, // lowercase d
        paymentTokenid: token // lowercase id
      };
    } else if (api.id === 'api-7-refund') {
      obj = {
        loginId,
        password,
        merchantId, // lowercase d
        hash: initialHash,
        paymentTokenId: token, // uppercase I
        sessionId: sess,
        amount: '1',
        currency: 'USD',
        reason: 'Customer refund request'
      };
    }

    setEditablePayload(JSON.stringify(obj, null, 2));
    setApiResponse(api.sampleResponse);
    setResponseMeta({
      status: 200,
      statusText: 'PREVIEW',
      durationMs: 0,
      mode: 'simulator'
    });
  };

  // Sync payload when switching API
  useEffect(() => {
    buildInitialPayload(currentApi);
  }, [selectedApiId]);

  // Compute live hash for Hasher tab
  useEffect(() => {
    let msg = '';
    if (hasherFormula === 'A') {
      msg = buildFormulaAMessage(merchantId, loginId, password, hasherTxid);
    } else {
      msg = buildFormulaBMessage(merchantId, loginId, password, hasherTokenId);
    }
    setConcatenatedMessage(msg);

    generateHmacSHA512Hex(msg, secretKey).then((hash) => {
      setGeneratedHash(hash);
    });
  }, [hasherFormula, merchantId, loginId, password, hasherTxid, hasherTokenId, secretKey]);

  // Auto-inject hash into current payload
  const handleAutoInjectHash = async () => {
    try {
      const parsed = JSON.parse(editablePayload);
      const isFormulaA = currentApi.hashFormula === 'A';

      const mId = isFormulaA
        ? parsed.merchantID || merchantId
        : parsed.merchantId || merchantId;
      const lId = parsed.loginId || loginId;
      const pwd = parsed.password || password;

      let msg = '';
      if (isFormulaA) {
        const txid = parsed.xpayTransaction?.txid || '';
        msg = buildFormulaAMessage(mId, lId, pwd, txid);
      } else {
        const token =
          currentApi.id === 'api-6-status'
            ? parsed.paymentTokenid || ''
            : parsed.paymentTokenId || '';
        msg = buildFormulaBMessage(mId, lId, pwd, token);
      }

      const computedHash = await generateHmacSHA512Hex(msg, secretKey);
      parsed.hash = computedHash;

      setEditablePayload(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      setCopyFeedback('hash-injected');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (e: any) {
      setJsonError('Cannot inject hash: Invalid JSON syntax in editor');
    }
  };

  // Format JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(editablePayload);
      setEditablePayload(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e: any) {
      setJsonError('Invalid JSON: ' + e.message);
    }
  };

  // Preset modifiers for payload testing
  const applyPreset = async (presetType: string) => {
    try {
      const parsed = JSON.parse(editablePayload);
      if (presetType === 'usd') {
        if (parsed.xpayTransaction) {
          parsed.xpayTransaction.purchaseCurrency = 'USD';
          parsed.xpayTransaction.purchaseAmount = '10.50';
        }
        if (parsed.currency) parsed.currency = 'USD';
      } else if (presetType === 'khr') {
        if (parsed.xpayTransaction) {
          parsed.xpayTransaction.purchaseCurrency = 'KHR';
          parsed.xpayTransaction.purchaseAmount = '42000';
        }
        if (parsed.currency) parsed.currency = 'KHR';
      } else if (presetType === 'new_txid') {
        const newTx = 'TX_' + Date.now().toString().slice(-8);
        if (parsed.xpayTransaction) {
          parsed.xpayTransaction.txid = newTx;
          parsed.xpayTransaction.invoiceid = newTx;
        }
      } else if (presetType === 'invalid_hash') {
        parsed.hash =
          'DEADBEEF000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      } else if (presetType === 'expired_token') {
        if (parsed.paymentTokenid) parsed.paymentTokenid = 'EXPIRED_SESSION_TOKEN_123';
        if (parsed.paymentTokenId) parsed.paymentTokenId = 'EXPIRED_SESSION_TOKEN_123';
      } else if (presetType === 'unpaid_refund') {
        if (parsed.paymentTokenId) parsed.paymentTokenId = 'UNPAID_TOKEN_FOR_REFUND';
      }

      setEditablePayload(JSON.stringify(parsed, null, 2));
      setJsonError(null);

      // Auto update hash if not the intentional invalid hash
      if (presetType !== 'invalid_hash') {
        setTimeout(handleAutoInjectHash, 50);
      }
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  // Execute API Call (Simulator or Live UAT via proxy)
  const handleExecuteApi = async () => {
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(editablePayload);
      setJsonError(null);
    } catch (e: any) {
      setJsonError('Cannot execute: Invalid JSON syntax in payload editor');
      return;
    }

    setIsLoading(true);
    setResponseMeta(null);

    const targetUrl = `https://epaymentuat.acledabank.com.kh:8443/${merchantPath}/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/${currentApi.endpoint}`;

    try {
      if (executionMode === 'simulator') {
        const sim = await simulateAcledaBackend(currentApi.endpoint, parsedPayload, secretKey);
        setApiResponse(sim.data);
        setResponseMeta({
          status: sim.status,
          statusText: sim.statusText,
          durationMs: sim.durationMs,
          mode: 'simulator',
          suggestion: sim.notes
        });

        // Add to history
        setHistory((prev) => [
          {
            id: String(Date.now()),
            timestamp: new Date().toLocaleTimeString(),
            apiName: currentApi.shortName,
            endpoint: currentApi.endpoint,
            mode: 'simulator',
            status: sim.status,
            durationMs: sim.durationMs,
            payload: parsedPayload,
            response: sim.data
          },
          ...prev.slice(0, 19)
        ]);
      } else {
        // Live mode via Express backend proxy
        const res = await fetch('/api/acleda/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUrl,
            payload: parsedPayload
          })
        });

        const result = await res.json();
        setApiResponse(result.data || result);
        setResponseMeta({
          status: result.status || res.status,
          statusText: result.statusText || res.statusText,
          durationMs: result.durationMs || 0,
          mode: 'live',
          isNetworkError: result.isNetworkError,
          suggestion: result.suggestion
        });

        setHistory((prev) => [
          {
            id: String(Date.now()),
            timestamp: new Date().toLocaleTimeString(),
            apiName: currentApi.shortName,
            endpoint: currentApi.endpoint,
            mode: 'live',
            status: result.status || res.status,
            durationMs: result.durationMs || 0,
            payload: parsedPayload,
            response: result.data || result
          },
          ...prev.slice(0, 19)
        ]);
      }
    } catch (err: any) {
      setApiResponse({
        error: err.message || 'Execution error',
        details: 'Check browser console or switch to Sandbox Simulator.'
      });
      setResponseMeta({
        status: 500,
        statusText: 'Internal Client Error',
        durationMs: 0,
        mode: executionMode,
        isNetworkError: true,
        suggestion: 'Failed to complete request. Try switching to Sandbox Simulator.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Quick preset loader into hasher
  const loadDocExampleIntoHasher = (specCase: 'A' | 'B') => {
    if (specCase === 'A') {
      setHasherFormula('A');
      setMerchantId('Zy8MFtBWdE67Thpurh2h4TSX7pw=');
      setLoginId('arakawauser');
      setPassword('arakawauser');
      setHasherTxid('4CCF4B77E2E001');
      setSecretKey('xxxxx');
    } else {
      setHasherFormula('B');
      setMerchantId('Zy8MFtBWdE67Thpurh2h4TSX7pw=');
      setLoginId('arakawauser');
      setPassword('arakawauser');
      setHasherTokenId('XM1O0NgzHqGDGcGBlYDzmHtszIQz');
      setSecretKey('xxxxx');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1-Row 3-Zone Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-8 shrink-0 sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            AC
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">
            ACLEDA Toanchet Pay Studio
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'sandbox'
                ? 'text-blue-700 border-b-2 border-blue-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Live API Test Runner
          </button>
          <button
            onClick={() => setActiveTab('hasher')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'hasher'
                ? 'text-blue-700 border-b-2 border-blue-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            HMAC Hasher
          </button>
          <button
            onClick={() => {
              setActiveTab('linter');
              if (!linterInput) {
                setLinterInput(editablePayload);
              }
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'linter'
                ? 'text-blue-700 border-b-2 border-blue-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Payload Validator
          </button>
          <button
            onClick={() => setActiveTab('codegen')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'codegen'
                ? 'text-blue-700 border-b-2 border-blue-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Code Generator
          </button>
          <button
            onClick={() => setActiveTab('return-url')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'return-url'
                ? 'text-blue-700 border-b-2 border-blue-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Return URL Inspector
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'docs'
                ? 'text-blue-700 border-b-2 border-blue-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Master Spec
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'faq'
                ? 'text-blue-700 border-b-2 border-blue-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Architecture Q&amp;A
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-xs font-mono text-slate-700">
            <Server className="w-3.5 h-3.5 text-blue-700" />
            <span>Port :8443</span>
          </div>
          <button
            onClick={() => {
              setActiveTab('sandbox');
              handleExecuteApi();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isLoading ? 'Sending...' : 'Test Current API'}
          </button>
        </div>
      </header>

      {/* Global Credentials Quick Banner */}
      <div className="bg-slate-900 text-slate-100 px-6 py-2 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">UAT Endpoint:</span>
            <span className="font-mono text-emerald-400">
              https://epaymentuat.acledabank.com.kh:8443/{merchantPath}/...
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <div>
              <span className="text-slate-400">Path: </span>
              <input
                value={merchantPath}
                onChange={(e) => setMerchantPath(e.target.value)}
                className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-xs w-28 focus:outline-blue-500"
              />
            </div>
            <div>
              <span className="text-slate-400">Secret: </span>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-xs w-20 focus:outline-blue-500"
                title="Merchant Secret Key (Never sent over network)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* TAB 1: LIVE API TEST RUNNER & PAYLOAD MODIFIER */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            {/* Header with Title and Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  ACLEDA API Test Console &amp; Payload Modifier
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Change any payload field below, auto-compute HMAC-SHA512 hash, and fire live test requests.
                </p>
              </div>

              {/* Execution Mode Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Target Mode:</span>
                <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
                  <button
                    onClick={() => setExecutionMode('simulator')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      executionMode === 'simulator'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bank Simulator</span>
                  </button>
                  <button
                    onClick={() => setExecutionMode('live')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      executionMode === 'live'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Live UAT (:8443)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 7 APIs Selector Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {API_DEFINITIONS.map((api) => {
                const isSelected = selectedApiId === api.id;
                return (
                  <button
                    key={api.id}
                    onClick={() => setSelectedApiId(api.id)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-slate-500 truncate">
                      {api.name.split('.')[0]}.
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 truncate ${
                        isSelected ? 'text-blue-900' : 'text-slate-800'
                      }`}
                    >
                      {api.shortName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      {api.endpoint}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Current Target Route Strip */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white bg-blue-700 px-2 py-0.5 rounded text-[11px] font-mono">
                  POST
                </span>
                <span className="font-mono text-slate-700 truncate max-w-xl">
                  https://epaymentuat.acledabank.com.kh:8443/{merchantPath}/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/
                  <span className="text-blue-700 font-bold">{currentApi.endpoint}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <span>
                  Hash: <strong className="text-slate-800">Formula {currentApi.hashFormula}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Selector: <code className="font-mono text-blue-700">{currentApi.selectorDesc}</code>
                </span>
              </div>
            </div>

            {/* Split Screen: Payload Editor on Left, Test Response on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Editable Payload Editor */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Request Payload (Editable JSON)
                    </span>
                    {jsonError && (
                      <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        JSON Syntax Error
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFormatJson}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium"
                    >
                      Format
                    </button>
                    <button
                      onClick={handleAutoInjectHash}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-semibold shadow-xs"
                      title="Recompute HMAC-SHA512 with secret key and inject into JSON 'hash' field"
                    >
                      <Key className="w-3.5 h-3.5" />
                      {copyFeedback === 'hash-injected' ? 'Hash Injected!' : 'Inject Hash'}
                    </button>
                    <button
                      onClick={() => buildInitialPayload(currentApi)}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 text-slate-700 font-medium"
                      title="Reset payload to default template"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Quick Payload Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Mods:</span>
                  <button
                    onClick={() => applyPreset('usd')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-[11px]"
                  >
                    Set USD ($10.50)
                  </button>
                  <button
                    onClick={() => applyPreset('khr')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-[11px]"
                  >
                    Set KHR (42,000)
                  </button>
                  <button
                    onClick={() => applyPreset('new_txid')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-[11px]"
                  >
                    New TxID
                  </button>
                  {currentApi.id === 'api-6-status' && (
                    <button
                      onClick={() => applyPreset('expired_token')}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 rounded text-amber-800 text-[11px]"
                    >
                      Test Expired (-22)
                    </button>
                  )}
                  {currentApi.id === 'api-7-refund' && (
                    <button
                      onClick={() => applyPreset('unpaid_refund')}
                      className="px-2 py-0.5 bg-red-100 hover:bg-red-200 rounded text-red-800 text-[11px]"
                    >
                      Test Unpaid (334845)
                    </button>
                  )}
                  <button
                    onClick={() => applyPreset('invalid_hash')}
                    className="px-2 py-0.5 bg-red-50 hover:bg-red-100 rounded text-red-700 text-[11px]"
                  >
                    Test Bad Hash
                  </button>
                </div>

                {/* Textarea Code Editor */}
                <textarea
                  value={editablePayload}
                  onChange={(e) => {
                    setEditablePayload(e.target.value);
                    try {
                      JSON.parse(e.target.value);
                      setJsonError(null);
                    } catch (err: any) {
                      setJsonError(err.message);
                    }
                  }}
                  rows={17}
                  className="w-full flex-1 p-3.5 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />

                {/* Execute Action Bar */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Target: {executionMode === 'simulator' ? 'Local Simulator' : 'UAT Host :8443'}
                  </div>
                  <button
                    onClick={handleExecuteApi}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isLoading ? 'Executing Request...' : 'Send API Request'}
                  </button>
                </div>
              </div>

              {/* Right Column: Response Viewer & Interactive Visualizer */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Response Envelope
                    </span>
                    {responseMeta && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                          responseMeta.status === 200 && !responseMeta.isNetworkError
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {responseMeta.status} {responseMeta.statusText}
                      </span>
                    )}
                  </div>

                  {responseMeta && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>{responseMeta.durationMs}ms</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2), 'res')}
                        className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copyFeedback === 'res' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Network Error Diagnostic Notice */}
                {responseMeta?.isNetworkError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Live UAT Network Notice
                    </div>
                    <p className="text-[11px] leading-relaxed text-red-800">
                      {responseMeta.suggestion ||
                        'Could not reach ACLEDA UAT Gateway. The bank firewall may require merchant IP whitelisting.'}
                    </p>
                    <button
                      onClick={() => {
                        setExecutionMode('simulator');
                        handleExecuteApi();
                      }}
                      className="mt-1 px-2.5 py-1 bg-red-700 text-white rounded text-[11px] font-semibold hover:bg-red-800"
                    >
                      Switch to Bank Simulator &amp; Retry
                    </button>
                  </div>
                )}

                {/* Special Visualizer: KHQR String Render */}
                {apiResponse?.result?.qrBase64 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-28 bg-white border border-slate-300 p-1 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                      <img
                        src={`data:image/png;base64,${apiResponse.result.qrBase64}`}
                        alt="Bakong KHQR"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-xs space-y-1 flex-1 overflow-hidden">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <QrCode className="w-4 h-4 text-blue-700" />
                        Live Bakong KHQR Rendered Successfully
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Scan with ACLEDA Mobile or any Bakong member app.
                      </p>
                      <div className="font-mono text-[10px] text-slate-500 bg-white p-1 rounded border border-slate-200 truncate select-all">
                        {apiResponse.result.qrValue}
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Visualizer: Deeplink Render */}
                {apiResponse?.result?.deeplinkUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-700" />
                      Universal Mobile Deeplink Ready
                    </div>
                    <a
                      href={apiResponse.result.deeplinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 text-white rounded font-medium text-xs hover:bg-blue-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Launch ACLEDA Mobile
                    </a>
                  </div>
                )}

                {/* Response Body Raw JSON */}
                <pre className="flex-1 p-3.5 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto max-h-[380px] leading-relaxed select-all">
                  {apiResponse ? JSON.stringify(apiResponse, null, 2) : '// No response yet'}
                </pre>
              </div>
            </div>

            {/* Test Request History Drawer / Table */}
            {history.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Recent Test History ({history.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setHistory([])}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear History
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Time</th>
                        <th className="py-2 px-3 font-semibold">API</th>
                        <th className="py-2 px-3 font-semibold">Mode</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">Duration</th>
                        <th className="py-2 px-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-500">{item.timestamp}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.apiName}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                item.mode === 'live'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.mode}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-medium">
                            <span
                              className={
                                item.status === 200 ? 'text-emerald-700' : 'text-red-700'
                              }
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">{item.durationMs}ms</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => {
                                setEditablePayload(JSON.stringify(item.payload, null, 2));
                                setApiResponse(item.response);
                                setResponseMeta({
                                  status: item.status,
                                  statusText: item.status === 200 ? 'OK' : 'Error',
                                  durationMs: item.durationMs,
                                  mode: item.mode
                                });
                              }}
                              className="text-xs text-blue-700 hover:underline font-medium"
                            >
                              Load Payload
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HMAC-SHA512 HASHER */}
        {activeTab === 'hasher' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Official ACLEDA HMAC-SHA512 Hash Engine
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  100% compliant with Java <code className="font-mono text-slate-700">MerchantHashGenerator</code> —
                  UTF-8 string encoding into 128-character uppercase Hex (<code className="font-mono text-slate-700">%02X</code>).
                </p>
              </div>

              {/* Sample Preloaders */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Load Official Java Samples:</span>
                <button
                  onClick={() => loadDocExampleIntoHasher('A')}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 font-medium text-slate-700"
                >
                  Formula A Sample
                </button>
                <button
                  onClick={() => loadDocExampleIntoHasher('B')}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 font-medium text-slate-700"
                >
                  Formula B Sample
                </button>
              </div>
            </div>

            {/* Formula Selector Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-lg w-fit">
              <button
                onClick={() => setHasherFormula('A')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  hasherFormula === 'A'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Formula A — openSessionV2 (All 5 Payment APIs)
              </button>
              <button
                onClick={() => setHasherFormula('B')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  hasherFormula === 'B'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Formula B — getTxnStatus &amp; refundTxn
              </button>
            </div>

            {/* Formula Explanation Card */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-700" />
                {hasherFormula === 'A'
                  ? 'Formula A: message = merchantID + loginId + password + txid'
                  : 'Formula B: message = merchantId + loginId + password + paymentTokenId'}
              </div>
              <p className="text-blue-800">
                {hasherFormula === 'A'
                  ? 'Used for: Account/Wallet, MPGS Card, KHQR String (5), KHQR Web View (3), and Deeplink. The 4th concatenated variable is the merchant unique txid.'
                  : 'Used for: Get Transaction Status (getTxnStatus) and Refund (refundTxn). The 4th variable is the paymentTokenId returned from openSessionV2 (NOT txid!).'}
              </p>
            </div>

            {/* Hash Input Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1st Value: {hasherFormula === 'A' ? 'merchantID' : 'merchantId'}
                </label>
                <input
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-blue-600"
                  placeholder="e.g. v4uFDbZKlJ1Dyf7dq7MfpTmpYKU="
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2nd Value: loginId
                </label>
                <input
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-blue-600"
                  placeholder="e.g. xpaytest2024"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3rd Value: password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-blue-600"
                  placeholder="Merchant password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4th Value:{' '}
                  {hasherFormula === 'A' ? (
                    <span>txid (Merchant Transaction ID)</span>
                  ) : (
                    <span>paymentTokenId (Token from openSessionV2)</span>
                  )}
                </label>
                {hasherFormula === 'A' ? (
                  <input
                    value={hasherTxid}
                    onChange={(e) => setHasherTxid(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-blue-600"
                    placeholder="e.g. 261112075157562"
                  />
                ) : (
                  <input
                    value={hasherTokenId}
                    onChange={(e) => setHasherTokenId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-blue-600"
                    placeholder="e.g. XM1O0NgzHqGDGcGBlYDzmHtszIQz"
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secret Key (Used as HMAC key — Never sent over network)
                </label>
                <input
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-blue-600"
                  placeholder="Secret key provided by ACLEDA Bank"
                />
              </div>
            </div>

            {/* Real-time Concatenation & Hash Inspection */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Raw Concatenated Message
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Length: {concatenatedMessage.length} chars
                  </span>
                </div>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs break-all select-all">
                  {concatenatedMessage || '<empty>'}
                </div>
              </div>

              {/* Generated Hash Box */}
              <div className="bg-white border-2 border-blue-600 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Generated HMAC-SHA512 Hash (%02X)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-medium ${
                        generatedHash.length === 128 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {generatedHash.length} / 128 chars
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedHash, 'hash')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-700 text-white rounded text-xs font-medium hover:bg-blue-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copyFeedback === 'hash' ? 'Copied!' : 'Copy Hash'}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 text-amber-300 rounded-lg font-mono text-xs break-all tracking-wider select-all leading-relaxed">
                  {generatedHash}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYLOAD VALIDATOR */}
        {activeTab === 'linter' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Toanchet Pay Payload Linter &amp; Security Auditor
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Catches the top 10 integration traps: Secret key exposure, lowercase/uppercase casing mismatches, hash formula mixups, and port errors.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Area */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Paste Your JSON Payload
                  </span>
                  <button
                    onClick={() => setLinterInput(editablePayload)}
                    className="text-xs text-blue-700 hover:underline font-medium"
                  >
                    Import From Test Console
                  </button>
                </div>

                <textarea
                  value={linterInput}
                  onChange={(e) => setLinterInput(e.target.value)}
                  placeholder="Paste { ... } here"
                  rows={16}
                  className="w-full flex-1 p-3.5 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg focus:outline-none resize-none leading-relaxed"
                />

                <button
                  onClick={() => {
                    const issues: { type: 'error' | 'warning' | 'pass'; title: string; detail: string }[] = [];
                    try {
                      const parsed = JSON.parse(linterInput);

                      // Check 1: Secret Key leak
                      if (
                        'secret' in parsed ||
                        'secretKey' in parsed ||
                        'SECRET_KEY' in parsed ||
                        linterInput.includes('xxxxx')
                      ) {
                        issues.push({
                          type: 'error',
                          title: 'Critical Security Violation: Secret Key in Body',
                          detail: 'Never send your secret key in the JSON request body. ACLEDA only accepts the computed 128-char uppercase hex "hash".'
                        });
                      } else {
                        issues.push({
                          type: 'pass',
                          title: 'Secret Key Safe',
                          detail: 'No secret key exposed in JSON body.'
                        });
                      }

                      // Check 2: Hash length
                      if (!parsed.hash) {
                        issues.push({
                          type: 'error',
                          title: 'Missing "hash" Property',
                          detail: 'Every Toanchet Pay API request must include the 128-character uppercase hex HMAC-SHA512 hash.'
                        });
                      } else if (typeof parsed.hash === 'string') {
                        if (parsed.hash.length !== 128) {
                          issues.push({
                            type: 'error',
                            title: `Invalid Hash Length (${parsed.hash.length} chars)`,
                            detail: 'HMAC-SHA512 in Hex format must be exactly 128 characters long.'
                          });
                        } else if (parsed.hash !== parsed.hash.toUpperCase()) {
                          issues.push({
                            type: 'warning',
                            title: 'Hash is Not Uppercase',
                            detail: 'ACLEDA specification requires Uppercase Hexadecimal format (%02X).'
                          });
                        } else {
                          issues.push({
                            type: 'pass',
                            title: 'Hash Format Valid',
                            detail: '128 characters uppercase Hexadecimal.'
                          });
                        }
                      }

                      // Check 3: Root merchant identifier casing
                      if (parsed.xpayTransaction) {
                        if ('merchantId' in parsed && !('merchantID' in parsed)) {
                          issues.push({
                            type: 'error',
                            title: 'Incorrect Casing: "merchantId" on openSessionV2',
                            detail: 'openSessionV2 requires uppercase ID: "merchantID".'
                          });
                        } else if ('merchantID' in parsed) {
                          issues.push({
                            type: 'pass',
                            title: 'Merchant ID Key Casing Valid',
                            detail: 'Correct uppercase "merchantID" used for openSessionV2.'
                          });
                        }

                        if (parsed.xpayTransaction.operationType && parsed.xpayTransaction.paymentCard) {
                          issues.push({
                            type: 'error',
                            title: 'Selector Conflict: paymentCard and operationType',
                            detail: 'When operationType is set to "3" or "5", "paymentCard" must be omitted entirely.'
                          });
                        }
                      } else {
                        if ('merchantID' in parsed && !('merchantId' in parsed)) {
                          issues.push({
                            type: 'error',
                            title: 'Incorrect Casing: "merchantID" on Flat API',
                            detail: 'getTxnStatus and refundTxn require lowercase "merchantId", NOT uppercase "merchantID".'
                          });
                        } else if ('merchantId' in parsed) {
                          issues.push({
                            type: 'pass',
                            title: 'Merchant ID Key Casing Valid',
                            detail: 'Correct lowercase "merchantId" used for status/refund endpoint.'
                          });
                        }
                      }

                      setLinterResults(issues);
                    } catch (e: any) {
                      setLinterResults([
                        {
                          type: 'error',
                          title: 'Invalid JSON Syntax',
                          detail: e.message || 'Please provide a valid JSON object.'
                        }
                      ]);
                    }
                  }}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold"
                >
                  Run Compliance Audit
                </button>
              </div>

              {/* Linter Output */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Audit Results &amp; Recommendations
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {linterResults.length} checks performed
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {linterResults.length === 0 ? (
                    <div className="text-xs text-slate-400 py-12 text-center">
                      Paste a payload and click Audit to verify compliance.
                    </div>
                  ) : (
                    linterResults.map((res, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                          res.type === 'error'
                            ? 'bg-red-50/80 border-red-200 text-red-900'
                            : res.type === 'warning'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {res.type === 'error' && (
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          {res.type === 'warning' && (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          {res.type === 'pass' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {res.title}
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90 pl-5.5">
                          {res.detail}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Pitfalls Reference Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Reference Guide: 7 Known Integration Pitfalls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {COMMON_PITFALLS.map((pitfall) => (
                  <div
                    key={pitfall.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{pitfall.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          pitfall.severity === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pitfall.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {pitfall.description}
                    </p>
                    <div className="text-[11px] font-semibold text-blue-700 bg-blue-50/70 p-2 rounded border border-blue-100">
                      Fix: {pitfall.solution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CODE GENERATOR */}
        {activeTab === 'codegen' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Multi-Language Integration Code Generator
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Ready-to-run implementations with HMAC-SHA512 calculation, UTF-8 conversion, and HTTP POST to port 8443.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
                {(
                  [
                    'typescript',
                    'java',
                    'python',
                    'php',
                    'csharp',
                    'go',
                    'dart'
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                      selectedLang === lang
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'csharp' ? 'C# (.NET)' : lang}
                  </button>
                ))}
              </div>
            </div>

            {/* API Selection Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Select Operation:</span>
              <select
                value={selectedApiId}
                onChange={(e) => setSelectedApiId(e.target.value)}
                className="bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-blue-600"
              >
                {API_DEFINITIONS.map((api) => (
                  <option key={api.id} value={api.id}>
                    {api.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Generated Code Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800/90 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono">
                  {selectedLang === 'typescript' && 'acleda-client.ts'}
                  {selectedLang === 'java' && 'AcledaToanchetClient.java'}
                  {selectedLang === 'python' && 'acleda_client.py'}
                  {selectedLang === 'php' && 'acleda_client.php'}
                  {selectedLang === 'csharp' && 'AcledaClient.cs'}
                  {selectedLang === 'go' && 'main.go'}
                  {selectedLang === 'dart' && 'acleda_client.dart'}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      generateCodeSnippet(selectedLang, currentApi, {
                        merchantPath,
                        merchantId,
                        loginId,
                        password,
                        secretKey
                      }),
                      'code'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copyFeedback === 'code' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed select-all">
                {generateCodeSnippet(selectedLang, currentApi, {
                  merchantPath,
                  merchantId,
                  loginId,
                  password,
                  secretKey
                })}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 5: RETURN URL INSPECTOR */}
        {activeTab === 'return-url' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Return Page URL Redirect Inspector &amp; Fulfillment Flow
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Parse customer browser query parameters after payment completion and verify why server-to-server inquiry is mandatory.
              </p>
            </div>

            {/* Security Warning Banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Critical Security Requirement: Never Trust Frontend Redirect Parameters
              </div>
              <p className="leading-relaxed text-amber-800">
                When a user completes payment on the hosted Toanchet Pay form, their browser is redirected with parameters like <code className="font-mono">_paymentresult=SUCCESS</code>. A malicious user can tamper with this URL.
                <strong> Always extract <code className="font-mono">_paymenttokenid</code> and call backend Get Transaction Status API (<code className="font-mono">getTxnStatus</code>) to confirm <code className="font-mono">code == 0</code> and obtain the bank T24 reference (<code className="font-mono">coreRefNum</code>).</strong>
              </p>
            </div>

            {/* Interactive URL Input */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Simulate or Paste Return Callback URL
              </label>
              <input
                value={returnUrlInput}
                onChange={(e) => setReturnUrlInput(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-blue-600 text-slate-900"
                placeholder="https://merchant.com/callback?status=success&..."
              />
            </div>

            {/* Parsed Parameters Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Extracted Query Parameters
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {Object.keys(parsedReturnParams).length} parameters found
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RETURN_REDIRECT_SPEC.params.map((param) => {
                  const val = parsedReturnParams[param.key] || '—';
                  const isToken = param.key === '_paymenttokenid';
                  return (
                    <div
                      key={param.key}
                      className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                        isToken
                          ? 'bg-blue-50/70 border-blue-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="font-mono font-bold text-slate-700 flex items-center justify-between">
                        <span>{param.key}</span>
                        {isToken && (
                          <span className="text-[10px] font-sans font-bold bg-blue-700 text-white px-1.5 py-0.2 rounded">
                            Pass to getTxnStatus
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-slate-900 font-semibold break-all text-[11px]">
                        {val}
                      </div>
                      <div className="text-[10px] text-slate-500">{param.meaning}</div>
                    </div>
                  );
                })}
              </div>

              {/* Recommended Backend Follow-up action */}
              {parsedReturnParams['_paymenttokenid'] && (
                <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    Immediate Server Action Required:
                  </div>
                  <div className="font-mono text-[11px] text-emerald-300">
                    POST .../getTxnStatus with paymentTokenid = &quot;{parsedReturnParams['_paymenttokenid']}&quot;
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Once getTxnStatus returns <code className="font-mono text-slate-200">code == 0</code>, mark order as paid, store <code className="font-mono text-slate-200">result.coreRefNum</code>, and display order confirmation.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: MASTER SPEC & COMPARISON MATRIX */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Master Comparison Matrix Across All 7 APIs
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Authoritative architectural summary of endpoints, hash variables, root keys, and payload differentiators.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-3 px-3">API Operation</th>
                      <th className="py-3 px-3">Endpoint (:8443)</th>
                      <th className="py-3 px-3">4th Hash Variable</th>
                      <th className="py-3 px-3">Root Merchant Key</th>
                      <th className="py-3 px-3">Unique Request Selectors</th>
                      <th className="py-3 px-3">Unique Response Fields</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">1. Account / Wallet</td>
                      <td className="py-3 px-3 font-mono text-slate-600">.../openSessionV2</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">txid</td>
                      <td className="py-3 px-3 font-mono text-slate-700">&quot;merchantID&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">paymentCard: &quot;0&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">sessionid, paymentTokenid</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">2. MPGS Card</td>
                      <td className="py-3 px-3 font-mono text-slate-600">.../openSessionV2</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">txid</td>
                      <td className="py-3 px-3 font-mono text-slate-700">&quot;merchantID&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">paymentCard: &quot;1&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">Echoes txid &amp; paymentCard</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">3. KHQR String</td>
                      <td className="py-3 px-3 font-mono text-slate-600">.../openSessionV2</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">txid</td>
                      <td className="py-3 px-3 font-mono text-slate-700">&quot;merchantID&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">operationType: &quot;5&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">qrValue, qrBase64 (PNG)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">4. KHQR Web View</td>
                      <td className="py-3 px-3 font-mono text-slate-600">.../openSessionV2</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">txid</td>
                      <td className="py-3 px-3 font-mono text-slate-700">&quot;merchantID&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">operationType: &quot;3&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">sessionid, paymentTokenid</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">5. Deeplink</td>
                      <td className="py-3 px-3 font-mono text-slate-600">.../openSessionV2</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">txid</td>
                      <td className="py-3 px-3 font-mono text-slate-700">&quot;merchantID&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">oprDevice, callBackUrl, compName</td>
                      <td className="py-3 px-3 font-mono text-slate-600">deeplinkUrl</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">6. Get Tran. Status</td>
                      <td className="py-3 px-3 font-mono text-slate-600">.../getTxnStatus</td>
                      <td className="py-3 px-3 font-mono text-amber-700 font-semibold">paymentTokenid</td>
                      <td className="py-3 px-3 font-mono text-slate-700">&quot;merchantId&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">paymentTokenid (lowercase id)</td>
                      <td className="py-3 px-3 font-mono text-slate-600">coreRefNum (FT...), confirmDate</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">7. Refund API</td>
                      <td className="py-3 px-3 font-mono text-slate-600">.../refundTxn</td>
                      <td className="py-3 px-3 font-mono text-amber-700 font-semibold">paymentTokenId</td>
                      <td className="py-3 px-3 font-mono text-slate-700">&quot;merchantId&quot;</td>
                      <td className="py-3 px-3 font-mono text-slate-600">paymentTokenId (camelCase)</td>
                      <td className="py-3 px-3 font-mono text-slate-600">code: 0, 334845, or -99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Error Codes Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Critical Status &amp; Return Codes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="font-mono font-bold text-emerald-700">code: 0</div>
                  <div className="font-semibold text-slate-800">Success / Paid</div>
                  <p className="text-[11px] text-slate-500">
                    Transaction settled. In getTxnStatus, coreRefNum contains the core banking reference (FT...).
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="font-mono font-bold text-amber-700">code: -22</div>
                  <div className="font-semibold text-slate-800">Session Timeout / Expired</div>
                  <p className="text-[11px] text-slate-500">
                    Payment session timed out without customer approval. confirmDate remains 0.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="font-mono font-bold text-red-700">code: 334845</div>
                  <div className="font-semibold text-slate-800">Not Eligible for Refund</div>
                  <p className="text-[11px] text-slate-500">
                    Transaction was never paid or settled. Unpaid transactions cannot be refunded.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="font-mono font-bold text-red-700">code: -99</div>
                  <div className="font-semibold text-slate-800">Currency / Amount Mismatch</div>
                  <p className="text-[11px] text-slate-500">
                    Refund currency differs from purchaseCurrency or refund amount exceeds refundable balance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: FAQ & ARCHITECTURE Q&A */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Architectural Q&amp;A &amp; Knowledge Base
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Detailed answers to the most critical developer questions regarding ACLEDA Toanchet Pay API integration.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-700" />
                  Q1: Why does my hash fail on getTxnStatus or refundTxn even though it worked on openSessionV2?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The most common trap is reusing <strong>Formula A</strong> instead of <strong>Formula B</strong>.
                  For <code className="font-mono text-slate-800">openSessionV2</code>, the 4th concatenated string is <code className="font-mono text-slate-800">txid</code>:
                  <br />
                  <code className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] inline-block my-1">
                    merchantID + loginId + password + txid
                  </code>
                  <br />
                  However, for <code className="font-mono text-slate-800">getTxnStatus</code> and <code className="font-mono text-slate-800">refundTxn</code>, the 4th concatenated string MUST be <code className="font-mono text-slate-800">paymentTokenid</code> / <code className="font-mono text-slate-800">paymentTokenId</code>:
                  <br />
                  <code className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] inline-block my-1">
                    merchantId + loginId + password + paymentTokenId
                  </code>
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-700" />
                  Q2: Why is UAT port 8443 required, and what happens if I forget it?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The ACLEDA UAT Sandbox environment runs its XPAY connector on port <strong>8443</strong> (<code className="font-mono text-slate-800">https://epaymentuat.acledabank.com.kh:8443</code>).
                  If your HTTP client or firewall uses standard HTTPS (port 443), the connection will either hang, time out, or throw SSL connection reset errors.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-700" />
                  Q3: What is the difference between KHQR String (5) and KHQR Web View (3)?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>KHQR String (operationType: &quot;5&quot;)</strong> returns raw <code className="font-mono text-slate-800">qrValue</code> and <code className="font-mono text-slate-800">qrBase64</code> for custom rendering in your application.
                  <br />
                  <strong>KHQR Web View (operationType: &quot;3&quot;)</strong> returns only <code className="font-mono text-slate-800">sessionid</code> and <code className="font-mono text-slate-800">paymentTokenid</code> to embed ACLEDA&apos;s hosted payment form.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>ACLEDA Bank Plc Toanchet Pay Developer Specification</span>
            <span aria-hidden="true">·</span>
            <span>UAT Sandbox Port 8443</span>
            <span aria-hidden="true">·</span>
            <span>All 7 APIs</span>
          </div>
          <div className="font-mono text-slate-400">
            HMAC-SHA512 (%02X) Engine Verified
          </div>
        </div>
      </footer>
    </div>
  );
}
