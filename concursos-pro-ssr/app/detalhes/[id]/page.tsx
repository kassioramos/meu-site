import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { supabaseServer } from '@/lib/supabaseServer'

// Força a renderização dinâmica no Next.js para evitar requisições com 'socket hang up' no build
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tipo?: string }>
}

// 1. Função ultra-robusta para tratar e converter qualquer formato de dados em uma única string Markdown/texto
function extrairTextoMarkdown(conteudo: any): string {
  if (!conteudo) return ''

  if (typeof conteudo === 'string') {
    return conteudo.trim()
  }

  const extrairTextoDeObjeto = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return ''
    if (typeof obj.texto === 'string') return obj.texto
    if (typeof obj.paragrafo === 'string') return obj.paragrafo
    if (typeof obj.content === 'string') return obj.content
    if (typeof obj.descricao === 'string') return obj.descricao

    if (Array.isArray(obj.children)) {
      return obj.children.map((child: any) => extrairTextoDeObjeto(child)).join(' ')
    }

    return Object.values(obj)
      .filter((val) => typeof val === 'string' || typeof val === 'number')
      .join('\n\n')
  }

  if (Array.isArray(conteudo)) {
    return conteudo
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (typeof item === 'object' && item !== null) {
          return extrairTextoDeObjeto(item).trim()
        }
        return ''
      })
      .filter(Boolean)
      .join('\n\n')
  }

  if (typeof conteudo === 'object' && conteudo !== null) {
    return extrairTextoDeObjeto(conteudo).trim()
  }

  return ''
}

function renderTextoFormatado(conteudo: any) {
  const textoMarkdown = extrairTextoMarkdown(conteudo)

  if (!textoMarkdown) return null

  return (
    <div className="prose prose-invert prose-blue max-w-none">
      <ReactMarkdown>{textoMarkdown}</ReactMarkdown>
    </div>
  )
}

// 2. Metadados Dinâmicos (SEO Otimizado)
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const id = resolvedParams.id
  const tipo = resolvedSearchParams.tipo || 'concurso'

  const SITE_URL = 'https://concursosmaranhao.com.br'

  try {
    let title = 'Detalhes | Concursos Maranhão Pro'
    let description = 'Confira os detalhes completos sobre os concursos e seleções no estado do Maranhão.'

    if (tipo === 'concurso') {
      const { data } = await supabaseServer
        .from('concursos')
        .select('orgao, cidade, banca, salario_max')
        .eq('id', id)
        .single()

      if (data) {
        const cidadeFormatada = data.cidade ? `- ${data.cidade}` : 'MA'
        title = `Concurso ${data.orgao}${cidadeFormatada}: Edital e Vagas`
        description = `Confira edital, banca ${data.banca || 'a definir'} e inscrições para o concurso da ${data.orgao}.`
      }
    } else if (tipo === 'artigo') {
      const { data } = await supabaseServer.from('artigos').select('titulo, resumo').eq('id', id).single()
      if (data) {
        title = `${data.titulo} | Blog Concursos Maranhão`
        description = data.resumo || description
      }
    } else if (tipo === 'questao') {
      const { data } = await supabaseServer.from('questoes').select('disciplina, banca, enunciado').eq('id', id).single()
      if (data) {
        title = `Questão de ${data.disciplina} (${data.banca}) | Banco de Questões`
        description = data.enunciado ? `${data.enunciado.substring(0, 150)}...` : description
      }
    }

    return {
      title: title.slice(0, 60),
      description: description.slice(0, 160),
      alternates: {
        canonical: `${SITE_URL}/detalhes/${id}?tipo=${tipo}`,
      },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/detalhes/${id}?tipo=${tipo}`,
        type: 'article',
      },
    }
  } catch {
    return {
      title: 'Conteúdo | Concursos Maranhão Pro',
    }
  }
}

export default async function DetalhesPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const id = resolvedParams.id
  const tipo = resolvedSearchParams.tipo || 'concurso'

  if (!id || id === 'id') {
    notFound()
  }

  let dados: any = null
  try {
    let query = null
    if (tipo === 'concurso') {
      query = supabaseServer.from('concursos').select('*').eq('id', id).single()
    } else if (tipo === 'questao') {
      query = supabaseServer.from('questoes').select('*').eq('id', id).single()
    } else if (tipo === 'artigo') {
      query = supabaseServer.from('artigos').select('*').eq('id', id).single()
    }

    if (query) {
      const { data } = await query
      dados = data
    }
  } catch (err) {
    console.error('Erro ao carregar dados no servidor:', err)
  }

  if (!dados) {
    return (
      <main className="min-h-screen bg-[#0f172a] p-10 text-white text-center flex flex-col items-center justify-center">
        <p className="text-6xl mb-6">❌</p>
        <h1 className="text-2xl font-bold">Ops! Conteúdo não encontrado.</h1>
        <p className="text-slate-400 mt-2">Não encontramos dados para o identificador fornecido.</p>
        <Link
          href="/"
          className="mt-8 bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all"
        >
          Voltar ao Início
        </Link>
      </main>
    )
  }

  // Tratamento dos dados de salário para apresentação e Schema
  const valorSalario = Number(dados.salario_max || dados.salario) || 0
  const salarioTexto = dados.faixa_salarial
    ? dados.faixa_salarial
    : valorSalario > 0
    ? `Até R$ ${valorSalario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'Aguardando atualizações'

  // Schema.org estruturado em JSON-LD
  const renderSchema = () => {
    if (tipo === 'concurso') {
      const textoMarkdown = extrairTextoMarkdown(dados.sobre_concurso || dados.descricao)
      const descricaoLimpa =
        textoMarkdown.length > 10
          ? textoMarkdown.substring(0, 250).replace(/[#*`_]/g, '')
          : `Confira informações completas, edital e vagas sobre o concurso para ${dados.orgao || 'Prefeitura'} no estado do Maranhão.`

      let dataPublicacao = new Date().toISOString()
      if (dados.created_at || dados.data_publicacao || dados.createdat) {
        const parsedDate = new Date(dados.created_at || dados.data_publicacao || dados.createdat)
        if (!isNaN(parsedDate.getTime())) {
          dataPublicacao = parsedDate.toISOString()
        }
      }

      let dataValidade = undefined
      if (dados.data_inscricao_fim || dados.data_fim) {
        const parsedFim = new Date(dados.data_inscricao_fim || dados.data_fim)
        if (!isNaN(parsedFim.getTime())) {
          dataValidade = parsedFim.toISOString()
        }
      }

      return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: `Concurso ${dados.orgao || 'Público'}`,
        description: descricaoLimpa,
        datePosted: dataPublicacao,
        validThrough: dataValidade,
        employmentType: 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: dados.orgao || 'Prefeitura Municipal',
          sameAs: dados.link_oficial || undefined,
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: dados.cidade || 'Maranhão',
            addressRegion: 'MA',
            addressCountry: 'BR',
          },
        },
        ...(valorSalario > 0 && {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'BRL',
            value: {
              '@type': 'QuantitativeValue',
              value: valorSalario,
              unitText: 'MONTH',
            },
          },
        }),
      }
    }

    if (tipo === 'artigo') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: dados.titulo,
        description: dados.resumo || dados.titulo,
        image: dados.capa_url ? [dados.capa_url] : [],
        datePublished: dados.created_at || new Date().toISOString(),
        author: {
          '@type': 'Organization',
          name: 'Concursos Maranhão Pro',
        },
      }
    }

    return null
  }

  const jsonLd = renderSchema()

  return (
    <main className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-white selection:bg-blue-500/30">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="group text-slate-400 mb-8 hover:text-blue-400 inline-flex items-center gap-2 font-bold transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Voltar para a lista
        </Link>

        <article className="bg-[#1e293b]/50 backdrop-blur-sm rounded-3xl p-6 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <div className="relative z-10">
            {tipo === 'concurso' && (
              <>
                <div className="mb-8">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {dados.status || 'Edital Publicado'}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-extrabold mt-4 text-white leading-tight">
                    {dados.orgao}
                  </h1>
                  <p className="text-slate-400 mt-2 flex items-center gap-2 text-lg">
                    <span>📍 {dados.cidade || 'Maranhão'}</span>
                    <span className="text-slate-600">|</span>
                    <span>🏢 Banca: {dados.banca || 'A definir'}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">
                      Salário Estimado
                    </p>
                    <p className="text-2xl font-bold text-emerald-400">{salarioTexto}</p>
                  </div>
                  <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">
                      Data da Prova
                    </p>
                    <p className="text-2xl font-bold text-slate-200">
                      {dados.data_prova || 'A definir'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                    <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                    Descrição do Certame
                  </h2>
                  <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
                    {renderTextoFormatado(dados.sobre_concurso || dados.descricao) || (
                      <p className="text-slate-300 leading-relaxed text-lg">
                        O Concurso Público da {dados.orgao} oferece oportunidades para diversos níveis no estado do Maranhão.
                      </p>
                    )}
                  </div>

                  {/* Tabela de Resumo para enriquecimento de SEO */}
                  <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5 mt-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-200">Resumo da Oportunidade</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-300">
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-3 font-semibold text-slate-400">Órgão:</td>
                            <td className="py-3">{dados.orgao}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3 font-semibold text-slate-400">Banca Organizadora:</td>
                            <td className="py-3">{dados.banca || 'A definir'}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3 font-semibold text-slate-400">Localidade:</td>
                            <td className="py-3">{dados.cidade || 'Maranhão'} - MA</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-semibold text-slate-400">Remuneração:</td>
                            <td className="py-3 text-emerald-400 font-bold">{salarioTexto}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {dados.link_oficial && (
                  <a
                    href={dados.link_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-12 block w-full bg-blue-600 text-white text-center py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-lg"
                  >
                    Acessar Página Oficial do Edital
                  </a>
                )}
              </>
            )}

            {tipo === 'artigo' && (
              <div>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {dados.categoria || 'Geral'}
                </span>
                <h1 className="text-3xl md:text-5xl font-black mt-4 text-white leading-tight">
                  {dados.titulo}
                </h1>
                {dados.created_at && (
                  <p className="text-slate-400 text-sm mt-3">
                    📅 Publicado em: {new Date(dados.created_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {dados.resumo && (
                  <div className="bg-slate-800/30 p-5 rounded-2xl border-l-4 border-blue-500 my-8">
                    <p className="text-slate-300 text-lg italic leading-relaxed">{dados.resumo}</p>
                  </div>
                )}
                <div className="mt-8">
                  {renderTextoFormatado(dados.conteudo)}
                </div>
              </div>
            )}

            {tipo === 'questao' && (
              <div>
                <span className="bg-violet-500/20 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Banca: {dados.banca || 'Geral'}
                </span>
                <h1 className="text-3xl font-extrabold mt-4 text-blue-400">{dados.disciplina}</h1>
                <div className="bg-slate-800/40 p-8 rounded-2xl border-l-8 border-blue-500 my-8">
                  <p className="text-slate-100 text-xl leading-relaxed italic">"{dados.enunciado}"</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  )
}