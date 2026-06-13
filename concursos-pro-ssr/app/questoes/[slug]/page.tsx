import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuestaoInterativa from './QuestaoInterativa'

interface Props {
  params: Promise<{ slug: string }> // Mudou de id para slug
}

export default async function QuestaoDetalhe({ params }: Props) {
  const { slug } = await params

  // Agora buscamos no banco filtrando pela coluna 'slug'
  const { data: questao } = await supabase
    .from('questoes')
    .select('*')
    .eq('slug', slug) 
    .single()

  if (!questao) return notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `Simulado de ${questao.disciplina || 'Concurso'}`,
    "hasPart": {
      "@type": "Question",
      "name": questao.enunciado,
      "suggestedAnswer": [
        {
          "@type": "Answer",
          "text": questao.comentario_professor || "Confira o gabarito comentado oficial."
        }
      ]
    }
  }

  return (
    <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px 20px' }}>
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} 
      />

      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        <Link href="/questoes" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Voltar para a lista
        </Link>

        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {questao.banca}
          </span>
          <h1 style={{ color: '#3b82f6', fontSize: '2rem', marginTop: '10px' }}>{questao.disciplina}</h1>
        </div>

        <div style={{ background: '#1e293b', padding: '25px', borderRadius: '10px', borderLeft: '5px solid #3b82f6', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', marginBottom: '15px' }}>
            <span>📘</span> Enunciado
          </h3>
          <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>{questao.enunciado}</p>
        </div>

        <QuestaoInterativa questao={questao} />
      </div>
    </div>
  )
}