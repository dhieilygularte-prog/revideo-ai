import app from './_app.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
  maxDuration: 60,
};

export default function handler(req, res) {
  req.url = '/api/refine-video-prompt';
  return app(req, res);
}
