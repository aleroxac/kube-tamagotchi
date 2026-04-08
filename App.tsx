
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import KubePet from './components/KubePet';
import StatCard from './components/StatCard';
import { ClusterMetrics, PetStatus, PetType } from './types';
import { getPetComment, generatePetGallery, PetGallery } from './services/geminiService';
import { 
  Heart, Smile, DollarSign, Activity, 
  Zap, Layers, RefreshCw, Info, Dog, Cat, Fish, Bird, 
  Terminal, ShieldAlert, Cpu, Box, Camera
} from 'lucide-react';

const INITIAL_METRICS: ClusterMetrics = {
  health: 100,
  podsTotal: 10,
  podsHealthy: 10,
  rps: 50,
  latency: 20,
  mood: 90,
  cpuUsage: 30,
  memUsage: 40,
  hunger: 35,
  cost: 2.45,
  weight: 30,
};

const ACTION_INFO = {
  fix: "RESTART_ROLLOUT: Tenta reviver pods zumbis. O Pet tira os curativos e recupera a cor.",
  flush: "CACHE_PURGE: Melhora o tempo de resposta (ms). O Pet para de ofegar e descansa.",
  up: "HORIZONTAL_SCALE: Adiciona réplicas. O Pet perde o 'olhar demoníaco' da fome.",
  down: "DESCALONAMENTO: Remove nós caros. O Pet emagrece e fica mais ágil."
};

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<ClusterMetrics>(INITIAL_METRICS);
  const [petStatus, setPetStatus] = useState<PetStatus>({
    name: "Skube",
    type: 'dog',
    moodLabel: "Operational",
    comment: "Inicializando Skube-OS... Verificando consistência do cluster.",
    level: 1,
    xp: 0,
  });
  
  const [gallery, setGallery] = useState<PetGallery>({ healthy: null, sick: null, sad: null, hungry: null, fat: null, dead: null });
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [logs, setLogs] = useState<string[]>(["Skube Terminal Online."]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 10)]); // Increased log history slightly
  }, []);

  const loadGallery = useCallback(async (type: PetType) => {
    setLoadingGallery(true);
    addLog(`OS: Iniciando renderização sequencial de estados para ${type.toUpperCase()}...`);
    const newGallery = await generatePetGallery(type, (msg) => addLog(msg));
    setGallery(newGallery);
    setLoadingGallery(false);
    addLog(`OS: Galeria de ${type.toUpperCase()} sincronizada no disco local.`);
  }, [addLog]);

  const updateAIComment = async (currentMetrics: ClusterMetrics) => {
    setLoadingAI(true);
    const comment = await getPetComment(currentMetrics, petStatus.name, petStatus.type);
    setPetStatus(prev => ({ ...prev, comment }));
    setLoadingAI(false);
  };

  // Prioritized Image Selection Logic:
  // Dead > Sick (Bandages) > Hungry (Demonic) > Tired (Panting) > Fat (Heavy/Costs) > Healthy
  const currentImageUrl = useMemo(() => {
    if (metrics.health <= 0) return gallery.dead;
    if (metrics.health < 40) return gallery.sick; // Bandaged paw
    if (metrics.hunger > 75) return gallery.hungry; // Demonic eyes
    if (metrics.mood < 40) return gallery.sad; // Tired/Panting
    if (metrics.weight > 75) return gallery.fat; // Overfed/Expensive
    return gallery.healthy;
  }, [gallery, metrics.health, metrics.mood, metrics.hunger, metrics.weight]);

  useEffect(() => {
    loadGallery(petStatus.type);
  }, [petStatus.type, loadGallery]);

  // Main Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const rpsChange = (Math.random() - 0.45) * 8;
        const newRps = Math.max(5, prev.rps + rpsChange);
        const latencyChange = (Math.random() - 0.3) * 4;
        const newLatency = Math.max(2, prev.latency + latencyChange);
        
        let newHealthy = prev.podsHealthy;
        if (Math.random() > 0.96 && newHealthy > 0) {
          newHealthy--;
          addLog("WARN: Pod [ERR_SIGTERM] detected. Restarting...");
        }

        const health = (newHealthy / prev.podsTotal) * 100;
        let mood = 100 - (newLatency / 3) - (prev.podsTotal - newHealthy) * 10;
        mood = Math.max(0, Math.min(100, mood));

        const cpuDrift = (Math.random() - 0.5) * 5;
        const newCpu = Math.max(2, Math.min(100, prev.cpuUsage + cpuDrift + (newRps / 15)));
        const newMem = Math.max(5, Math.min(98, prev.memUsage + (prev.podsTotal * 0.35)));
        const hunger = (newCpu + newMem) / 2;

        const newCost = (prev.podsTotal * 0.45) + (newCpu * 0.02);
        const weight = Math.min(100, prev.podsTotal * 7);

        return { ...prev, rps: newRps, latency: newLatency, podsHealthy: newHealthy, health, mood, cpuUsage: newCpu, memUsage: newMem, hunger, cost: newCost, weight };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [addLog]);

  useEffect(() => {
    const commentInterval = setInterval(() => {
      if (metrics.health > 0) updateAIComment(metrics);
    }, 25000);
    return () => clearInterval(commentInterval);
  }, [metrics.health, petStatus.type]);

  const handleAction = (action: () => void, logMsg: string) => {
    action();
    addLog(logMsg);
  };

  const handleScaleUp = () => handleAction(() => {
    setMetrics(prev => ({ ...prev, podsTotal: prev.podsTotal + 1, podsHealthy: prev.podsHealthy + 1 }));
    setPetStatus(prev => ({ ...prev, xp: prev.xp + 15 }));
  }, "ACTION: kubectl scale --replicas++ (Provisioning Node)");

  const handleScaleDown = () => handleAction(() => {
    if (metrics.podsTotal > 1) {
      setMetrics(prev => ({ 
        ...prev, 
        podsTotal: prev.podsTotal - 1, 
        podsHealthy: Math.min(prev.podsHealthy, prev.podsTotal - 1) 
      }));
    }
  }, "ACTION: kubectl scale --replicas-- (Node Termination)");

  const handleFixPods = () => handleAction(() => {
    setMetrics(prev => ({ ...prev, podsHealthy: prev.podsTotal }));
    setPetStatus(prev => ({ ...prev, xp: prev.xp + 25 }));
  }, "ACTION: kubectl rollout restart deployment/skube");

  const handleCleanCache = () => handleAction(() => {
    setMetrics(prev => ({ ...prev, latency: Math.max(2, prev.latency * 0.4) }));
  }, "ACTION: redis-cli FLUSHALL (Clearing buffers)");

  const changePetType = (type: PetType) => {
    if (loadingGallery) return;
    setPetStatus(prev => ({ ...prev, type }));
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 selection:bg-cyan-500/30 font-sans">
      <div className="fixed inset-0 opacity-15 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#162e4a,transparent)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 p-4 md:p-10 max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between mb-10 gap-6 bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-8 rounded-[3rem] shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(8,145,178,0.3)]">
              <Box className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">
                SKUBE<span className="text-cyan-400 not-italic font-thin ml-1">OS</span>
              </h1>
              <div className="flex items-center gap-2 text-[10px] mono text-cyan-500 font-black uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                PROD_HYPER_CORE_03
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-10 bg-black/40 px-10 py-5 rounded-3xl border border-white/5">
            <div className="flex flex-col gap-2 min-w-[180px]">
              <div className="flex justify-between text-[10px] mono font-bold text-slate-500 uppercase tracking-widest">
                <span>LVL {petStatus.level}</span>
                <span className="text-cyan-400">XP {petStatus.xp % 100}/100</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 shadow-[0_0_15px_#06b6d4] transition-all duration-1000" style={{ width: `${petStatus.xp % 100}%` }}></div>
              </div>
            </div>
            <div className="flex flex-col items-center border-l border-white/10 pl-10">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">State</span>
              <span className={`px-5 py-1 rounded-full text-[10px] font-black border tracking-widest ${metrics.health > 80 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {metrics.health > 80 ? 'STABLE' : 'CRITICAL'}
              </span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-slate-900/40 p-12 rounded-[4rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-3 z-30 bg-black/70 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100">
                {[
                  { id: 'dog', icon: <Dog size={18}/> },
                  { id: 'cat', icon: <Cat size={18}/> },
                  { id: 'fish', icon: <Fish size={18}/> },
                  { id: 'parrot', icon: <Bird size={18}/> }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => changePetType(item.id as PetType)}
                    disabled={loadingGallery}
                    className={`p-3 rounded-xl transition-all ${petStatus.type === item.id ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-white/10'} ${loadingGallery ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>

              <KubePet imageUrl={currentImageUrl} loading={loadingGallery} health={metrics.health} />
              
              <div className="mt-12">
                <div className="bg-black/80 backdrop-blur-2xl border-l-4 border-cyan-500 p-8 rounded-3xl shadow-3xl ring-1 ring-white/5 relative">
                  <div className="absolute -top-3 right-8 bg-cyan-600 text-white font-black text-[9px] px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    {loadingAI ? "TRANSMITTING..." : "VIRTUAL_SOUL"}
                  </div>
                  <p className="text-base text-cyan-50 leading-relaxed font-medium italic">
                    "{petStatus.comment}"
                  </p>
                </div>
              </div>

              <button 
                onClick={() => loadGallery(petStatus.type)}
                disabled={loadingGallery}
                className="mt-8 w-full flex items-center justify-center gap-3 py-4 bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-3xl transition-all border border-transparent hover:border-slate-700 disabled:opacity-50"
              >
                <Camera size={16} /> {loadingGallery ? 'Rendering...' : 'Re-render State Gallery'}
              </button>
            </div>

            <div className="bg-[#05070a] rounded-[3rem] border border-slate-800 p-8 shadow-3xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500/20 rounded-full border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]"></div>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mono">Node Controller Logs</span>
                </div>
                <ShieldAlert size={16} className="text-slate-700" />
              </div>
              <div className="h-44 overflow-y-auto pr-3 mono text-[11px] space-y-3 custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className={`flex gap-4 items-start ${log.includes('WARN') ? 'text-amber-400 bg-amber-400/5' : log.includes('ACTION') ? 'text-cyan-400 bg-cyan-400/5' : 'text-slate-500'} p-1 rounded`}>
                    <span className="opacity-30 shrink-0 font-bold">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                    <span className="leading-tight">$ {log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StatCard label="SAÚDE (Pods)" value={`${metrics.podsHealthy}/${metrics.podsTotal}`} percentage={metrics.health} color="bg-cyan-500" icon={<Heart size={16} className="text-cyan-400"/>} />
              <StatCard label="HUMOR (Latency)" value={`${metrics.mood.toFixed(0)}%`} percentage={metrics.mood} color="bg-fuchsia-500" icon={<Smile size={16} className="text-fuchsia-400"/>} />
              <StatCard label="FOME (CPU/MEM)" value={`${metrics.hunger.toFixed(0)}%`} percentage={metrics.hunger} color="bg-amber-500" icon={<Cpu size={16} className="text-amber-400"/>} />
              <StatCard label="PESO (Costs)" value={`$${metrics.cost.toFixed(2)}`} percentage={metrics.weight} color="bg-blue-600" icon={<DollarSign size={16} className="text-blue-400"/>} />
            </div>

            <div className="bg-slate-900/30 border border-slate-800 p-10 rounded-[3.5rem] relative overflow-hidden shadow-3xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 mb-12 border-b border-slate-800 pb-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3">Net_Throughput</span>
                  <div className="text-6xl font-black text-white tracking-tighter mono">
                    {metrics.rps.toFixed(1)} <span className="text-xl font-thin text-cyan-500 uppercase">req/s</span>
                  </div>
                </div>
                <div className="sm:text-right flex flex-col">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-3">Avg_Latency</span>
                  <div className="text-6xl font-black text-amber-500 tracking-tighter mono">
                    {metrics.latency.toFixed(1)} <span className="text-xl font-thin text-amber-600 uppercase">ms</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                      <Zap size={14} className="text-cyan-400" /> CPU Cluster
                    </span>
                    <span className="text-sm font-black text-white mono">{metrics.cpuUsage.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 w-full bg-slate-800/40 rounded-full overflow-hidden p-1">
                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(6,182,212,0.6)]" style={{ width: `${metrics.cpuUsage}%` }}></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                      <Activity size={14} className="text-fuchsia-400" /> RAM Buffer
                    </span>
                    <span className="text-sm font-black text-white mono">{metrics.memUsage.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 w-full bg-slate-800/40 rounded-full overflow-hidden p-1">
                    <div className="h-full bg-fuchsia-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(232,121,249,0.6)]" style={{ width: `${metrics.memUsage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { id: 'fix', label: 'Rollout Restart', desc: ACTION_INFO.fix, icon: <RefreshCw size={22}/>, action: handleFixPods, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-black' },
                { id: 'flush', label: 'Flush Cache', desc: ACTION_INFO.flush, icon: <Zap size={22}/>, action: handleCleanCache, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500 hover:text-black' },
                { id: 'up', label: 'Scaling Up', desc: ACTION_INFO.up, icon: <Layers size={22}/>, action: handleScaleUp, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500 hover:text-black' },
                { id: 'down', label: 'Scale Down', desc: ACTION_INFO.down, icon: <Layers size={22} className="rotate-180"/>, action: handleScaleDown, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500 hover:text-black' },
              ].map(btn => (
                <div key={btn.id} className="relative group/btn">
                  <button 
                    onClick={btn.action}
                    className={`w-full group flex items-center justify-between p-8 rounded-[2.5rem] border-2 font-black transition-all duration-300 active:scale-95 text-left relative overflow-hidden ${btn.color}`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="p-4 bg-black/10 rounded-2xl group-hover:bg-black/20 transition-colors">
                        {btn.icon}
                      </div>
                      <span className="uppercase tracking-tighter text-sm font-black">{btn.label}</span>
                    </div>
                    
                    <div 
                      className="p-3 rounded-2xl bg-black/5 hover:bg-black/20 transition-colors relative z-10 cursor-help"
                      onMouseEnter={() => setActiveTooltip(btn.id)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <Info size={20} className="opacity-40" />
                    </div>
                  </button>

                  {activeTooltip === btn.id && (
                    <div className="absolute bottom-full left-0 right-0 mb-6 p-6 bg-[#0a0f1d] border border-white/10 rounded-[2rem] shadow-4xl z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 ring-1 ring-white/10">
                      <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-3">kubectl_documentation</div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium mono">{btn.desc}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="mt-24 py-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-700 mono text-[9px] uppercase tracking-[0.5em]">
          <div className="flex gap-12">
            <span className="flex items-center gap-3"><span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span> CORE_STABLE</span>
            <span className="flex items-center gap-3"><span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span> PIXEL_GALLERY_LOADED</span>
          </div>
          <div className="font-bold">SKUBE OS // V3.2.0-HYPER-NATURAL</div>
        </footer>
      </div>
    </div>
  );
};

export default App;
