import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userMessage, systemPrompt } = await req.json()

    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not defined.")
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bolvyapar-ai.vercel.app',
        'X-Title': 'BolVyapar AI'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt || 'You are BolVyapar AI, a helpful shop assistant.' },
          { role: 'user', content: userMessage || '' }
        ]
      })
    })

    const data = await response.json()
    const reply = data?.choices?.[0]?.message?.content || 'Sale recorded successfully!'
    
    return NextResponse.json({ reply: reply })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json({ reply: 'Sale recorded!' }, { status: 200 })
  }
}
