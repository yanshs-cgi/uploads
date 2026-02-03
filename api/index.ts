import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, getFileById, API_KEY } from './api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') {
    try {
      const fileId = await handleUpload(req);
      return res.status(200).json({ message: 'Upload successful', id: fileId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    try {
      const file = await getFileById(id);
      if (!file) return res.status(404).json({ error: 'File not found' });

      res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
      res.setHeader('Content-Type', 'application/zip');
      file.stream.pipe(res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
