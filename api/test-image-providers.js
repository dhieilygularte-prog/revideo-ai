import app from './_app.js';

export const config = {
  maxDuration: 120,
};

export default function handler(req, res) {
  req.url = '/api/test-image-providers';
  return app(req, res);
}
