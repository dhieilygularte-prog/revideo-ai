import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/micro-edit-image';
  return app(req, res);
}
