import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/analyze-video';
  return app(req, res);
}
