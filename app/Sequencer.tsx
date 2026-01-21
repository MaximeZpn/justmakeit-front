"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

// Configuration initiale du Drum Rack
const INITIAL_TRACKS = [
  { id: 0, name: 'Kick', sound: 'C2' },
  { id: 1, name: 'Snare', sound: 'D2' },
  { id: 2, name: 'Hi-Hat', sound: 'G2' },
  { id: 3, name: 'Clap', sound: 'E2' },
];

const STEPS = 16;

export default function Sequencer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(120);
  
  // Grille : Tableau de pistes, chaque piste a 16 booléens
  const [grid, setGrid] = useState<boolean[][]>(
    INITIAL_TRACKS.map(() => Array(STEPS).fill(false))
  );

  // Références pour Tone.js (pour ne pas déclencher de re-render)
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const loopRef = useRef<Tone.Sequence | null>(null);

  // Initialisation de l'audio au montage
  useEffect(() => {
    // Utilisation d'un synthé polyphonique simple pour la démo
    // Dans la version finale, tu chargeras tes samples ici avec Tone.Sampler
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synthRef.current = synth;

    // Configuration de la boucle
    const loop = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        
        // Vérifier chaque piste pour le pas actuel
        grid.forEach((trackSteps, trackIndex) => {
          if (trackSteps[step]) {
            // Jouer le son associé à la piste
            synth.triggerAttackRelease(INITIAL_TRACKS[trackIndex].sound, "8n", time);
          }
        });
      },
      Array.from({ length: STEPS }, (_, i) => i), // [0, 1, ..., 15]
      "16n"
    );

    loopRef.current = loop;

    return () => {
      loop.dispose();
      synth.dispose();
    };
  }, [grid]); // Recréer la séquence si la grille change (optimisable)

  // Gestion du Play/Pause
  const togglePlay = async () => {
    await Tone.start(); // Important : Démarrer le contexte audio
    
    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.start();
      loopRef.current?.start(0);
      setIsPlaying(true);
    }
  };

  // Gestion du BPM
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = Number(e.target.value);
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  // Toggle d'une case dans la grille
  const toggleStep = (trackIndex: number, stepIndex: number) => {
    const newGrid = [...grid];
    newGrid[trackIndex][stepIndex] = !newGrid[trackIndex][stepIndex];
    setGrid(newGrid);
  };

  return (
    <div className="p-6 bg-neutral-900 rounded-xl shadow-2xl text-white w-full max-w-4xl">
      {/* Contrôles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className={`px-6 py-2 rounded-full font-bold transition-colors ${
              isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-400">BPM</span>
            <input 
              type="number" 
              value={bpm} 
              onChange={handleBpmChange}
              className="w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-center"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500 font-mono">justmakeit v0.1</div>
      </div>

      {/* Grille du Séquenceur */}
      <div className="space-y-2">
        {grid.map((track, trackIndex) => (
          <div key={trackIndex} className="flex items-center gap-4">
            {/* Nom de la piste */}
            <div className="w-20 text-right text-sm font-bold text-gray-300">
              {INITIAL_TRACKS[trackIndex].name}
            </div>
            
            {/* Pas (Steps) - Utilisation de la classe grid-cols-16 migrée */}
            <div className="grid grid-cols-16 gap-1 flex-1">
              {track.map((isActive, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => toggleStep(trackIndex, stepIndex)}
                  className={`
                    h-10 rounded-sm transition-all duration-75
                    ${isActive ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-neutral-800 hover:bg-neutral-700'}
                    ${currentStep === stepIndex && isPlaying ? 'border-2 border-white' : 'border border-transparent'}
                  `}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}