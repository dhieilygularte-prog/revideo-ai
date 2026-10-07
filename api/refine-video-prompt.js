import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/refine-video-prompt';
  return app(req, res);
}
