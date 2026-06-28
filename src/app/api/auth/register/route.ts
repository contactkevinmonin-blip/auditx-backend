import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, options } from '@/lib/auth';

export const runtime = 'nodejs';

export function OPTIONS() { return options(); }

export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum)' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM auditx_users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO auditx_users (email, password_hash)
      VALUES (${email.toLowerCase()}, ${passwordHash})
      RETURNING id, email
    `;

    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO auditx_licenses (user_id, plan, trial_ends_at, status)
      VALUES (${user.id}, 'trial', ${trialEndsAt.toISOString()}, 'active')
    `;

    const token = signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email },
      license: {
        plan: 'trial',
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        days_left: 7,
        active: true,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
