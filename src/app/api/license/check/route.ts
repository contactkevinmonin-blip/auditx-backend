import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken, getTokenFromRequest, licenseStatus, options } from '@/lib/auth';

export const runtime = 'nodejs';

export function OPTIONS() { return options(); }

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ active: false, reason: 'no_token' }, { status: 401 });
    }

    let payload: { userId: string; email: string };
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ active: false, reason: 'invalid_token' }, { status: 401 });
    }

    const rows = await sql`
      SELECT l.plan, l.status, l.trial_ends_at, u.email
      FROM auditx_licenses l
      JOIN auditx_users u ON u.id = l.user_id
      WHERE l.user_id = ${payload.userId}
    `;

    const license = rows[0];
    if (!license) {
      return NextResponse.json({ active: false, reason: 'no_license' });
    }

    const { isPro, isTrial, daysLeft, active } = licenseStatus(license);

    return NextResponse.json({
      active,
      plan: license.plan,
      status: isPro ? 'pro' : isTrial ? 'trial' : 'expired',
      email: license.email,
      trial_ends_at: license.trial_ends_at,
      days_left: isTrial ? daysLeft : null,
    });
  } catch (err) {
    console.error('License check error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
