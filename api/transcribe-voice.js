import app from './_app.js';
export default function handler(req, res) {
  req.url = '/api/transcribe-voice';
  return app(req, res);
}
