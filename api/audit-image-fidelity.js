import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/audit-image-fidelity';
  return app(req, res);
}
