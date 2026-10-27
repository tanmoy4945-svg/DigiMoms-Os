import getApp from '../../src/backend/server';

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('[PhonePe Verify Payment Proxy Error]:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
