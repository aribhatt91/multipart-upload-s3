/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB_CONFIG } from '@/lib/config';
import { getAllDocuments } from '@/lib/helpers/db.helper';
import Logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
// GET /api/upload/list
export async function GET(req: NextRequest) {
  try {
    const items = await getAllDocuments(DB_CONFIG.table);
    Logger.log('GET /api/upload/list', items);
    return NextResponse.json({ data: items });
  }catch (error: any) {
    Logger.error(error);
    return NextResponse.json({ error: error?.message || 'Something went wrong' }, { status: 500 });
  }
}
