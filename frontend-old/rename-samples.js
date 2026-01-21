import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration des chemins
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_DIR = path.join(__dirname, 'src/assets/samples');

function sanitize(str) {
  return str
    .toLowerCase() // Tout en minuscule
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9.]/g, '-') // Remplacer les espaces et symboles par des tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples (ex: --)
    .replace(/^-|-$/g, ''); // Enlever les tirets au début/fin
}

function renameRecursive(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Dossier introuvable : ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const oldPath = path.join(dir, file);
    const stat = fs.statSync(oldPath);

    if (stat.isDirectory()) {
      renameRecursive(oldPath);
    } else {
      // On ne touche qu'aux fichiers audio (.wav ou .mp3)
      if (/\.(wav|mp3)$/i.test(file)) {
        const ext = path.extname(file);
        const nameWithoutExt = path.basename(file, ext);
        
        const newName = sanitize(nameWithoutExt) + ext.toLowerCase();
        const newPath = path.join(dir, newName);

        if (oldPath !== newPath) {
          fs.renameSync(oldPath, newPath);
          console.log(`✅ Renommé : "${file}" -> "${newName}"`);
        }
      }
    }
  }
}

console.log(`🔍 Scan et nettoyage du dossier : ${TARGET_DIR}`);
renameRecursive(TARGET_DIR);
console.log("🎉 Terminé !");