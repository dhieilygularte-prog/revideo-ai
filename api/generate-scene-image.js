import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/generate-scene-image';
  return app(req, res);
}
