import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuestaoInterativa from './QuestaoInterativa'
import Footer from '@/components/Footer' // <-- Importação do Footer adicionada de volta

interface Props {
  params: Promise<{ slug: string }>
}

// 1. Geração Dinâmica de Metadados para SEO e Resultados Ricos do Google
export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  // Busca flexível: funciona se a URL tiver o ID ou o slug amigável
  const { data: questao } = await supabase
    .from('questoes')
    .select('enunciado, disciplina')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!questao) return {}

  return {
    title: `Questão de ${questao.disciplina || 'Concurso'} | Concursos Maranhão Pro`,
    description: `Resolva a questão: ${questao.enunciado?.substring(0, 150)}...`,
  }
}

// 2. Página Principal da Rota
export default async function QuestaoDetalhe({ params }: Props) {
  const { slug } = await params

  // Busca flexível: Garante que as questões antigas abram mesmo se o slug estiver nulo no banco
  const { data: questao } = await supabase
    .from('questoes')
    .select('*')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!questao) return notFound()

  // Prepara o Objeto Completo de Dados Estruturados para o Google detectar como Quiz válido
  const listaOpcoes = questao.opcoes ? Object.entries(questao.opcoes) : []
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `Simulado de ${questao.disciplina || 'Concurso'}`,
    "description": questao.enunciado,
    "about": {
      "@type": "Thing",
      "name": questao.disciplina
    },
    "hasPart": {
      "@type": "Question",
      "name": questao.enunciado,
      "text": questao.enunciado,
      "suggestedAnswer": listaOpcoes.map(([letra, texto]: any) => ({
        "@type": "Answer",
        "position": letra.toUpperCase(),
        "text": texto,
        "isBasedOnRecognizedAuthority": true
      })),
      "acceptedAnswer": {
        "@type": "Answer",
        "position": questao.alternativa_correta?.toUpperCase(),
        "text": questao.opcoes?.[questao.alternativa_correta] || '',
        "comment": {
          "@type": "Comment",
          "text": questao.comentario_professor || "Confira o gabarito comentado oficial."
        }
      }
    }
  }

  return (
    <>
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
            {questao.banca && (
              <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {questao.banca}
              </span>
            )}
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

      {/* O Footer montado fora do container da questão para ficar bonito no rodapé */}
      <Footer />
    </>
  )
}