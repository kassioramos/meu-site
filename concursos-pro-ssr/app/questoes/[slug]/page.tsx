import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuestaoInterativa from '@/app/questoes/[slug]/QuestaoInterativa'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface Props {
  params: Promise<{ slug: string }>
}

// 🎯 ESSA FUNÇÃO APRESENTA OS DADOS ESTRUTURADOS DIRETAMENTE NO HEAD PARA O GOOGLE
export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  if (!slug) return {}

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  let query = supabase.from('questoes').select('*')
  
  if (isUuid) {
    query = query.eq('id', slug)
  } else {
    query = query.eq('slug', slug)
  }

  const { data: questao } = await query.maybeSingle()
  if (!questao) return {}

  const listaOpcoes = questao.opcoes ? Object.entries(questao.opcoes) : []
  const itensOpcoes = listaOpcoes.map(([letra, texto]: [string, any], index) => ({
    "@type": "Answer",
    "position": index + 1,
    "text": `Alternativa ${letra.toUpperCase()}: ${texto}`
  }))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `Simulado de ${questao.disciplina || 'Concursos Maranhão'}`,
    "description": questao.enunciado ? questao.enunciado.substring(0, 160) : 'Questão de concurso público',
    "about": {
      "@type": "Thing",
      "name": questao.disciplina || "Concurso"
    },
    "hasPart": [
      {
        "@type": "Question",
        "name": questao.enunciado ? questao.enunciado.substring(0, 100) + "..." : "Questão",
        "text": questao.enunciado,
        "suggestedAnswer": itensOpcoes,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": questao.opcoes && questao.alternativa_correta 
            ? `Alternativa ${questao.alternativa_correta.toUpperCase()}: ${(questao.opcoes as Record<string, any>)[questao.alternativa_correta.toLowerCase()] || ''}` 
            : '',
          "comment": {
            "@type": "Comment",
            "text": questao.comentario_professor || "Confira o gabarito comentado oficial na plataforma Concursos Maranhão Pro."
          }
        }
      }
    ]
  }

  return {
    title: `Questão de ${questao.disciplina} - ${questao.banca || 'Simulado'}`,
    description: questao.enunciado ? questao.enunciado.substring(0, 150) : '',
    other: {
      'script:ld+json': JSON.stringify(jsonLd)
    }
  }
}

export default async function QuestaoDetalhe({ params }: Props) {
  const { slug } = await params

  if (!slug) return notFound()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  let query = supabase.from('questoes').select('*')

  if (isUuid) {
    query = query.eq('id', slug)
  } else {
    query = query.eq('slug', slug)
  }

  const { data: questao } = await query.maybeSingle()

  if (!questao) return notFound()

  return (
    <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px 20px' }}>
      
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        <Link href="/questoes" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Voltar para a lista
        </Link>

        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          {questao.banca && (
            <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {questao.banca}
            </span>
          )}
          <h1 style={{ color: '#3b82f6', fontSize: '2rem', marginTop: '10px' }}>{questao.disciplina}</h1>
        </div>

        <div style={{ 
          background: '#1e293b', 
          padding: '25px', 
          borderRadius: '10px', 
          borderLeft: '5px solid #3b82f6',
          marginBottom: '20px' 
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', marginBottom: '15px' }}>
            <span>📘</span> Enunciado
          </h3>
          <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>{questao.enunciado}</p>
        </div>

        <QuestaoInterativa questao={questao as any} />

      </div>
    </div>
  )
}