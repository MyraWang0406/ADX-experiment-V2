import { NextResponse } from 'next/server'
import { loadExperimentsList } from '@/lib/server/data-loader'

export async function GET() {
  try {
    const experiments = await loadExperimentsList()
    return NextResponse.json({ experiments })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

