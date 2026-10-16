import app from './_app.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  maxDuration: 60,
};

export default function handler(req, res) {
  req.url = '/api/produtos2-audit-video';
  return app(req, res);
}
