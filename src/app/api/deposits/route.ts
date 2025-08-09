import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all deposits
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('mining_deposits')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
  }
}

// POST - Add new deposit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('mining_deposits')
      .insert([body])
      .select()

    if (error) throw error
    
    return NextResponse.json(data[0])
  } catch {
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}