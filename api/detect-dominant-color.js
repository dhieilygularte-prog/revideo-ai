import app from './_app.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
  maxDuration: 30,
};

export default function handler(req, res) {
  req.url = '/api/detect-dominant-color';
  return app(req, res);
}
