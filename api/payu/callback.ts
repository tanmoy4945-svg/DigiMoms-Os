import getApp from '../../src/backend/server';

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();

    if (!req.url || req.url === '/' || !req.url.includes('callback')) {
      req.url = '/api/payu/callback';
    }

    return new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);

      app(req, res, (err: any) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err: any) {
    console.error('[PayU Callback Proxy Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: String(err?.message || err) });
    }
  }
}
