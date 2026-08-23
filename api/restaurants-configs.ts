export default async function handler(req: any, res: any) {
  try {
    return res.status(200).json({ success: true, data: {} });
  } catch (err: any) {
    return res.status(200).json({ success: true, data: {} });
  }
}
