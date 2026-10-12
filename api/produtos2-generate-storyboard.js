import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/produtos2-generate-storyboard';
  return app(req, res);
}
