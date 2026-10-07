import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/cost-report';
  return app(req, res);
}
