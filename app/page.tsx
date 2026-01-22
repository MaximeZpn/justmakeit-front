import fs from 'fs';
import path from 'path';
import Sequencer from "./Sequencer";

// Fonction exécutée côté serveur pour lister les fichiers
function getSampleLibrary() {
  const samplesDir = path.join(process.cwd(), 'public', 'samples');
  const library: Record<string, { name: string; url: string }[]> = {
    Kick: [],
    Snare: [],
    'Hi-Hat': [],
    Clap: []
  };

  if (fs.existsSync(samplesDir)) {
    const items = fs.readdirSync(samplesDir, { withFileTypes: true });

    items.forEach(item => {
      if (item.isDirectory()) {
        const folderName = item.name.toLowerCase();
        let category = '';

        // Mapping des dossiers vers les catégories d'instruments
        if (folderName.includes('kick')) category = 'Kick';
        else if (folderName.includes('snare')) category = 'Snare';
        else if (folderName.includes('hat')) category = 'Hi-Hat';
        else if (folderName.includes('clap')) category = 'Clap';

        if (category) {
          const files = fs.readdirSync(path.join(samplesDir, item.name));
          files.forEach(file => {
            if (/\.(wav|mp3|aif)$/i.test(file)) {
              library[category].push({
                name: file,
                url: `/samples/${item.name}/${file}`
              });
            }
          });
        }
      }
    });
  }
  return library;
}

export default function Home() {
  const sampleLibrary = getSampleLibrary();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-2 md:p-8 bg-black">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          🎵 justmakeit&nbsp;
          <code className="font-mono font-bold">Phase 1: Core Sequencer</code>
        </p>
      </div>

      <div className="w-full flex justify-center">
        <Sequencer initialLibrary={sampleLibrary} />
      </div>
    </main>
  );
}