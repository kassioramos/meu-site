import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

interface Props {
  params: Promise<{ slug: string }>
}

// Helper para tratar e limpar o conteúdo do sobre_concurso
function renderTextoFormatado(conteudo: any) {
  if (!conteudo) return null

  // Expressão regular aprimorada para remover [object Object] e vírgulas residuais
  const limparString = (str: string) =>
    str
      .replace(/,?\s*\[object Object\]\s*,?/g, '')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .trim()

  if (typeof conteudo === 'string') {
    const texto = limparString(conteudo)
    return texto ? (
      <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg">{texto}</p>
    ) : null
  }

  if (Array.isArray(conteudo)) {
    return (
      <div className="space-y-4">
        {conteudo.map((item, index) => {
          if (typeof item === 'string') {
            const texto = limparString(item)
            return texto ? (
              <p key={index} className="text-slate-300 leading-relaxed text-lg">
                {texto}
              </p>
            ) : null
          }
          if (typeof item === 'object' && item !== null) {
            const textoExtraido =
              item.texto ||
              item.paragrafo ||
              item.content ||
              Object.values(item)
                .filter(v => typeof v === 'string')
                .join(' ')
            const texto = limparString(textoExtraido)
            return texto ? (
              <p key={index} className="text-slate-300 leading-relaxed text-lg">
                {texto}
              </p>
            ) : null
          }
          return null
        })}
      </div>
    )
  }

  if (typeof conteudo === 'object' && conteudo !== null) {
    const textoExtraido =
      conteudo.texto ||
      conteudo.descricao ||
      Object.values(conteudo)
        .filter(v => typeof v === 'string')
        .join(' ')
    const texto = limparString(textoExtraido)
    return texto ? <p className="text-slate-300 leading-relaxed text-lg">{texto}</p> : null
  }

  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const SITE_URL = 'https://concursosmaranhao.com.br'

  const isNumeric = /^\d+$/.test(slug)
  const query = isNumeric
    ? supabaseServer.from('concursos').select('orgao, cidade, banca').eq('id', slug).single()
    : supabaseServer.from('concursos').select('orgao, cidade, banca').eq('slug', slug).single()

  const { data } = await query

  if (!data) {
    return { title: 'Concurso não encontrado | Concursos Maranhão' }
  }

  const title = `Concurso ${data.orgao} (${data.cidade || 'MA'}): Edital, Vagas e Salários`
  const description = `Informações atualizadas sobre o concurso do(a) ${data.orgao}. Banca: ${data.banca || 'A definir'}.`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/concursos/${slug}` },
    openGraph: { title, description, url: `${SITE_URL}/concursos/${slug}`, type: 'article' },
  }
}

export default async function ConcursoSlugPage({ params }: Props) {
  const { slug } = await params

  const isNumeric = /^\d+$/.test(slug)
  const query = isNumeric
    ? supabaseServer.from('concursos').select('*').eq('id', slug).single()
    : supabaseServer.from('concursos').select('*').eq('slug', slug).single()

  const { data: dados } = await query

  if (!dados) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-slate-400 mb-8 inline-flex items-center gap-2 font-bold hover:text-blue-400">
          ← Voltar para a lista
        </Link>

        <article className="bg-[#1e293b]/50 rounded-3xl p-6 md:p-12 border border-white/5 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">{dados.orgao}</h1>
          <p className="text-slate-400 mt-2">📍 {dados.cidade || 'Maranhão'} | 🏢 Banca: {dados.banca || 'A definir'}</p>

          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-blue-400">Descrição do Certame</h2>
            <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
              {renderTextoFormatado(dados.sobre_concurso) || (
                <p className="text-slate-300">Informações sobre o concurso do órgão {dados.orgao}.</p>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}