import { VercelRequest } from '@vercel/node';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import Busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';

export const API_KEY = 'secret123';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR);

interface FileData {
  name: string;
  path: string;
  stream: any;
}

const fileMap: Map<string, FileData> = new Map();

export function handleUpload(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: req.headers });
    let fileId = '';

    busboy.on('file', (fieldname, file, filename) => {
      if (!filename.endsWith('.zip')) return reject(new Error('Only .zip files allowed'));
      fileId = uuidv4();
      const savePath = path.join(UPLOAD_DIR, fileId + '.zip');
      const writeStream = createWriteStream(savePath);
      file.pipe(writeStream);

      writeStream.on('close', () => {
        fileMap.set(fileId, { name: filename, path: savePath, stream: createReadStream(savePath) });
        resolve(fileId);
      });

      writeStream.on('error', (err) => reject(err));
    });

    busboy.on('error', (err) => reject(err));
    req.pipe(busboy);
  });
}

import { createReadStream } from 'fs';

export async function getFileById(id: string) {
  const file = fileMap.get(id);
  if (!file) return null;
  return { name: file.name, stream: createReadStream(file.path) };
}
