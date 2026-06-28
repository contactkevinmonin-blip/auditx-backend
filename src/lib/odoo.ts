async function odooCall(service: string, method: string, args: unknown[]): Promise<unknown> {
  const res = await fetch(`${process.env.ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'call',
      params: { service, method, args },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.data?.message ?? data.error.message);
  return data.result;
}

async function executeKw(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<unknown> {
  const uid = await odooCall('common', 'authenticate', [
    process.env.ODOO_DB!,
    process.env.ODOO_USERNAME!,
    process.env.ODOO_API_KEY!,
    {},
  ]) as number;

  if (!uid) throw new Error('Odoo auth failed');

  return odooCall('object', 'execute_kw', [
    process.env.ODOO_DB!,
    uid,
    process.env.ODOO_API_KEY!,
    model,
    method,
    args,
    kwargs,
  ]);
}

export async function syncContactToOdoo(email: string, isPro: boolean): Promise<void> {
  try {
    const name = email.split('@')[0];
    const comment = isPro ? 'AuditX Pro — abonné' : 'AuditX Trial — essai 7j';

    const existing = await executeKw('res.partner', 'search', [[['email', '=', email]]]) as number[];

    if (existing.length > 0) {
      await executeKw('res.partner', 'write', [[existing[0]], { comment }]);
    } else {
      await executeKw('res.partner', 'create', [{ email, name, comment, customer_rank: 1 }]);
    }
  } catch (err) {
    console.error('Odoo sync error:', err);
  }
}
