import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/detect-dominant-color';
  return app(req, res);
}
