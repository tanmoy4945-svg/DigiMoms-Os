import getApp from '../src/backend/server.ts';

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
