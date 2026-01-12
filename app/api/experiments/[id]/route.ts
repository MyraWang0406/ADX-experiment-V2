import { NextRequest, NextResponse } from 'next/server'
import { loadExperimentData } from '@/lib/server/data-loader'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expId = params.id
    const data = await loadExperimentData(expId)
    
    if (!data) {
      return NextResponse.json(
        { error: `Experiment ${expId} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

