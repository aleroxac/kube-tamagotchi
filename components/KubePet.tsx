
import React from 'react';

interface KubePetProps {
  imageUrl: string | null;
  loading: boolean;
  health: number;
}

const KubePet: React.FC<KubePetProps> = ({ imageUrl, loading, health }) => {
  const isDead = health <= 0;

  return (
    <div className="relative w-full aspect-square max-w-[450px] mx-auto group">
      {/* Structural Frame */}
      <div className="absolute -inset-4 border-2 border-slate-800 rounded-[3rem] pointer-events-none opacity-50"></div>
      <div className="absolute -inset-8 border border-slate-900/40 rounded-[4rem] pointer-events-none opacity-30"></div>

      {/* Main Pixel Viewport */}
      <div className="relative w-full h-full bg-slate-950 rounded-[2.5rem] overflow-hidden border-8 border-slate-900 shadow-[0_40px_100px_rgba(0,0,0,1)]">
        {/* CRT Simulation Overlays */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.08),rgba(0,255,0,0.03),rgba(0,0,255,0.08))] bg-[size:100%_4px,4px_100%]"></div>
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(0,0,0,0.4)_100%)]"></div>
        
        {/* Gallery Sync / Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="mono text-[10px] text-cyan-400 animate-pulse tracking-[0.4em] uppercase font-black">Syncing State Gallery</span>
              <span className="mono text-[8px] text-slate-500 uppercase tracking-widest">Generating 32-Bit Pixel Soul...</span>
            </div>
          </div>
        )}

        {/* The Natural Hyper-Realistic Image */}
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Natural Skube State"
            className={`w-full h-full object-cover transition-all duration-1000 ${isDead ? 'grayscale brightness-50 contrast-75' : 'brightness-105 contrast-110 saturate-[1.1]'}`}
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/20 gap-4">
             <div className="w-8 h-8 bg-slate-800 rounded-lg animate-pulse"></div>
             <span className="mono text-[9px] text-slate-600 uppercase tracking-widest">Establishing Neural Link...</span>
          </div>
        )}

        {/* HUD Overlay Elements */}
        <div className="absolute top-6 left-8 z-20 mono text-[9px] font-black text-cyan-400/60 flex flex-col gap-1.5 uppercase tracking-tighter">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>LIVE_STREAM // SKB_BIO_CAM</span>
          </div>
          <div className="text-slate-500 font-bold opacity-50">Res: 1024x1024_PX</div>
        </div>

        <div className="absolute bottom-6 right-8 z-20 mono text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
          Uptime: {Math.floor(performance.now() / 1000)}s
        </div>
      </div>

      {/* Critical Status Effects */}
      {health < 25 && health > 0 && (
        <div className="absolute inset-0 z-30 opacity-15 pointer-events-none mix-blend-screen bg-[url('https://media.giphy.com/media/oEI9uWUznW3pS/giphy.gif')] bg-cover"></div>
      )}
      
      {/* Decorative Aura */}
      <div 
        className={`absolute -inset-10 rounded-full blur-[100px] transition-all duration-1000 opacity-20 pointer-events-none ${health > 70 ? 'bg-cyan-500' : health > 30 ? 'bg-amber-500' : 'bg-red-600'}`}
      ></div>
    </div>
  );
};

export default KubePet;
