import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch all companies
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_names')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

// PUT - Update company by ID
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const body = await request.json()
      const { id } = await params
  
      const { data, error } = await supabaseAdmin
        .from('mining_deposits')
        .update({
          company_name: body.companyName,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
  
      if (error) throw error
      
      return NextResponse.json(data)
    } catch (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update deposit' }, 
        { status: 500 }
      )
    }
  }