import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.status(200).json({
    status: 'ok',
    service: 'yasaflow',
    environment: process.env.VERCEL_ENV || 'unknown',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    checkedAt: new Date().toISOString(),
  });
}
