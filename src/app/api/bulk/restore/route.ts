import { POST as restoreHandler } from '@/app/api/trash/restore/route';

export async function POST(req: Request) {
  return restoreHandler(req);
}

