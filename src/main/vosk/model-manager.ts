/**
 * On-demand download and cache of Vosk language models.
 * Models are stored under app.getPath('userData')/vosk-models/<model-name>/
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { app } from 'electron';
import extract from 'extract-zip';
import { VOSK_LANGUAGES } from '../../shared/constants';

export interface DownloadProgress {
  language: string;
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
}

function getModelsDir(): string {
  return path.join(app.getPath('userData'), 'vosk-models');
}

/** Returns the path where the model for the given language code should live (extracted folder). */
export function getModelDir(languageCode: string): string {
  const option = VOSK_LANGUAGES.find((l) => l.code === languageCode);
  if (!option) return path.join(getModelsDir(), 'unknown');
  return path.join(getModelsDir(), option.model);
}

/** Check if the model directory exists and contains expected Vosk model files. */
export function isModelDownloaded(languageCode: string): boolean {
  const dir = getModelDir(languageCode);
  if (!fs.existsSync(dir)) return false;
  // Vosk expects conf/model.conf and am/final.mdl (or similar) in the model dir
  const confDir = path.join(dir, 'conf');
  const amDir = path.join(dir, 'am');
  return fs.existsSync(confDir) && fs.existsSync(amDir);
}

/** Get language option by code. */
export function getLanguageOption(languageCode: string): (typeof VOSK_LANGUAGES)[number] | undefined {
  return VOSK_LANGUAGES.find((l) => l.code === languageCode);
}

/**
 * Download the model zip and extract to the model directory.
 * Reports progress via onProgress (percent 0-100).
 */
export async function downloadModel(
  languageCode: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<void> {
  const option = getLanguageOption(languageCode);
  if (!option) throw new Error(`Unknown language: ${languageCode}`);

  const modelsDir = getModelsDir();
  if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

  const zipPath = path.join(modelsDir, `${option.model}.zip`);
  const extractDir = path.join(modelsDir, option.model);

  // If already extracted, skip
  if (isModelDownloaded(languageCode)) {
    onProgress({ language: languageCode, percent: 100, bytesDownloaded: 0, totalBytes: 0 });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);
    https.get(option.url, (response) => {
      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let bytesDownloaded = 0;

      response.on('data', (chunk: Buffer) => {
        bytesDownloaded += chunk.length;
        const percent = totalBytes > 0 ? Math.min(99, Math.round((bytesDownloaded / totalBytes) * 100)) : 0;
        onProgress({ language: languageCode, percent, bytesDownloaded, totalBytes });
      });

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(zipPath, () => {});
      reject(err);
    });
  });

  // Extract (zip contains top-level folder e.g. vosk-model-small-en-us-0.15/)
  await extract(zipPath, { dir: getModelsDir() });
  fs.unlinkSync(zipPath);

  // Ensure the expected model dir exists: some zips use a different root folder name
  if (!fs.existsSync(extractDir)) {
    const entries = fs.readdirSync(modelsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory() || ent.name === option.model) continue;
      const candidate = path.join(modelsDir, ent.name);
      const hasConf = fs.existsSync(path.join(candidate, 'conf'));
      const hasAm = fs.existsSync(path.join(candidate, 'am'));
      if (hasConf && hasAm) {
        fs.renameSync(candidate, extractDir);
        break;
      }
    }
  }

  onProgress({ language: languageCode, percent: 100, bytesDownloaded: 0, totalBytes: 0 });
}

/** Remove a cached model to free space. */
export function deleteModel(languageCode: string): void {
  const dir = getModelDir(languageCode);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
  const option = getLanguageOption(languageCode);
  if (option) {
    const zipPath = path.join(getModelsDir(), `${option.model}.zip`);
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }
}
