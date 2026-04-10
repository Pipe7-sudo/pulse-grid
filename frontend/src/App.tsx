import { useState, useEffect } from 'react';
import { socket } from './socket';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { AlertTriangle, Clock, MapPin, MessageCircle, ShieldAlert, CheckCircle, XCircle, Navigation, Radio, Ambulance, Building2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type TriageStatus = 'red' | 'yellow';

interface NearestHospital {
  id: string;
  name: string;
  lga: string;
  distanceKm: number;
  type: string;
  specialties: string[];
  phone: string;
}

interface AlertCard {
  id: string;
  time: Date;
  status: TriageStatus;
  summary: string;
  transcript: string;
  instructions: string;
  location: [number, number];
  address: string;
  nearestHospitals?: NearestHospital[];
  patient_phone?: string;
  sandbox_number?: string;
}

// ─── LocalStorage helpers ──────────────────────────────────────────────────────
const LS_ALERTS = 'pg_alerts';
const LS_ACCEPTING = 'pg_accepting';

function loadAlertsFromStorage(): AlertCard[] {
  try {
    const raw = localStorage.getItem(LS_ALERTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((a: any) => ({ ...a, time: new Date(a.time) }));
  } catch { return []; }
}

function saveAlertsToStorage(alerts: AlertCard[]) {
  localStorage.setItem(LS_ALERTS, JSON.stringify(alerts));
}

function loadAcceptingFromStorage(): boolean {
  return localStorage.getItem(LS_ACCEPTING) !== 'false';
}

function saveAcceptingToStorage(v: boolean) {
  localStorage.setItem(LS_ACCEPTING, String(v));
}

// ─── Dispatch Modal ────────────────────────────────────────────────────────────
interface DispatchModalProps {
  alert: AlertCard;
  onClose: () => void;
  onConfirm: (id: string, action: 'dispatch' | 'invite') => void;
}

function DispatchModal({ alert, onClose, onConfirm }: DispatchModalProps) {
  const isRed = alert.status === 'red';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 ${isRed ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-xs font-black tracking-widest uppercase px-2 py-1 rounded ${isRed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                CODE {alert.status.toUpperCase()} · {alert.id}
              </span>
              <p className="mt-3 text-slate-800 font-bold text-base leading-snug">{alert.summary}</p>
              {alert.nearestHospitals && alert.nearestHospitals.length > 0 && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={11} className="text-teal-500" />
                  Nearest: {alert.nearestHospitals[0].name} ({alert.nearestHospitals[0].distanceKm} km)
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-4">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action choice */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">How will you respond?</p>

          <button
            onClick={() => onConfirm(alert.id, 'dispatch')}
            className="w-full flex items-center gap-4 p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.45)] group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Ambulance size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-base">Dispatch Ambulance</p>
              <p className="text-xs text-red-100 mt-0.5">Send medical team to patient's location</p>
            </div>
          </button>

          <button
            onClick={() => onConfirm(alert.id, 'invite')}
            className="w-full flex items-center gap-4 p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition-all shadow-[0_4px_15px_rgba(13,148,136,0.3)] hover:shadow-[0_4px_20px_rgba(13,148,136,0.45)] group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-base">Invite to Hospital</p>
              <p className="text-xs text-teal-100 mt-0.5">Patient can come in — send directions & ETA</p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Nearest Hospitals list */}
        {alert.nearestHospitals && alert.nearestHospitals.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Nearest Facilities</p>
            <div className="space-y-2">
              {alert.nearestHospitals.slice(0, 3).map(h => (
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

// ─── Map auto-pan component ────────────────────────────────────────────────────
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAccepting, setIsAccepting] = useState<boolean>(loadAcceptingFromStorage);
  const [activeAlert, setActiveAlert] = useState<AlertCard | null>(null);
  const [alerts, setAlerts] = useState<AlertCard[]>(loadAlertsFromStorage);
  const [dispatchTarget, setDispatchTarget] = useState<AlertCard | null>(null);

  // Tick clock
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Sync from backend on mount (backend is source of truth; localStorage is fallback)
  useEffect(() => {
    fetch('http://localhost:5000/api/hospital/state')
      .then(r => r.json())
      .then(data => {
        const synced = data.isAccepting;
        setIsAccepting(synced);
        saveAcceptingToStorage(synced);

        const backendAlerts: AlertCard[] = data.activeAlerts.map((a: any) => ({ ...a, time: new Date(a.time) }));
        setAlerts(backendAlerts);
        saveAlertsToStorage(backendAlerts);
      })
      .catch(() => {/* offline: localStorage already loaded */ });
  }, []);

  // Socket events
  useEffect(() => {
    socket.on('new_alert', (data) => {
      const alert: AlertCard = { ...data, time: new Date(data.time) };
      setAlerts(prev => {
        const updated = [alert, ...prev];
        saveAlertsToStorage(updated);
        return updated;
      });
    });

    socket.on('capacity_update', ({ isAccepting: val }) => {
      setIsAccepting(val);
      saveAcceptingToStorage(val);
    });

    socket.on('dispatch_action', ({ id }) => {
      setAlerts(prev => {
        const updated = prev.filter(a => a.id !== id);
        saveAlertsToStorage(updated);
        return updated;
      });
      setActiveAlert(curr => curr?.id === id ? null : curr);
    });

    return () => {
      socket.off('new_alert');
      socket.off('capacity_update');
      socket.off('dispatch_action');
    };
  }, []);

  // ── Auth screen ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 items-center justify-center font-sans">
        <div className="w-[400px] bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 text-teal-600 mb-8 justify-center">
            <ShieldAlert size={40} />
            <h1 className="text-3xl font-black tracking-tight">PulseGrid</h1>
          </div>
          <h2 className="text-center font-bold text-slate-800 text-lg mb-6">Hospital System Login</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Staff ID / Email</label>
              <input id="staff-id" type="text" placeholder="Dr. Jane Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Password</label>
              <input id="password" type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <button
              id="login-btn"
              onClick={() => setIsAuthenticated(true)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold mt-4 shadow-lg transition-all flex justify-center items-center gap-2"
            >
              <ShieldAlert size={18} /> Secure Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleAcceptClick = (alert: AlertCard) => {
    setDispatchTarget(alert); // show modal
  };

  const handleDispatchConfirm = async (id: string, action: 'dispatch' | 'invite') => {
    setDispatchTarget(null);
    // Optimistic update
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAlertsToStorage(updated);
      return updated;
    });
    if (activeAlert?.id === id) setActiveAlert(null);

    await fetch(`http://localhost:5000/api/dispatch/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    }).catch(console.error);
  };

  const handleNoCapacity = async (id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAlertsToStorage(updated);
      return updated;
    });
    if (activeAlert?.id === id) setActiveAlert(null);

    await fetch(`http://localhost:5000/api/dispatch/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'divert' })
    }).catch(console.error);
  };

  const toggleCapacity = async () => {
    const next = !isAccepting;
    setIsAccepting(next);
    saveAcceptingToStorage(next);
    await fetch('http://localhost:5000/api/hospital/capacity', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAccepting: next })
    }).catch(console.error);
  };

  // ── Dashboard layout ────────────────────────────────────────────────────────
  return (
    <>
      {/* Dispatch Modal */}
      {dispatchTarget && (
        <DispatchModal
          alert={dispatchTarget}
          onClose={() => setDispatchTarget(null)}
          onConfirm={handleDispatchConfirm}
        />
      )}

      <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans">

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <div className="w-[20%] border-r border-slate-200 flex flex-col p-6 bg-slate-50 min-w-[280px]">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-teal-600 mb-2">
              <ShieldAlert size={32} />
              <h1 className="text-2xl font-black tracking-tight">PulseGrid</h1>
            </div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Command Center</h2>
          </div>

          <div className="mb-8 flex-1">
            <h3 className="text-xl font-bold text-slate-800">LASUTH Emergency</h3>
            <p className="text-sm text-slate-500 mt-1">Lagos State University Tech Hospital</p>

            <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Triage Queue</p>
              <div className="text-4xl font-black text-slate-800 flex items-baseline gap-2">
                {alerts.length} <span className="text-sm font-semibold text-slate-500">Incoming</span>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded font-bold">
                  RED: {alerts.filter(a => a.status === 'red').length}
                </span>
                <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded font-bold">
                  YELLOW: {alerts.filter(a => a.status === 'yellow').length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest text-center">Master Capacity Toggle</p>
            <button
              id="capacity-toggle"
              onClick={toggleCapacity}
              className={`w-full py-5 rounded-2xl font-black text-[15px] flex items-center justify-center gap-3 transition-all duration-300 ${isAccepting
                ? 'bg-teal-600 text-white shadow-[0_8px_20px_rgba(13,148,136,0.3)] hover:bg-teal-700'
                : 'bg-slate-200 text-slate-500 shadow-inner hover:bg-slate-300'
                }`}
            >
              {isAccepting ? (
                <><CheckCircle size={20} /> ER ACCEPTING PATIENTS</>
              ) : (
                <><XCircle size={20} className="text-slate-500" /> ER FULL - DIVERTING</>
              )}
            </button>
          </div>
        </div>

        {/* ── Center Panel: Triage Board ────────────────────────────────────── */}
        <div className="w-[40%] border-r border-slate-200 flex flex-col bg-white">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="text-teal-600" />
                Active WhatsApp Triage
              </h2>
              <p className="text-xs text-slate-400 mt-1">Live socket feed from backend</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
              <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                LIVE
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {alerts.map(alert => {
              const isRed = alert.status === 'red';
              const isActive = activeAlert?.id === alert.id;

              return (
                <div
                  key={alert.id}
                  onClick={() => setActiveAlert(alert)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${isActive ? 'ring-4 ring-teal-500/20' : 'hover:shadow-md'
                    } ${isRed
                      ? 'bg-red-50/30 border-red-500 hover:border-red-600'
                      : 'bg-amber-50/30 border-amber-400 hover:border-amber-500'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1.5 rounded-md text-xs font-black tracking-wider ${isRed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      CODE {alert.status.toUpperCase()}
                    </span>
                    <div className="flex items-center font-mono text-xs font-semibold text-slate-500 gap-1.5 bg-white px-2 py-1 rounded border border-slate-200">
                      <Clock size={12} className={isRed ? 'text-red-500' : 'text-amber-500'} />
                      {formatDistanceToNow(alert.time)} ago
                    </div>
                  </div>

                  <h3 className="text-base font-bold mb-4 text-slate-800 leading-snug">{alert.summary}</h3>

                  {/* Nearest hospital indicator */}
                  {alert.nearestHospitals && alert.nearestHospitals[0] && (
                    <p className="text-[11px] text-slate-500 mb-4 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                      <MapPin size={10} className="text-teal-500 shrink-0" />
                      Nearest: <span className="font-semibold text-slate-700 ml-0.5">{alert.nearestHospitals[0].name}</span>
                      <span className="ml-auto text-teal-600 font-bold">{alert.nearestHospitals[0].distanceKm} km</span>
                    </p>
                  )}

                  <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                    <button
                      id={`accept-btn-${alert.id}`}
                      onClick={() => handleAcceptClick(alert)}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button
                      id={`divert-btn-${alert.id}`}
                      onClick={() => handleNoCapacity(alert.id)}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      No Capacity
                    </button>
                  </div>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div className="text-center py-16 text-slate-400 font-medium">
                <Radio size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
                <p className="text-lg text-slate-500">No active alerts.</p>
                <p className="text-sm">Waiting for WhatsApp triage stream...</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Patient Detail ───────────────────────────────────── */}
        <div className="w-[40%] flex flex-col bg-slate-50">
          <div className="p-6 border-b border-slate-200 bg-white z-10 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <MapPin className="text-teal-600" />
              Patient Detail & Map View
            </h2>
          </div>

          {activeAlert ? (
            <div className="flex-1 overflow-y-auto">
              {/* Map */}
              <div className="h-72 bg-slate-200 relative border-b border-slate-200">
                <MapContainer center={activeAlert.location} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={activeAlert.location}>
                    <Popup className="font-sans font-bold">Emergency Location<br />{activeAlert.id}</Popup>
                  </Marker>
                  <MapUpdater center={activeAlert.location} />
                </MapContainer>
              </div>

              {/* Location & nav */}
              <div className="px-6 py-4 bg-white border-b border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-bold text-slate-800">{activeAlert.address}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">GPS: {activeAlert.location[0].toFixed(5)}, {activeAlert.location[1].toFixed(5)}</p>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeAlert.location[0]},${activeAlert.location[1]}`, '_blank')}
                  className="mt-3 w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Navigation size={18} className="text-teal-400" /> Generate Route (Google Maps)
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Instructions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    AI First Aid Instructions
                  </h4>
                  <div className="bg-white border border-teal-100 rounded-2xl p-5 text-sm text-slate-700 font-medium leading-relaxed shadow-sm">
                    {activeAlert.instructions.split('\n').map((line, i) => (
                      <p key={i} className="mb-1.5 last:mb-0">{line}</p>
                    ))}
                  </div>
                </div>

                {/* Nearest hospitals */}
                {activeAlert.nearestHospitals && activeAlert.nearestHospitals.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Nearest Facilities
                    </h4>
                    <div className="space-y-2">
                      {activeAlert.nearestHospitals.map((h, i) => (
                        <div key={h.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${i === 0 ? 'bg-teal-500' : 'bg-slate-300'}`}>{i + 1}</span>
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

                {/* Transcript */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                    Live WhatsApp Chat
                  </h4>
                  <div className="bg-slate-900 rounded-2xl p-5 text-sm text-slate-300 font-mono leading-relaxed space-y-3 shadow-inner">
                    {activeAlert.transcript.split('\n').map((line, idx) => {
                      const isOp = line.startsWith('PulseGrid AI:');
                      let senderName = isOp ? 'PulseGrid AI' : 'Patient';
                      let content = line;
                      if (isOp) {
                        content = line.replace(/^PulseGrid AI:\s*/, '');
                      } else {
                        const splitIdx = line.indexOf(':');
                        if (splitIdx !== -1 && splitIdx < 30) {
                          senderName = line.substring(0, splitIdx).trim().replace('whatsapp:', '');
                          content = line.substring(splitIdx + 1).trim();
                        }
                      }
                      return (
                        <div key={idx} className={`flex w-full ${isOp ? 'justify-start' : 'justify-end'}`}>
                          <div className={`flex flex-col max-w-[85%] ${isOp ? 'items-start' : 'items-end'}`}>
                            <div className={`px-3 py-2 rounded-xl ${isOp ? 'bg-slate-800 text-slate-300 rounded-tl-none' : 'bg-teal-900 text-teal-100 rounded-tr-none'}`}>
                              <span className={`text-[10px] uppercase tracking-wider font-bold block mb-1 ${isOp ? 'text-slate-500' : 'text-teal-400'}`}>{senderName}</span>
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
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
              <AlertTriangle size={64} className="mb-6 text-slate-200" />
              <p className="text-xl font-bold text-slate-400">No Patient Selected</p>
              <p className="text-sm mt-2 text-slate-400/80 max-w-xs">Select an alert from the Active Triage Board to view details and map.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
