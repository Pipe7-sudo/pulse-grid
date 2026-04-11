import { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  AlertTriangle, Clock, MapPin, MessageCircle, ShieldAlert,
  CheckCircle, XCircle, Navigation, Radio, Ambulance, Building2,
  X, Inbox, Archive, ChevronDown, LogOut
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://pulse-grid-backend.onrender.com';

// ─── Types ────────────────────────────────────────────────────────────────────
type TriageStatus = 'red' | 'yellow' | 'green';

interface NearestHospital {
  id: string; name: string; lga: string; distanceKm: number;
  type: string; specialties: string[]; phone: string;
}

interface AlertCard {
  id: string; time: Date; status: TriageStatus;
  summary: string; transcript: string; instructions: string;
  location: [number, number]; address: string;
  nearestHospitals?: NearestHospital[];
  patient_phone?: string; sandbox_number?: string;
  updatedAt?: string;
}

interface ResolvedCase extends AlertCard {
  resolvedAt: string;
  action: 'dispatch' | 'invite';
  resolvedBy: string;
}

interface HospitalEntry {
  id: string; name: string; lga: string; type: string; phone: string;
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
const LS_ALERTS = 'pg_alerts_v2';
const LS_ACCEPTING = 'pg_accepting';
const LS_HOSPITAL = 'pg_hospital';
const LS_RESOLVED = (id: string) => `pg_resolved_${id}`;

function saveAlertsLS(a: AlertCard[]) { localStorage.setItem(LS_ALERTS, JSON.stringify(a)); }
function loadAlertsLS(): AlertCard[] { try { return (JSON.parse(localStorage.getItem(LS_ALERTS) || '[]') as any[]).map(a => ({ ...a, time: new Date(a.time) })); } catch { return []; } }
function loadAcceptingLS(): boolean { return localStorage.getItem(LS_ACCEPTING) !== 'false'; }
function saveAcceptingLS(v: boolean) { localStorage.setItem(LS_ACCEPTING, String(v)); }
function loadHospitalLS(): HospitalEntry | null { try { return JSON.parse(localStorage.getItem(LS_HOSPITAL) || 'null'); } catch { return null; } }
function saveHospitalLS(h: HospitalEntry) { localStorage.setItem(LS_HOSPITAL, JSON.stringify(h)); }
function loadResolvedLS(hid: string): ResolvedCase[] { try { return (JSON.parse(localStorage.getItem(LS_RESOLVED(hid)) || '[]') as any[]).map(a => ({ ...a, time: new Date(a.time) })); } catch { return []; } }
function saveResolvedLS(hid: string, c: ResolvedCase[]) { localStorage.setItem(LS_RESOLVED(hid), JSON.stringify(c)); }

// ─── Dispatch Modal ───────────────────────────────────────────────────────────
function DispatchModal({ alert, hospital, onClose, onConfirm }: {
  alert: AlertCard; hospital: HospitalEntry | null;
  onClose: () => void;
  onConfirm: (id: string, action: 'dispatch' | 'invite') => void;
}) {
  const isRed = alert.status === 'red';
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-6 ${isRed ? 'bg-red-50 border-b border-red-100' : alert.status === 'yellow' ? 'bg-amber-50 border-b border-amber-100' : 'bg-green-50 border-b border-green-100'}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <span className={`text-xs font-black tracking-widest uppercase px-2 py-1 rounded ${isRed ? 'bg-red-100 text-red-700' : alert.status === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                CODE {alert.status.toUpperCase()} · {alert.id}
              </span>
              <p className="mt-3 text-slate-800 font-bold text-base leading-snug">{alert.summary}</p>
              {alert.nearestHospitals?.[0] && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={10} className="text-teal-500 shrink-0" />
                  Nearest: {alert.nearestHospitals[0].name} ({alert.nearestHospitals[0].distanceKm} km)
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        {/* Responding as */}
        {hospital && (
          <div className="px-6 pt-4 pb-0">
            <p className="text-[11px] text-slate-400 font-medium">Responding as <span className="text-teal-700 font-bold">{hospital.name}</span></p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">How will you respond?</p>

          <button onClick={() => onConfirm(alert.id, 'dispatch')}
            className="w-full flex items-center gap-4 p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-[0_4px_15px_rgba(220,38,38,0.3)] group">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Ambulance size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-base">Dispatch Ambulance</p>
              <p className="text-xs text-red-100 mt-0.5">Send medical team to patient's location</p>
            </div>
          </button>

          <button onClick={() => onConfirm(alert.id, 'invite')}
            className="w-full flex items-center gap-4 p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition-all shadow-[0_4px_15px_rgba(13,148,136,0.3)] group">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-base">Invite to Hospital</p>
              <p className="text-xs text-teal-100 mt-0.5">Patient can come in — send directions & ETA</p>
            </div>
          </button>

          <button onClick={onClose} className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>

        {/* Nearest Hospitals */}
        {(alert.nearestHospitals?.length ?? 0) > 0 && (
          <div className="px-6 pb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Nearby Facilities</p>
            <div className="space-y-2">
              {alert.nearestHospitals!.slice(0, 3).map(h => (
                <div key={h.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{h.name}</p>
                    <p className="text-[10px] text-slate-400">{h.type} · {h.lga}</p>
                  </div>
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">{h.distanceKm} km</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Map auto-pan ─────────────────────────────────────────────────────────────
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentHospital, setCurrentHospital] = useState<HospitalEntry | null>(loadHospitalLS);
  const [hospitalList, setHospitalList] = useState<HospitalEntry[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');

  // Dashboard
  const [isAccepting, setIsAccepting] = useState<boolean>(loadAcceptingLS);
  const [activeAlert, setActiveAlert] = useState<AlertCard | null>(null);
  const [alerts, setAlerts] = useState<AlertCard[]>(loadAlertsLS);
  const [resolvedCases, setResolvedCases] = useState<ResolvedCase[]>([]);
  const [dispatchTarget, setDispatchTarget] = useState<AlertCard | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  // Tick
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 1000); return () => clearInterval(t); }, []);

  // Load hospital list on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/hospitals`)
      .then(r => r.json())
      .then(setHospitalList)
      .catch(console.error);
  }, []);

  // If already logged in from localStorage, rejoin socket room
  useEffect(() => {
    if (currentHospital && !isAuthenticated) {
      socket.emit('join_hospital', currentHospital.id);
      setIsAuthenticated(true);
      loadInitialState(currentHospital.id);
    }
  }, [currentHospital]);

  const loadInitialState = useCallback((hospitalId: string) => {
    fetch(`${API_BASE}/api/hospital/state`)
      .then(r => r.json())
      .then(data => {
        setIsAccepting(data.isAccepting);
        saveAcceptingLS(data.isAccepting);
        // Filter alerts to only those visible to this hospital
        const mine = (data.activeAlerts as any[])
          .filter(a => a.nearestHospitals?.some((h: any) => h.id === hospitalId))
          .map(a => ({ ...a, time: new Date(a.time) }));
        setAlerts(mine);
        saveAlertsLS(mine);
      })
      .catch(() => { /* offline: use localStorage */ });

    fetch(`${API_BASE}/api/hospital/resolved/${hospitalId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const cases = data.map(a => ({ ...a, time: new Date(a.time) })) as ResolvedCase[];
        setResolvedCases(cases);
        saveResolvedLS(hospitalId, cases);
      })
      .catch(() => {
        setResolvedCases(loadResolvedLS(hospitalId));
      });
  }, []);

  // Socket events
  useEffect(() => {
    socket.on('new_alert', (data) => {
      const alert: AlertCard = { ...data, time: new Date(data.time) };
      setAlerts(prev => {
        const updated = [alert, ...prev];
        saveAlertsLS(updated);
        return updated;
      });
    });

    socket.on('update_alert', (data) => {
      const updated: AlertCard = { ...data, time: new Date(data.time) };
      setAlerts(prev => {
        const idx = prev.findIndex(a => a.patient_phone === updated.patient_phone || a.id === updated.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = updated;
        saveAlertsLS(next);
        return next;
      });
      // Also update detail panel if this was the active one
      setActiveAlert(curr => (curr?.patient_phone === updated.patient_phone || curr?.id === updated.id) ? updated : curr);
    });

    socket.on('capacity_update', ({ isAccepting: val }) => {
      setIsAccepting(val);
      saveAcceptingLS(val);
    });

    socket.on('dispatch_action', ({ id }) => {
      setAlerts(prev => {
        const updated = prev.filter(a => a.id !== id);
        saveAlertsLS(updated);
        return updated;
      });
      setActiveAlert(curr => curr?.id === id ? null : curr);
    });

    return () => {
      socket.off('new_alert');
      socket.off('update_alert');
      socket.off('capacity_update');
      socket.off('dispatch_action');
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!selectedHospitalId) { setLoginError('Please select your hospital.'); return; }
    if (password !== 'pulsegrid2025') { setLoginError('Incorrect password.'); return; }
    const hospital = hospitalList.find(h => h.id === selectedHospitalId);
    if (!hospital) { setLoginError('Hospital not found.'); return; }
    setCurrentHospital(hospital);
    saveHospitalLS(hospital);
    socket.emit('join_hospital', hospital.id);
    setIsAuthenticated(true);
    loadInitialState(hospital.id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentHospital(null);
    localStorage.removeItem(LS_HOSPITAL);
    // Force a fresh socket state if needed, though join_hospital usually handles it
  };

  if (!isAuthenticated) {
    const filteredHospitals = hospitalFilter
      ? hospitalList.filter(h => h.name.toLowerCase().includes(hospitalFilter.toLowerCase()) || h.lga.toLowerCase().includes(hospitalFilter.toLowerCase()))
      : hospitalList;

    return (
      <div className="flex h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 items-center justify-center font-sans p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 text-teal-600 mb-8 justify-center">
            <ShieldAlert size={40} />
            <h1 className="text-3xl font-black tracking-tight">PulseGrid</h1>
          </div>
          <h2 className="text-center font-bold text-slate-800 text-lg mb-1">Hospital System Login</h2>
          <p className="text-center text-xs text-slate-400 mb-6">Select your facility and enter your access code</p>

          <div className="space-y-4">
            {/* Hospital search + select */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Search Hospital</label>
              <input
                type="text" placeholder="Type to filter..." value={hospitalFilter}
                onChange={e => setHospitalFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="relative">
                <select
                  value={selectedHospitalId}
                  onChange={e => setSelectedHospitalId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                >
                  <option value="">-- Select your hospital --</option>
                  {filteredHospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.lga})</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Access Code</label>
              <input
                type="password" placeholder="••••••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {loginError && <p className="text-red-600 text-xs font-semibold">{loginError}</p>}

            <button onClick={handleLogin}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold mt-2 shadow-lg transition-all flex justify-center items-center gap-2">
              <ShieldAlert size={18} /> Secure Access
            </button>

            <p className="text-center text-[11px] text-slate-400">Demo access code: <span className="font-mono font-bold text-slate-600">pulsegrid2025</span></p>
          </div>
        </div>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAcceptClick = (alert: AlertCard) => setDispatchTarget(alert);

  const handleDispatchConfirm = async (id: string, action: 'dispatch' | 'invite') => {
    setDispatchTarget(null);
    const resolvedAlert = alerts.find(a => a.id === id);

    // Optimistic removal from active list
    setAlerts(prev => { const u = prev.filter(a => a.id !== id); saveAlertsLS(u); return u; });
    if (activeAlert?.id === id) setActiveAlert(null);

    await fetch(`${API_BASE}/api/dispatch/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, hospitalId: currentHospital?.id })
    }).then(r => r.json()).then(data => {
      if (data.success && resolvedAlert && currentHospital) {
        const resolved: ResolvedCase = {
          ...resolvedAlert,
          resolvedAt: new Date().toISOString(),
          action,
          resolvedBy: currentHospital.id
        };
        setResolvedCases(prev => {
          const updated = [resolved, ...prev];
          saveResolvedLS(currentHospital.id, updated);
          return updated;
        });
        setActiveTab('resolved');
      }
    }).catch(console.error);
  };

  const handleNoCapacity = async (id: string) => {
    setAlerts(prev => { const u = prev.filter(a => a.id !== id); saveAlertsLS(u); return u; });
    if (activeAlert?.id === id) setActiveAlert(null);
    await fetch(`${API_BASE}/api/dispatch/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'divert', hospitalId: currentHospital?.id })
    }).catch(console.error);
  };

  const handleCloseCase = (caseId: string) => {
    setResolvedCases(prev => {
      const updated = prev.filter(c => c.id !== caseId);
      if (currentHospital) saveResolvedLS(currentHospital.id, updated);
      return updated;
    });
  };

  const toggleCapacity = async () => {
    const next = !isAccepting;
    setIsAccepting(next); saveAcceptingLS(next);
    await fetch(`${API_BASE}/api/hospital/capacity`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAccepting: next })
    }).catch(console.error);
  };

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <>
      {dispatchTarget && (
        <DispatchModal
          alert={dispatchTarget} hospital={currentHospital}
          onClose={() => setDispatchTarget(null)}
          onConfirm={handleDispatchConfirm}
        />
      )}

      <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans">

        {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
        <div className="w-[20%] min-w-[260px] border-r border-slate-200 flex flex-col p-6 bg-slate-50">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <ShieldAlert size={28} />
              <h1 className="text-2xl font-black tracking-tight">PulseGrid</h1>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Command Center</p>
          </div>

          {currentHospital && (
            <div className="mb-6 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-0.5">Logged in as</p>
              <p className="text-xs font-bold text-teal-800 leading-tight">{currentHospital.name}</p>
              <p className="text-[10px] text-teal-600">{currentHospital.type} · {currentHospital.lga}</p>
            </div>
          )}

          <div className="flex-1">
            {/* Active count */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden mb-3">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Queue</p>
              <div className="text-3xl font-black text-slate-800 flex items-baseline gap-2">
                {alerts.length} <span className="text-sm font-semibold text-slate-400">cases</span>
              </div>
              <div className="mt-2 flex gap-1.5 flex-wrap text-[11px]">
                <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded font-bold">
                  RED {alerts.filter(a => a.status === 'red').length}
                </span>
                <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded font-bold">
                  YLW {alerts.filter(a => a.status === 'yellow').length}
                </span>
                <span className="bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded font-bold">
                  GRN {alerts.filter(a => a.status === 'green').length}
                </span>
              </div>
            </div>
            {/* Resolved count */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">My Cases (Session)</p>
              <div className="text-2xl font-black text-slate-600">{resolvedCases.length}</div>
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest text-center">Master Capacity</p>
            <button onClick={toggleCapacity}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all duration-300 ${isAccepting
                ? 'bg-teal-600 text-white shadow-[0_8px_20px_rgba(13,148,136,0.3)] hover:bg-teal-700'
                : 'bg-slate-200 text-slate-500 shadow-inner hover:bg-slate-300'
                }`}>
              {isAccepting
                ? <><CheckCircle size={18} /> ER ACCEPTING</>
                : <><XCircle size={18} className="text-slate-500" /> ER FULL — DIVERTING</>}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
            >
              <LogOut size={12} /> Logout System
            </button>
          </div>
        </div>

        {/* ── Center Panel ──────────────────────────────────────────────────── */}
        <div className="w-[40%] border-r border-slate-200 flex flex-col bg-white">
          {/* Tab header */}
          <div className="p-4 border-b border-slate-100 shrink-0">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                <Inbox size={15} /> Active
                {alerts.length > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'active' ? 'bg-teal-100 text-teal-700' : 'bg-slate-300 text-slate-600'}`}>
                    {alerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'resolved' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                <Archive size={15} /> My Cases
                {resolvedCases.length > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === 'resolved' ? 'bg-slate-200 text-slate-700' : 'bg-slate-300 text-slate-600'}`}>
                    {resolvedCases.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'active' && (
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-teal-600" />
                  <span className="text-xs font-bold text-slate-600">WhatsApp Triage Feed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">Live</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {/* ── Active Alerts ── */}
            {activeTab === 'active' && (
              <>
                {alerts.map(alert => {
                  const isRed = alert.status === 'red';
                  const isYellow = alert.status === 'yellow';
                  const isActive = activeAlert?.id === alert.id;
                  return (
                    <div key={alert.id}
                      onClick={() => setActiveAlert(alert)}
                      className={`card-enter p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${isActive ? 'ring-4 ring-teal-500/20' : 'hover:shadow-md'
                        } ${isRed ? 'bg-red-50/40 border-red-500 hover:border-red-600 pulse-red' :
                          isYellow ? 'bg-amber-50/30 border-amber-400 hover:border-amber-500' :
                            'bg-green-50/30 border-green-400 hover:border-green-500'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2.5 py-1.5 rounded-md text-xs font-black tracking-wider ${isRed ? 'bg-red-100 text-red-700' : isYellow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>
                          CODE {alert.status.toUpperCase()}
                        </span>
                        <div className="flex items-center font-mono text-xs font-semibold text-slate-400 gap-1.5 bg-white px-2 py-1 rounded border border-slate-100">
                          <Clock size={11} className={isRed ? 'text-red-400' : isYellow ? 'text-amber-400' : 'text-green-400'} />
                          {formatDistanceToNow(alert.time)} ago
                        </div>
                      </div>

                      <h3 className="text-sm font-bold mb-3 text-slate-800 leading-snug">{alert.summary}</h3>

                      {alert.nearestHospitals?.[0] && (
                        <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100">
                          <MapPin size={9} className="text-teal-500 shrink-0" />
                          <span className="font-semibold text-slate-600 truncate">{alert.nearestHospitals[0].name}</span>
                          <span className="ml-auto text-teal-600 font-bold shrink-0">{alert.nearestHospitals[0].distanceKm} km</span>
                        </p>
                      )}

                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleAcceptClick(alert)}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                          <CheckCircle size={14} /> Accept
                        </button>
                        <button onClick={() => handleNoCapacity(alert.id)}
                          className="flex-1 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 py-2 rounded-xl text-xs font-bold transition-colors">
                          No Capacity
                        </button>
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Radio size={40} className="mx-auto mb-3 text-slate-200 opacity-50" />
                    <p className="font-bold text-slate-400">No active alerts</p>
                    <p className="text-xs mt-1">Waiting for WhatsApp triage feed...</p>
                  </div>
                )}
              </>
            )}

            {/* ── Resolved Cases ── */}
            {activeTab === 'resolved' && (
              <>
                {resolvedCases.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${c.action === 'dispatch' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-teal-50 text-teal-600 border border-teal-100'
                        }`}>
                        {c.action === 'dispatch' ? '🚑 Dispatched' : '🏥 Invited'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.id}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">{c.summary}</p>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Resolved {formatDistanceToNow(new Date(c.resolvedAt))} ago
                      {c.patient_phone && <> · <span className="font-mono">{c.patient_phone.replace('whatsapp:', '')}</span></>}
                    </p>
                    <button onClick={() => handleCloseCase(c.id)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                      <X size={12} /> Close Case
                    </button>
                  </div>
                ))}
                {resolvedCases.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Archive size={40} className="mx-auto mb-3 text-slate-200 opacity-50" />
                    <p className="font-bold text-slate-400">No resolved cases yet</p>
                    <p className="text-xs mt-1">Cases appear here after you accept or invite</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right Panel: Detail & Map ──────────────────────────────────────── */}
        <div className="w-[40%] flex flex-col bg-slate-50">
          <div className="p-5 border-b border-slate-200 bg-white shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <MapPin className="text-teal-600" size={20} /> Patient Detail & Map View
            </h2>
          </div>

          {activeAlert ? (
            <div className="flex-1 overflow-y-auto">
              {/* Map */}
              <div className="h-64 bg-slate-200 relative border-b border-slate-200">
                <MapContainer center={activeAlert.location} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={activeAlert.location}>
                    <Popup className="font-sans font-bold">Emergency Location<br />{activeAlert.id}</Popup>
                  </Marker>
                  <MapUpdater center={activeAlert.location} />
                </MapContainer>
              </div>

              {/* Location */}
              <div className="px-5 py-4 bg-white border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-bold text-slate-800">{activeAlert.address}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">GPS: {activeAlert.location[0].toFixed(5)}, {activeAlert.location[1].toFixed(5)}</p>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeAlert.location[0]},${activeAlert.location[1]}`, '_blank')}
                  className="mt-3 w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  <Navigation size={16} className="text-teal-400" /> Generate Route
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Status indicator */}
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border ${activeAlert.status === 'red' ? 'bg-red-50 border-red-100 text-red-700' :
                  activeAlert.status === 'yellow' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    'bg-green-50 border-green-100 text-green-700'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${activeAlert.status === 'red' ? 'bg-red-500' : activeAlert.status === 'yellow' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                  CODE {activeAlert.status.toUpperCase()} — {activeAlert.id}
                  {activeAlert.updatedAt && <span className="ml-auto text-[10px] font-normal opacity-70">Updated {formatDistanceToNow(new Date(activeAlert.updatedAt))} ago</span>}
                </div>

                {/* AI Instructions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>AI First Aid Instructions
                  </h4>
                  <div className="bg-white border border-teal-100 rounded-2xl p-4 text-sm text-slate-700 font-medium leading-relaxed shadow-sm">
                    {activeAlert.instructions.split('\n').map((line, i) => (
                      <p key={i} className="mb-1.5 last:mb-0">{line}</p>
                    ))}
                  </div>
                </div>

                {/* Nearest Hospitals */}
                {(activeAlert.nearestHospitals?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>Nearest Facilities
                    </h4>
                    <div className="space-y-1.5">
                      {activeAlert.nearestHospitals!.map((h, i) => (
                        <div key={h.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${i === 0 ? 'bg-teal-500' : 'bg-slate-300'}`}>{i + 1}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{h.name}</p>
                              <p className="text-[10px] text-slate-400">{h.type} · {h.lga}</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 shrink-0 ml-2">{h.distanceKm} km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Transcript */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>Live WhatsApp Chat
                  </h4>
                  <div className="bg-slate-900 rounded-2xl p-4 text-sm text-slate-300 font-mono leading-relaxed space-y-2.5 shadow-inner">
                    {activeAlert.transcript.split('\n').map((line, idx) => {
                      const isOp = line.startsWith('PulseGrid AI:');
                      let senderName = isOp ? 'PulseGrid AI' : 'Patient';
                      let content = line;
                      if (isOp) { content = line.replace(/^PulseGrid AI:\s*/, ''); }
                      else {
                        const splitIdx = line.indexOf(':');
                        if (splitIdx !== -1 && splitIdx < 30) {
                          senderName = line.substring(0, splitIdx).trim().replace('whatsapp:', '');
                          content = line.substring(splitIdx + 1).trim();
                        }
                      }
                      return (
                        <div key={idx} className={`flex w-full ${isOp ? 'justify-start' : 'justify-end'}`}>
                          <div className={`flex flex-col max-w-[85%] ${isOp ? 'items-start' : 'items-end'}`}>
                            <div className={`px-3 py-2 rounded-xl text-xs ${isOp ? 'bg-slate-800 text-slate-300 rounded-tl-none' : 'bg-teal-900 text-teal-100 rounded-tr-none'}`}>
                              <span className={`text-[9px] uppercase tracking-wider font-bold block mb-1 ${isOp ? 'text-slate-500' : 'text-teal-400'}`}>{senderName}</span>
                              <span>{content}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <AlertTriangle size={54} className="mb-5 text-slate-200" />
              <p className="text-lg font-bold text-slate-400">No Patient Selected</p>
              <p className="text-sm mt-2 text-slate-400/70 max-w-xs">Select an alert from the triage board to view details and map.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
