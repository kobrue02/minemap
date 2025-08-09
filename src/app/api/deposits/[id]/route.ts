import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Get single deposit by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('mining_deposits')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch deposit' }, 
      { status: 500 }
    )
  }
}

// PUT - Update deposit by ID
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
        project_name: body.projectName,
        resource: body.resource,
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        country: body.country,
        status: body.status,
        description: body.description,
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

// DELETE - Delete deposit by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('mining_deposits')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete deposit' }, 
      { status: 500 }
    )
  }
}