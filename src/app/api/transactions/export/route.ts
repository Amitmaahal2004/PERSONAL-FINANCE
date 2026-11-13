import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv'; // csv or json
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filter: Record<string, any> = { userId: session.userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });

    if (format === 'json') {
      return NextResponse.json({ transactions });
    }

    // Generate CSV
    const headers = ['Date', 'Title', 'Type', 'Amount', 'Category', 'Account', 'Payment Method', 'Notes', 'Tags'];
    const rows = transactions.map((t) => [
      new Date(t.date).toISOString().split('T')[0],
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type,
      t.amount,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.account || '').replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${(t.tags || []).join(';')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

