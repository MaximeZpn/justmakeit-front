import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const STEPS_PER_PAGE = 16;
const INITIAL_INSTRUMENTS = ['Kick', 'Snare', 'Hi-Hat', 'Clap'];

// 1. Importation dynamique des fichiers via Vite (Nécessite de déplacer les samples dans src/assets/samples)
const samplesGlob = import.meta.glob('../assets/samples/**/*.{wav,WAV,mp3,MP3}', { eager: true });

// 2. Construction dynamique de la bibliothèque
const SAMPLE_LIBRARY = { Kick: [], Snare: [], 'Hi-Hat': [], Clap: [] };

// Debug: Affiche dans la console du navigateur (F12) ce que Vite a trouvé
console.log("Fichiers trouvés par Vite:", Object.keys(samplesGlob));

Object.keys(samplesGlob).forEach((path) => {
  const parts = path.split('/');
  const filename = parts.pop();
  const folder = parts.pop().toLowerCase(); // ex: 'kicks', 'snares'
  const url = samplesGlob[path].default;

  let key = null;
  if (folder.includes('kick')) key = 'Kick';
  else if (folder.includes('snare')) key = 'Snare';
  else if (folder.includes('hat')) key = 'Hi-Hat';
  else if (folder.includes('clap')) key = 'Clap';

  if (key) SAMPLE_LIBRARY[key].push({ name: filename, url });
});

export default function Sequencer() {
  // State: Grid [InstrumentIndex][StepIndex] -> boolean
  const [totalSteps, setTotalSteps] = useState(STEPS_PER_PAGE);
  const [bpm, setBpm] = useState(120);
  const [isDragging, setIsDragging] = useState(false);

  // State for Tracks (Instruments + Custom Samples)
  const [backingLoop, setBackingLoop] = useState(null);

  const [tracks, setTracks] = useState(
    INITIAL_INSTRUMENTS.map(inst => ({
      name: inst,
      url: SAMPLE_LIBRARY[inst]?.[0]?.url,
      isMuted: false
    }))
  );

  const [grid, setGrid] = useState(
    INITIAL_INSTRUMENTS.map(() => Array(STEPS_PER_PAGE).fill(false))
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Ref to access the latest grid inside the Tone.js callback loop
  const gridRef = useRef(grid);
  // Ref pour stocker les lecteurs audio (Players) afin de pouvoir les changer dynamiquement
  const playersRef = useRef([]);
  const backingPlayerRef = useRef(null);
  const canvasRef = useRef(null);

  // Update ref whenever grid changes
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // Mise à jour du BPM
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const drawWaveform = (buffer, playhead = -1) => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#a855f7'; // Purple-500
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const index = (i * step) + j;
        if (index < data.length) {
          const datum = data[index];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
      }
      
      const y = (1 + min) * amp;
      const h = Math.max(1, (max - min) * amp);
      ctx.fillRect(i, y, 1, h);
    }

    // Draw Playhead
    if (playhead >= 0 && playhead <= 1) {
      const x = playhead * width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x, 0, 2, height);
    }
  };

  // Animation Loop for Waveform Cursor
  useEffect(() => {
    let animationId;

    const animate = () => {
      if (isPlaying && backingPlayerRef.current && backingPlayerRef.current.loaded) {
        const buffer = backingPlayerRef.current.buffer;
        const duration = buffer.duration;
        if (duration > 0) {
          const progress = (Tone.Transport.seconds % duration) / duration;
          drawWaveform(buffer, progress);
        }
      }
      animationId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    } else {
      cancelAnimationFrame(animationId);
      if (backingPlayerRef.current?.loaded) {
        drawWaveform(backingPlayerRef.current.buffer, 0);
      }
    }

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  // Effect for Backing Loop Player
  useEffect(() => {
    if (backingLoop?.url) {
      console.log("Loading backing loop:", backingLoop.url);
      const player = new Tone.Player({
        url: backingLoop.url,
        loop: true,
        mute: backingLoop.isMuted,
        onload: () => {
          console.log("✅ Backing Loop loaded!");
          drawWaveform(player.buffer);
        },
        onerror: (e) => console.error("❌ Backing Loop error:", e)
      }).toDestination();

      // Sync with Transport so it starts/stops with the sequencer
      player.sync().start(0);
      
      backingPlayerRef.current = player;
    }

    return () => {
      if (backingPlayerRef.current) {
        backingPlayerRef.current.dispose();
        backingPlayerRef.current = null;
      }
    };
  }, [backingLoop?.url]);

  // Effect for Mute toggle on loop
  useEffect(() => {
    if (backingPlayerRef.current && backingLoop) {
      backingPlayerRef.current.mute = backingLoop.isMuted;
    }
  }, [backingLoop?.isMuted]);

  // Initialisation Audio (Players & Loop)
  useEffect(() => {
    // Création des Players initiaux
    playersRef.current.forEach(p => p?.dispose());
    playersRef.current = tracks.map((track) => {
      const url = track.url;
      if (url) {
        console.log(`Tentative de chargement pour ${track.name}:`, url);
        return new Tone.Player({
          url: url,
          mute: track.isMuted,
          onload: () => console.log(`✅ ${track.name} chargé avec succès !`),
          onerror: (e) => {
            console.error(`❌ Erreur de chargement pour ${track.name}:`, e);
            if (e.message && e.message.includes('EncodingError')) {
              console.warn(`💡 CONSEIL: Le fichier "${url.split('/').pop()}" contient probablement des caractères spéciaux (espaces, ®, etc.). Renommez-le simplement (ex: "kick.wav").`);
            }
          }
        }).toDestination();
      }
      return null;
    });

    const loop = new Tone.Sequence((time, step) => {
      setCurrentStep(step);
      
      gridRef.current.forEach((row, instrumentIndex) => {
        if (row[step]) {
          // Trigger sound based on instrument index
          const player = playersRef.current[instrumentIndex];
          
          // Si le fichier est chargé, on le joue. Sinon, on joue le synthé de secours.
          if (player && player.loaded) {
            player.start(time);
          } else if (player && !player.mute) {
            // console.warn(`⚠️ Le son ${tracks[instrumentIndex]?.name} n'est pas encore prêt.`);
          }
        }
      });
    }, [...Array(totalSteps).keys()], "16n");

    loop.start(0);

    return () => {
      loop.dispose();
      playersRef.current.forEach(p => p?.dispose());
    };
  }, [totalSteps, tracks.length]); // Re-run only if step count or track count changes

  const toggleStep = (instrumentIndex, stepIndex) => {
    const newGrid = [...grid];
    newGrid[instrumentIndex][stepIndex] = !newGrid[instrumentIndex][stepIndex];
    setGrid(newGrid);
  };

  const handleExpand = () => {
    if (totalSteps === 32) return;
    setTotalSteps(32);
    // Copie le pattern des 16 premiers pas vers les 16 suivants
    setGrid(prev => prev.map(row => [...row, ...row]));
  };

  const handleCollapse = () => {
    if (totalSteps === 16) return;
    setTotalSteps(16);
    // Revient à 16 pas (coupe la fin)
    setGrid(prev => prev.map(row => row.slice(0, STEPS_PER_PAGE)));
  };

  const handleClearAll = () => {
    setGrid(tracks.map(() => Array(totalSteps).fill(false)));
  };

  const fillTrack = (instrumentIndex, interval, pageIndex = 0) => {
    const start = pageIndex * STEPS_PER_PAGE;
    const end = start + STEPS_PER_PAGE;
    const newGrid = grid.map((row, rIdx) => {
      if (rIdx === instrumentIndex) {
        return row.map((val, stepIdx) => (stepIdx >= start && stepIdx < end) ? stepIdx % interval === 0 : val);
      }
      return row;
    });
    setGrid(newGrid);
  };

  const clearTrack = (instrumentIndex, pageIndex = 0) => {
    const start = pageIndex * STEPS_PER_PAGE;
    const end = start + STEPS_PER_PAGE;
    const newGrid = grid.map((row, rIdx) => {
      if (rIdx === instrumentIndex) return row.map((val, stepIdx) => (stepIdx >= start && stepIdx < end) ? false : val);
      return row;
    });
    setGrid(newGrid);
  };

  const handleSampleChange = (index, newUrl) => {
    // 1. Mettre à jour l'état visuel (dropdown)
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[index] = { ...newTracks[index], url: newUrl };
      return newTracks;
    });
    
    // 2. Charger le nouveau son dans le Player existant
    if (playersRef.current[index]) {
      playersRef.current[index].load(newUrl);
    } else {
      playersRef.current[index] = new Tone.Player({
        url: newUrl,
        onload: () => console.log(`✅ Track ${index} (nouveau) chargé !`),
        onerror: (e) => {
          console.error(`❌ Erreur Track ${index}:`, e);
          if (e.message && e.message.includes('EncodingError')) {
            console.warn(`💡 CONSEIL: Renommez le fichier "${newUrl.split('/').pop()}" pour enlever les espaces ou caractères spéciaux.`);
          }
        }
      }).toDestination();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.name.match(/\.(wav|mp3)$/i));
    
    if (audioFiles.length === 0) return;

    const newTracks = audioFiles.map(file => ({
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file),
      isMuted: false,
      isCustom: true
    }));

    setTracks(prev => [...prev, ...newTracks]);
    setGrid(prev => [...prev, ...newTracks.map(() => Array(totalSteps).fill(false))]);
  };

  const handleLoopDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(f => f.type.startsWith('audio/') || f.name.match(/\.(wav|mp3)$/i));
    
    if (audioFile) {
      setBackingLoop({
        name: audioFile.name,
        url: URL.createObjectURL(audioFile),
        isMuted: false
      });
    }
  };

  const handleRemoveTrack = (index) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
    setGrid(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMute = (index) => {
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[index].isMuted = !newTracks[index].isMuted;
      return newTracks;
    });
    if (playersRef.current[index]) {
      playersRef.current[index].mute = !playersRef.current[index].mute;
    }
  };

  const toggleLoopMute = () => {
    setBackingLoop(prev => prev ? ({ ...prev, isMuted: !prev.isMuted }) : null);
  };

  const handlePlay = async () => {
    if (!isPlaying) {
      await Tone.start(); // Required by browsers to allow audio
      if (Tone.context.state !== 'running') await Tone.context.resume();
      Tone.Transport.start();
    } else {
      Tone.Transport.stop();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div 
      className={`w-full max-w-6xl mx-auto mt-10 p-6 bg-gray-900 text-white rounded-xl shadow-2xl transition-all ${isDragging ? 'border-2 border-purple-500 bg-gray-800' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-400">JustMakeIt !</h2>
        <div className="flex items-center gap-6">
          {/* BPM Control */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">BPM:</span>
              <input 
                type="number" 
                value={bpm} 
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-12 bg-gray-800 text-white text-xs rounded px-1 border border-gray-700 focus:border-purple-500 outline-none text-center"
              />
            </div>
            <input 
              type="range" 
              min="60" 
              max="180" 
              value={bpm} 
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex gap-1">
              {[80, 100, 120, 140].map(p => (
                <button key={p} onClick={() => setBpm(p)} className={`text-[10px] px-1.5 rounded border border-gray-700 transition-colors ${bpm === p ? 'bg-purple-900 text-purple-200 border-purple-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{p}</button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-200 rounded-full text-sm font-semibold transition-all border border-red-900/50"
          >
            Clear All
          </button>

          {totalSteps === 16 ? (
            <button 
              onClick={handleExpand}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-semibold transition-all border border-gray-700"
            >
              Expand to 32
            </button>
          ) : (
            <button 
              onClick={handleCollapse}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-semibold transition-all border border-gray-700"
            >
              Back to 16
            </button>
          )}
          <button
            onClick={handlePlay}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              isPlaying 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
        </div>
      </div>

      {/* Backing Loop Section */}
      <div 
        className={`mb-6 p-4 rounded-lg border-2 border-dashed transition-colors ${backingLoop ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={handleLoopDrop}
      >
        {!backingLoop ? (
          <div className="text-center text-gray-500 text-sm py-2">
            🎵 Drag & Drop a Melody Loop here (WAV/MP3)
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-purple-300 font-semibold text-sm">Loop:</span>
              <span className="text-gray-300 text-sm font-mono">{backingLoop.name}</span>
            </div>
            <div className="flex gap-2">
               <button 
                  onClick={toggleLoopMute}
                  className={`text-xs px-2 py-1 rounded border ${backingLoop.isMuted ? 'bg-red-900 border-red-700 text-red-200' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
                >
                  {backingLoop.isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button 
                  onClick={() => setBackingLoop(null)}
                  className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-red-900 text-gray-500 hover:text-red-200 transition-colors"
                >
                  ✕
                </button>
            </div>
            </div>
            <canvas ref={canvasRef} width={1000} height={120} className="w-full h-24 bg-gray-900/50 rounded border border-gray-700/50" />
          </div>
        )}
      </div>

      {/* Boucle pour afficher les pages (16 pas par page) */}
      {[...Array(totalSteps / STEPS_PER_PAGE)].map((_, pageIndex) => (
        <div key={pageIndex} className={pageIndex > 0 ? "mt-8 relative" : ""}>
          {pageIndex > 0 && (
            <div className="absolute -top-6 left-0 text-xs text-gray-500 font-mono">
              Steps 17-32
            </div>
          )}
          <div className="flex flex-col gap-4">
        {tracks.map((track, rowIdx) => (
          <div key={`${track.name}-${rowIdx}`} className="flex items-center gap-4">
            {/* Instrument Label */}
            <div className="w-32 flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 w-full justify-end">
                <span className="font-mono text-sm text-gray-400 truncate" title={track.name}>{track.name}</span>
                <button 
                  onClick={() => toggleMute(rowIdx)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${track.isMuted ? 'bg-red-900 border-red-700 text-red-200' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
                  title="Mute"
                >
                  M
                </button>
                {track.isCustom && (
                  <button 
                    onClick={() => handleRemoveTrack(rowIdx)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 hover:bg-red-900 text-gray-500 hover:text-red-200 transition-colors"
                    title="Delete Track"
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* Dropdown de sélection */}
              {!track.isCustom && SAMPLE_LIBRARY[track.name] ? (
                <select 
                className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-700 focus:border-purple-500 outline-none w-full"
                value={track.url || ''}
                onChange={(e) => handleSampleChange(rowIdx, e.target.value)}
              >
                {SAMPLE_LIBRARY[track.name]?.map(sample => 
                  <option key={sample.url} value={sample.url}>{sample.name}</option>
                )}
              </select>
              ) : (
                <div className="h-6 w-full"></div> // Spacer for custom tracks
              )}

              {/* Outils de pré-remplissage */}
              <div className="flex gap-1 mt-1 w-full justify-end">
                <button 
                  onClick={() => fillTrack(rowIdx, 4, pageIndex)} 
                  className="text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                  title="Remplir tous les 4 temps (Beat)"
                >
                  1/4
                </button>
                <button 
                  onClick={() => fillTrack(rowIdx, 2, pageIndex)} 
                  className="text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                  title="Remplir tous les 2 temps"
                >
                  1/2
                </button>
                <button 
                  onClick={() => clearTrack(rowIdx, pageIndex)} 
                  className="text-[10px] bg-red-900 hover:bg-red-800 text-red-100 px-2 py-1 rounded transition-colors"
                  title="Effacer la piste"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Steps Grid */}
            <div className="flex-1 grid grid-cols-16 gap-1">
              {grid[rowIdx].slice(pageIndex * 16, (pageIndex + 1) * 16).map((isActive, localStepIdx) => {
                const stepIdx = pageIndex * 16 + localStepIdx;
                return (
                <button
                  key={stepIdx}
                  onClick={() => toggleStep(rowIdx, stepIdx)}
                  className={`
                    h-14 w-full rounded-sm transition-colors duration-100
                    ${isActive
                      ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      : `hover:bg-gray-600 ${Math.floor(stepIdx / 4) % 2 === 0 ? 'bg-gray-800' : 'bg-red-950'}`
                    }
                    ${currentStep === stepIdx && isPlaying ? 'border-2 border-white' : ''}
                  `}
                />
                );
              })}
            </div>
          </div>
        ))}
          </div>
        </div>
      ))}
    </div>
  );
}