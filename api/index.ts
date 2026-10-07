import app from '../server';

export default function handler(req: any, res: any) {
  // Garantir que req.url comece com /api para casar com as rotas do Express quando executado na Vercel
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
