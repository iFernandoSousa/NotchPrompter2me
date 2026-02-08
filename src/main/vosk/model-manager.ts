/**
 * On-demand download and cache of Vosk language models.
 * Models are stored under app.getPath('userData')/vosk-models/<model-name>/
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { app } from 'electron';
import extract from 'extract-zip';
import { VOSK_LANGUAGES } from '../../shared/constants';

const TAG = '[ModelManager]';

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
  console.log(`${TAG} isModelDownloaded check: lang=${languageCode}, dir=${dir}`);
  if (!fs.existsSync(dir)) {
    console.log(`${TAG}   -> dir does NOT exist`);
    return false;
  }
  // List contents of the model directory for debugging
  const dirContents = fs.readdirSync(dir);
  console.log(`${TAG}   -> dir exists, contents: [${dirContents.join(', ')}]`);

  // Vosk models come in two layouts:
  //   (a) Nested: conf/mfcc.conf + am/final.mdl  (larger / newer models)
  //   (b) Flat:   mfcc.conf + final.mdl directly in root  (smaller / older models)
  const confDir = path.join(dir, 'conf');
  const amDir = path.join(dir, 'am');
  const hasNestedLayout = fs.existsSync(confDir) && fs.existsSync(amDir);

  const hasFlatLayout =
    dirContents.includes('final.mdl') ||
    dirContents.includes('mfcc.conf') ||
    dirContents.includes('Gr.fst');

  console.log(`${TAG}   -> nested (conf/ + am/): ${hasNestedLayout}, flat (final.mdl|mfcc.conf|Gr.fst): ${hasFlatLayout}`);
  return hasNestedLayout || hasFlatLayout;
}

/** Get language option by code. */
export function getLanguageOption(languageCode: string): (typeof VOSK_LANGUAGES)[number] | undefined {
  return VOSK_LANGUAGES.find((l) => l.code === languageCode);
}

/**
 * Download a URL following HTTP redirects (up to maxRedirects).
 * Returns the final response stream.
 */
function downloadWithRedirects(
  url: string,
  maxRedirects: number = 10
): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const doRequest = (currentUrl: string, remainingRedirects: number) => {
      console.log(`${TAG} Downloading: ${currentUrl} (redirects left: ${remainingRedirects})`);
      const getter = currentUrl.startsWith('https') ? https.get : http.get;
      getter(currentUrl, (response) => {
        const statusCode = response.statusCode ?? 0;
        console.log(`${TAG}   -> HTTP ${statusCode}`);

        // Follow redirects (301, 302, 303, 307, 308)
        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          if (remainingRedirects <= 0) {
            reject(new Error('Too many redirects'));
            return;
          }
          const redirectUrl = response.headers.location;
          console.log(`${TAG}   -> Redirecting to: ${redirectUrl}`);
          // Consume the response to free the socket
          response.resume();
          doRequest(redirectUrl, remainingRedirects - 1);
          return;
        }

        if (statusCode !== 200) {
          response.resume();
          reject(new Error(`Download failed with HTTP ${statusCode}`));
          return;
        }

        resolve(response);
      }).on('error', reject);
    };

    doRequest(url, maxRedirects);
  });
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

  console.log(`${TAG} downloadModel: lang=${languageCode}, model=${option.model}`);
  console.log(`${TAG}   modelsDir=${modelsDir}`);
  console.log(`${TAG}   zipPath=${zipPath}`);
  console.log(`${TAG}   extractDir=${extractDir}`);

  // If already extracted, skip
  if (isModelDownloaded(languageCode)) {
    console.log(`${TAG}   Model already downloaded, skipping`);
    onProgress({ language: languageCode, percent: 100, bytesDownloaded: 0, totalBytes: 0 });
    return;
  }

  console.log(`${TAG}   Starting download from ${option.url}`);

  const response = await downloadWithRedirects(option.url);

  await new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);
    const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
    let bytesDownloaded = 0;

    console.log(`${TAG}   Content-Length: ${totalBytes}`);

    response.on('data', (chunk: Buffer) => {
      bytesDownloaded += chunk.length;
      const percent = totalBytes > 0 ? Math.min(99, Math.round((bytesDownloaded / totalBytes) * 100)) : 0;
      onProgress({ language: languageCode, percent, bytesDownloaded, totalBytes });
    });

    response.pipe(file);
    file.on('finish', () => {
      file.close();
      const fileSize = fs.statSync(zipPath).size;
      console.log(`${TAG}   Download complete. File size: ${fileSize} bytes`);
      resolve();
    });
    file.on('error', (err) => {
      fs.unlink(zipPath, () => {});
      reject(err);
    });
    response.on('error', (err) => {
      fs.unlink(zipPath, () => {});
      reject(err);
    });
  });

  console.log(`${TAG}   Extracting zip to ${modelsDir}`);
  // Extract (zip contains top-level folder e.g. vosk-model-small-en-us-0.15/)
  await extract(zipPath, { dir: modelsDir });
  fs.unlinkSync(zipPath);
  console.log(`${TAG}   Zip extracted and deleted`);

  // List what we got after extraction
  const afterEntries = fs.readdirSync(modelsDir, { withFileTypes: true });
  console.log(`${TAG}   Models dir contents after extraction: [${afterEntries.map((e) => `${e.name}${e.isDirectory() ? '/' : ''}`).join(', ')}]`);

  // Ensure the expected model dir exists: some zips use a different root folder name
  if (!fs.existsSync(extractDir)) {
    console.log(`${TAG}   Expected dir '${option.model}' not found, scanning for model directory...`);
    for (const ent of afterEntries) {
      if (!ent.isDirectory() || ent.name === option.model) continue;
      const candidate = path.join(modelsDir, ent.name);
      const hasConf = fs.existsSync(path.join(candidate, 'conf'));
      const hasAm = fs.existsSync(path.join(candidate, 'am'));
      console.log(`${TAG}     Candidate '${ent.name}': conf=${hasConf}, am=${hasAm}`);
      if (hasConf && hasAm) {
        console.log(`${TAG}     Renaming '${ent.name}' -> '${option.model}'`);
        fs.renameSync(candidate, extractDir);
        break;
      }
    }
  } else {
    console.log(`${TAG}   Expected dir '${option.model}' found`);
  }

  // Final verification
  const finalCheck = isModelDownloaded(languageCode);
  console.log(`${TAG}   Final isModelDownloaded check: ${finalCheck}`);

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
