import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import QuestaoInterativa from './QuestaoInterativa'
import Footer from '@/components/Footer' // <-- IMPORTAÇÃO DO FOOTER ADICIONADA AQUI

interface Props {
  params: Promise<{ slug: string }>
}

// 1. Geração Dinâmica de Metadados para SEO básico e Redes Sociais
export async function generateMetadata({ params }: Props) {
  const { slug } = await params

  const { data: questao } = await supabase
    .from('questoes')
    .select('enunciado, disciplina')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!questao) return {}

  const tituloCurto = questao.enunciado ? `${questao.enunciado.substring(0, 50)}...` : 'Questão'

  return {
    title: `Questão de ${questao.disciplina || 'Concurso'} | Concursos Maranhão Pro`,
    description: `Resolva a questão: ${questao.enunciado?.substring(0, 150)}...`,
  }
}

// 2. Página Principal da Rota
export default async function QuestaoPage({ params }: Props) {
  const { slug } = await params

  // Busca a questão no Supabase aceitando tanto o ID antigo quanto o novo slug amigável
  const { data: questao } = await supabase
    .from('questoes')
    .select('*')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!questao) return notFound()

  // Prepara o Objeto de Dados Estruturados (Resultados Ricos do Google)
  const listaOpcoes = questao.opcoes ? Object.entries(questao.opcoes) : []
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    'name': `Questão de ${questao.disciplina || 'Concurso'}`,
    'description': questao.enunciado,
    'about': {
      '@type': 'Thing',
      'name': questao.disciplina
    },
    'hasPart': {
      '@type': 'Question',
      'name': questao.enunciado,
      'text': questao.enunciado,
      'suggestedAnswer': listaOpcoes.map(([letra, texto]: any) => ({
        '@type': 'Answer',
        'position': letra.toUpperCase(),
        'text': texto,
        'isBasedOnRecognizedAuthority': true
      })),
      'acceptedAnswer': {
        '@type': 'Answer',
        'position': questao.alternativa_correta?.toUpperCase(),
        'text': questao.opcoes?.[questao.alternativa_correta] || '',
        'comment': {
          '@type': 'Comment',
          'text': questao.comentario_professor || 'Gabarito oficial.'
        }
      }
    }
  }

  return (
    <>
      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#f8fafc' }}>
        {/* Injeta o JSON-LD estruturado diretamente no cabeçalho da página para o Google ler */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Cabeçalho da Questão */}
        <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#6366f1', fontWeight: 'bold' }}>
          <span>📚 {questao.disciplina?.toUpperCase()}</span>
          {questao.assunto && <span style={{ color: '#94a3b8' }}> • {questao.assunto}</span>}
          {questao.banca && <span style={{ color: '#94a3b8' }}> • {questao.banca}</span>}
        </div>

        {/* Enunciado */}
        <h1 style={{ fontSize: '1.4rem', lineHeight: '1.6', fontWeight: '500', marginBottom: '30px' }}>
          {questao.enunciado}
        </h1>

        {/* Invoca o componente dinâmico do cliente passando os dados buscados no servidor */}
        <QuestaoInterativa questao={questao} />
      </main>

      {/* O componente Footer injetado logo após o término do conteúdo principal */}
      <Footer />
    </>
  )
}