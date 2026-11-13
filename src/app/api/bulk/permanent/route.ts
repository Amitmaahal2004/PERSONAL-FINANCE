import { POST as permanentHandler } from '@/app/api/trash/permanent/route';

export async function POST(req: Request) {
  return permanentHandler(req);
}

