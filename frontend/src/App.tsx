import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { AlertTriangle, Clock, MapPin, MessageCircle, ShieldAlert, CheckCircle, XCircle, Navigation, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Mock Data
type TriageStatus = 'red' | 'yellow';

interface AlertCard {
  id: string;
  time: Date;
  status: TriageStatus;
  summary: string;
  transcript: string;
  instructions: string;
  location: [number, number]; // lat, lng
  address: string;
}

const mockAlerts: AlertCard[] = [
  {
    id: 'AL-1029',
    time: new Date(Date.now() - 2 * 60000 - 14000), // 2 mins 14 secs ago
    status: 'red',
    summary: 'Severe chest pain, breathlessness, sweating',
    transcript: "PulseGrid AI: EMERGENCY HOTLINE. Please describe your emergency via text.\n+234 803 123 4567: My dad... he's clutching his chest. He can't breathe. He's sweating profusely. Please hurry!\nPulseGrid AI: Location received. Tracking exact GPS. Have dispatched an ambulance. Is he conscious?",
    instructions: "1. Keep patient calm and seated.\n2. Loosen tight clothing.\n3. If prescribed, assist with nitroglycerin.\n4. Prepare for CPR if patient becomes unresponsive.",
    location: [6.5925, 3.3275],
    address: "Mobolaji Bank Anthony Way, Ikeja, Lagos",
  },
  {
    id: 'AL-1030',
    time: new Date(Date.now() - 5 * 60000),
    status: 'yellow',
    summary: 'Fractured leg from fall, stable',
    transcript: "PulseGrid AI: EMERGENCY HOTLINE. How can we help?\n+234 812 987 6543: I fell off a ladder and I think my leg is broken. The bone looks weird but it's not bleeding much.\nPulseGrid AI: Stay still, do not try to move the leg. Medics from LASUTH are en route to your WhatsApp GPS location.",
    instructions: "1. Do not move the patient unless in immediate danger.\n2. Keep the injured limb straight and immobilized.\n3. Apply ice pack if available without applying pressure.",
    location: [6.5890, 3.3300],
    address: "Oba Akran Ave, Ikeja, Lagos",
  },
];

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAccepting, setIsAccepting] = useState(true);
  const [activeAlert, setActiveAlert] = useState<AlertCard | null>(null);
  const [alerts, setAlerts] = useState<AlertCard[]>(mockAlerts);

  // Real-time ticking clock for "time elapsed"
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
              <input type="text" placeholder="Dr. Jane Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Password / Biometrics</label>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <button
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

  const handleAction = (id: string) => {
    // [backend-tag: api_dispatch_action] 
    // Here we would POST to /api/dispatch/:id
    setAlerts(alerts.filter(a => a.id !== id));
    if (activeAlert?.id === id) setActiveAlert(null);
  };

  const toggleCapacity = () => {
    // [backend-tag: api_capacity_update]
    // Here we would PUT to /api/hospital/capacity
    setIsAccepting(!isAccepting);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans">

      {/* Left Sidebar (20%) */}
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Active Load</p>
            <div className="text-4xl font-black text-slate-800 flex items-baseline gap-2">
              {alerts.length} <span className="text-sm font-semibold text-slate-500">Incoming</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded">
                [backend-tag: api_hospital_stats]
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest text-center">Master Capacity Toggle</p>
          <button
            onClick={toggleCapacity}
            className={`w-full py-5 rounded-2xl font-black text-[15px] flex items-center justify-center gap-3 transition-all duration-300 ${isAccepting
              ? 'bg-teal-600 text-white shadow-[0_8px_20px_rgba(13,148,136,0.3)] hover:bg-teal-700'
              : 'bg-slate-200 text-slate-500 shadow-inner hover:bg-slate-300'
              }`}
          >
            {isAccepting ? (
              <>
                <CheckCircle size={20} className="opacity-100" />
                ER ACCEPTING PATIENTS
              </>
            ) : (
              <>
                <XCircle size={20} className="opacity-100 text-slate-500" />
                ER FULL - DIVERTING
              </>
            )}
          </button>
          <div className="text-center mt-3">
            <span className="text-[10px] font-mono text-slate-400">
              [backend-tag: api_capacity_update]
            </span>
          </div>
        </div>
      </div>

      {/* Center Panel (40%) */}
      <div className="w-[40%] border-r border-slate-200 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="text-teal-600" />
              Active WhatsApp Triage
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">[backend-tag: websocket_triage_stream]</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
            <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              LIVE STREAM
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
                  <span className={`px-3 py-1.5 rounded-md text-xs font-black tracking-wider ${isRed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    CODE {alert.status.toUpperCase()}
                  </span>
                  <div className="flex items-center font-mono text-xs font-semibold text-slate-500 gap-1.5 bg-white px-2 py-1 rounded border border-slate-200">
                    <Clock size={12} className={isRed ? 'text-red-500' : 'text-amber-500'} />
                    {formatDistanceToNow(alert.time)} ago
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-6 text-slate-800 leading-snug">
                  {alert.summary}
                </h3>

                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleAction(alert.id)}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle size={18} /> Accept & Dispatch
                  </button>
                  <button
                    onClick={() => handleAction(alert.id)}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    No Capacity
                  </button>
                </div>
              </div>
            )
          })}
          {alerts.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-medium">
              <Radio size={48} className="mx-auto mb-4 text-slate-300 opacity-50" />
              <p className="text-lg text-slate-500">No active alerts.</p>
              <p className="text-sm">Waiting in queue...</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel (40%) */}
      <div className="w-[40%] flex flex-col bg-slate-50">
        <div className="p-6 border-b border-slate-200 bg-white z-10 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <MapPin className="text-teal-600" />
            Patient Detail & Map View
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">[backend-tag: api_patient_detail]</p>
        </div>

        {activeAlert ? (
          <div className="flex-1 overflow-y-auto">
            {/* Map Section */}
            <div className="h-72 bg-slate-200 relative border-b border-slate-200">
              <MapContainer
                center={activeAlert.location}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <Marker position={activeAlert.location}>
                  <Popup className="font-sans font-bold">
                    Emergency Location <br /> {activeAlert.id}
                  </Popup>
                </Marker>
                <MapUpdater center={activeAlert.location} />
              </MapContainer>
            </div>

            <div className="px-6 py-4 bg-white border-b border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Exact Location Ping</p>
                  <p className="text-sm font-bold text-slate-800">{activeAlert.address}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">GPS: {activeAlert.location[0].toFixed(5)}, {activeAlert.location[1].toFixed(5)}</p>
                </div>
              </div>
              <button
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeAlert.location[0]},${activeAlert.location[1]}`, '_blank')}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation size={18} className="text-teal-400" /> Generate Route (Google Maps)
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* AI Priority Box */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    AI First Aid Instructions
                  </h4>
                  <span className="text-[10px] font-mono text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    [backend-tag: ai_insights_engine]
                  </span>
                </div>
                <div className="bg-white border text-left border-teal-100 rounded-2xl p-5 text-sm text-slate-700 font-medium leading-relaxed shadow-sm">
                  {activeAlert.instructions.split('\n').map((line, i) => (
                    <p key={i} className="mb-1.5 last:mb-0">{line}</p>
                  ))}
                </div>
              </div>

              {/* Raw Transcript */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                    Live WhatsApp Chat
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                    [backend-tag: websocket_whatsapp_feed]
                  </span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-5 text-sm text-slate-300 font-mono leading-relaxed space-y-3 shadow-inner">
                  {activeAlert.transcript.split('\n').map((line, idx) => {
                    const isOp = line.startsWith('PulseGrid AI:');
                    const phoneMatch = line.match(/^(\+234\s\d{3}\s\d{3}\s\d{4}):/);
                    const senderName = isOp ? 'PulseGrid AI' : (phoneMatch ? phoneMatch[1] : 'Unknown');
                    const content = line.replace(/^(PulseGrid AI:|\+234\s\d{3}\s\d{3}\s\d{4}:)\s*/, '');

                    return (
                      <div key={idx} className={`flex w-full ${isOp ? 'justify-start' : 'justify-end'}`}>
                        <div className={`flex flex-col max-w-[85%] ${isOp ? 'items-start' : 'items-end'}`}>
                          <div className={`px-3 py-2 rounded-xl ${isOp ? 'bg-slate-800 text-slate-300 rounded-tl-none' : 'bg-teal-900 text-teal-100 rounded-tr-none'}`}>
                            <span className={`text-[10px] uppercase tracking-wider font-bold block mb-1 ${isOp ? 'text-slate-500' : 'text-teal-400'}`}>
                              {senderName}
                            </span>
                            <span>{content}</span>
                          </div>
                        </div>
                      </div>
                    )
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
  );
}
