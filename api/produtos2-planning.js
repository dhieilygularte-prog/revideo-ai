import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/produtos2-planning';
  return app(req, res);
}
