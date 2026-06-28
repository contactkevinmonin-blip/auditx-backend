import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export interface JWTPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export function cors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export function options() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function licenseStatus(license: { plan: string; status: string; trial_ends_at: string }) {
  const now = new Date();
  const trialEnd = new Date(license.trial_ends_at);
  const isPro = license.plan === 'pro' && license.status === 'active';
  const isTrial = license.plan === 'trial' && trialEnd > now;
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000));
  return { isPro, isTrial, daysLeft, active: isPro || isTrial };
}
