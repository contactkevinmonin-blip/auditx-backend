import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken, getTokenFromRequest, options } from '@/lib/auth';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export function OPTIONS() { return options(); }

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const payload = verifyToken(token);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: payload.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'AuditX Pro',
            description: 'Audit de sécurité complet — accès illimité',
          },
          unit_amount: 4599,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      metadata: { userId: payload.userId },
      success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
