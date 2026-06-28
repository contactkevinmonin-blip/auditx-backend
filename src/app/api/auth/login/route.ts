import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken, licenseStatus, options } from '@/lib/auth';

export const runtime = 'nodejs';

export function OPTIONS() { return options(); }

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const rows = await sql`
      SELECT u.id, u.email, u.password_hash,
             l.plan, l.status, l.trial_ends_at, l.stripe_subscription_id
      FROM auditx_users u
      LEFT JOIN auditx_licenses l ON l.user_id = u.id
      WHERE u.email = ${email.toLowerCase()}
    `;

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email });
    const { isPro, isTrial, daysLeft, active } = licenseStatus(user);

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email },
      license: {
        plan: user.plan,
        status: isPro ? 'pro' : isTrial ? 'trial' : 'expired',
        trial_ends_at: user.trial_ends_at,
        days_left: daysLeft,
        active,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
