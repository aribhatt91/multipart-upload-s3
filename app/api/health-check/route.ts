import { NextRequest, NextResponse } from 'next/server';
// GET /api/upload/list
export async function GET(req: NextRequest) {
    return NextResponse.json({ message: "OK" });
}
