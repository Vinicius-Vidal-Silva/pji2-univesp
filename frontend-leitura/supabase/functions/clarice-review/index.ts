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

// Modelos atualizados conforme recomendação oficial da API
const MODEL_FALLBACK_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
]

const reviewCache = new Map<string, string>()

class GeminiApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
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

    const isChatMode = Array.isArray(messages) && messages.length > 0
    const cacheKey = !isChatMode && titulo && autor
      ? `${titulo.trim().toLowerCase()}::${autor.trim().toLowerCase()}`
      : null

    if (cacheKey && reviewCache.has(cacheKey)) {
      const cachedReview = reviewCache.get(cacheKey)!
      return new Response(JSON.stringify({ reply: cachedReview, review: cachedReview, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `Você é a Clarice, uma assistente virtual de uma plataforma de troca de livros. Seu tom é culto, gentil e apaixonado por literatura, inspirado em Clarice Lispector. Ajude o usuário com conversas sobre livros, autores, leitura e a plataforma. Não invente informações quando não souber. ${titulo && autor ? `O usuário está visualizando o livro "${titulo}" do autor "${autor}"; considere esse contexto quando for relevante.` : ''}`

    let contents: Array<{ role: string; parts: Array<{ text: string }> }>

    if (isChatMode) {
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

    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    })

    let geminiResponse: Response | null = null
    let lastValidStatus = 503
    let lastErrorBody = ''
    const attemptLog: string[] = []

    for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
      const model = MODEL_FALLBACK_CHAIN[i]
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      })

      geminiResponse = response
      attemptLog.push(`${model}:${response.status}`)

      if (response.ok) {
        break
      }

      const errorText = await response.text()
      // Guarda o status caso não seja 404 para não mascarar erros de limite (429/503)
      if (response.status !== 404) {
        lastValidStatus = response.status
        lastErrorBody = errorText
      } else if (!lastErrorBody) {
        lastErrorBody = errorText
      }

      const shouldFallback = [404, 429, 500, 502, 503, 504].includes(response.status)
      if (!shouldFallback || i === MODEL_FALLBACK_CHAIN.length - 1) {
        break
      }

      console.warn(`Modelo ${model} falhou com HTTP ${response.status}. Tentando próximo modelo...`)
      await new Promise((resolve) => setTimeout(resolve, 350))
    }

    if (!geminiResponse) {
      throw new Error('Não foi possível iniciar a solicitação ao Gemini.')
    }

    if (!geminiResponse.ok) {
      const finalStatus = geminiResponse.status === 404 ? lastValidStatus : geminiResponse.status

      // Se for o botão de review do livro e a cota estiver esgotada, exibe o review literário de contingência
      if (!isChatMode && [429, 500, 502, 503, 504].includes(finalStatus)) {
        const fallbackReview = `"${titulo}", de ${autor}, é uma daquelas obras que guardam universos inteiros esperando pelo momento certo de serem descobertos. Cada página carrega a promessa de um diálogo silencioso entre quem escreveu e quem lê.\n\nAfinal, nunca saímos de um livro exatamente como entramos: toda leitura nos transforma um pouco. Quer conversar sobre esta obra? Escreva para mim abaixo!`

        return new Response(JSON.stringify({ reply: fallbackReview, review: fallbackReview, fallback: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if ([429, 500, 502, 503, 504].includes(finalStatus)) {
        throw new GeminiApiError(
          `A Clarice está com muitas leituras simultâneas no momento (${attemptLog.join(', ')}). Aguarde alguns segundos e tente novamente.`,
          finalStatus,
        )
      }

      throw new GeminiApiError(
        `Erro da API Gemini (${attemptLog.join(', ')}): ${lastErrorBody || geminiResponse.statusText}`,
        finalStatus,
      )
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

    if (cacheKey) {
      reviewCache.set(cacheKey, reviewText)
    }

    return new Response(JSON.stringify({ reply: reviewText, review: reviewText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao gerar review.'

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error instanceof GeminiApiError ? error.status : 400,
    })
  }
})