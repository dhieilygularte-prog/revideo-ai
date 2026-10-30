import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/test-image-providers';
  return app(req, res);
}
