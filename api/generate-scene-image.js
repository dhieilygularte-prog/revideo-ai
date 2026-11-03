import app from './_app.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  maxDuration: 90,
};

export default function handler(req, res) {
  req.url = '/api/generate-scene-image';
  return app(req, res);
}
