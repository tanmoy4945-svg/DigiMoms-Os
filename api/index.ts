import getApp from '../src/backend/server';

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);

      app(req, res, (err: any) => {
        if (err) {
          console.error('[API Error]:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error', message: String(err?.message || err) });
          }
          return resolve();
        }
        if (!res.headersSent) {
          res.status(404).json({ error: 'Not Found', path: req.url });
        }
        resolve();
      });
    });
  } catch (err: any) {
    console.error('[Vercel API Handler Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: String(err?.message || err) });
    }
  }
}
