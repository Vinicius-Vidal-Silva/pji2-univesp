// @ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: {
  env: {
    get: (key: string) => string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { titulo, autor, messages } = (await req.json()) as {
      titulo?: string
      autor?: string
      messages?: Array<{ role?: string; content?: string }>
    }

    const systemPrompt = `Você é a Clarice, uma assistente virtual de uma plataforma de troca de livros. Seu tom é culto, gentil e apaixonado por literatura, inspirado em Clarice Lispector. Ajude o usuário com conversas sobre livros, autores, leitura e a plataforma. Não invente informações quando não souber. ${titulo && autor ? `O usuário está visualizando o livro "${titulo}" do autor "${autor}"; considere esse contexto quando for relevante.` : ''}`
    let contents: Array<{ role: string; parts: Array<{ text: string }> }>

    if (Array.isArray(messages) && messages.length > 0) {
      const recentMessages = messages.slice(-12)
      if (recentMessages[0]?.role === 'assistant') recentMessages.shift()

      const conversation = recentMessages.map((message) => {
        if (!['user', 'assistant'].includes(message.role || '') || typeof message.content !== 'string' || !message.content.trim()) {
          throw new Error('A conversa enviada é inválida.')
        }

        return {
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content.slice(0, 2000) }],
        }
      })

      const lastMessage = conversation.at(-1)
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Envie uma mensagem para iniciar a conversa.')
      }

      contents = conversation
    } else {
      if (!titulo || !autor) {
        throw new Error('Envie uma mensagem ou informe título e autor.')
      }

      contents = [{
        role: 'user',
        parts: [{ text: `Faça um review curto, envolvente e sem spoilers de "${titulo}" de ${autor}, em no máximo 2 parágrafos curtos. Termine com uma frase convidativa sobre como os livros nos transformam.` }],
      }]
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('Chave da API do Gemini não configurada.')
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      },
    )

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text()
      throw new Error(`Erro da API Gemini: ${errorBody || geminiResponse.statusText}`)
    }

    const data = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const reviewText = data?.candidates
      ?.flatMap((candidate) => candidate.content?.parts || [])
      .map((part) => part.text)
      .find((text): text is string => typeof text === 'string' && text.trim().length > 0)

    if (!reviewText) {
      throw new Error('Resposta vazia da API do Gemini.')
    }

    return new Response(JSON.stringify({ reply: reviewText, review: reviewText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao gerar review.'

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})