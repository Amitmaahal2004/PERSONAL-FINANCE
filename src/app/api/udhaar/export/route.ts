import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Udhaar } from '@/models/Udhaar';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    const tab = searchParams.get('tab');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const filter: Record<string, any> = {
      userId: session.userId,
      isDeleted: { $ne: true },
    };

    if (idsParam) {
      const idList = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (idList.length > 0) {
        filter._id = { $in: idList };
      }
    } else {
      if (tab === 'lent') filter.type = 'lent';
      if (tab === 'borrowed') filter.type = 'borrowed';
      if (tab === 'active') {
        filter.status = { $ne: 'cleared' };
        filter.remainingAmount = { $gt: 0 };
      }
      if (tab === 'cleared') filter.status = 'cleared';

      if (type && (type === 'lent' || type === 'borrowed')) filter.type = type;
      if (status) filter.status = status;
    }

    const records = await Udhaar.find(filter).sort({ udhaarDate: -1 });

    const headers = [
      'Record ID',
      'Type',
      'Person Name',
      'Phone Number',
      'Original Amount',
      'Total Repaid',
      'Remaining Amount',
      'Status',
      'Udhaar Date',
      'Expected Repayment Date',
      'Settlement Date',
      'Settlement Duration (Days)',
      'Account',
      'Payment Method',
      'Description',
      'Notes',
    ];

    const rows = records.map((r) => [
      `"${r.recordId}"`,
      r.type === 'lent' ? 'Lent (Receivable)' : 'Borrowed (Payable)',
      `"${(r.personName || '').replace(/"/g, '""')}"`,
      `"${r.phoneNumber || ''}"`,
      r.originalAmount,
      r.totalRepaid || 0,
      r.remainingAmount || 0,
      r.status.toUpperCase(),
      new Date(r.udhaarDate).toISOString().split('T')[0],
      r.expectedRepaymentDate ? new Date(r.expectedRepaymentDate).toISOString().split('T')[0] : '',
      r.settlementDate ? new Date(r.settlementDate).toISOString().split('T')[0] : '',
      r.settlementDurationDays ?? '',
      `"${(r.accountName || '').replace(/"/g, '""')}"`,
      `"${r.paymentMethod || 'Cash'}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="udhaar_records_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

