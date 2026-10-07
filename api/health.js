import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/health';
  return app(req, res);
}
