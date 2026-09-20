import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tipo?: string }>
}

// 1. Função utilitária para tratar o campo `sobre_concurso` (evita o [object Object] e vírgulas soltas)
function renderTextoFormatado(conteudo: any) {
  if (!conteudo) return null

  // Se for uma string simples
  if (typeof conteudo === 'string') {
    return <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg">{conteudo}</p>
  }

  // Se for um Array (comum em retornos JSON do Supabase/scrapers)
  if (Array.isArray(conteudo)) {
    return (
      <div className="space-y-4">
        {conteudo.map((item, index) => {
          if (typeof item === 'string') {
            return (
              <p key={index} className="text-slate-300 leading-relaxed text-lg">
                {item}
              </p>
            )
          }
          if (typeof item === 'object' && item !== null) {
            const texto =
              item.texto ||
              item.paragrafo ||
              item.content ||
              item.descricao ||
              Object.values(item).filter(val => typeof val === 'string').join(' ')

            return (
              <p key={index} className="text-slate-300 leading-relaxed text-lg">
                {texto}
              </p>
            )
          }
          return null
        })}
      </div>
    )
  }

  // Se for um Objeto isolado
  if (typeof conteudo === 'object' && conteudo !== null) {
    const texto =
      conteudo.texto ||
      conteudo.descricao ||
      Object.values(conteudo).filter(val => typeof val === 'string').join(' ')

    return <p className="text-slate-300 leading-relaxed text-lg">{texto}</p>
  }

  return null
}

// 2. Geração Dinâmica de Metadados (SEO para SERP)
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
        title = `Concurso ${data.orgao} (${data.cidade || 'MA'}): Edital, Vagas e Salários`
        description = `Informações atualizadas sobre o concurso do(a) ${data.orgao}. Banca: ${data.banca || 'A definir'}. Confira salários e detalhes do edital.`
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
      title,
      description,
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

  // 3. Fetch de dados no servidor
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

  // 4. Schema.org com limpeza da string do JobPosting
  const renderSchema = () => {
    if (tipo === 'concurso') {
      const descricaoLimpa =
        typeof dados.sobre_concurso === 'string'
          ? dados.sobre_concurso
          : Array.isArray(dados.sobre_concurso)
          ? dados.sobre_concurso
              .map((i: any) =>
                typeof i === 'string'
                  ? i
                  : typeof i === 'object' && i !== null
                  ? i.texto || i.paragrafo || i.content || Object.values(i).join(' ')
                  : ''
              )
              .filter(Boolean)
              .join(' ')
          : `Edital de concurso para ${dados.orgao} em ${dados.cidade || 'Maranhão'}.`

      return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        'title': `Concurso ${dados.orgao}`,
        'description': descricaoLimpa,
        'datePosted': dados.created_at || new Date().toISOString(),
        'validThrough': dados.data_inscricao_fim || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        'hiringOrganization': {
          '@type': 'Organization',
          'name': dados.orgao,
        },
        'jobLocation': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': dados.cidade || 'Maranhão',
            'addressRegion': 'MA',
            'addressCountry': 'BR',
          },
        },
        ...(dados.salario_max && {
          'baseSalary': {
            '@type': 'MonetaryAmount',
            'currency': 'BRL',
            'value': {
              '@type': 'QuantitativeValue',
              'value': Number(dados.salario_max),
              'unitText': 'MONTH',
            },
          },
        }),
      }
    }

    if (tipo === 'artigo') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': dados.titulo,
        'description': dados.resumo,
        'image': dados.capa_url ? [dados.capa_url] : [],
        'datePublished': dados.created_at,
        'author': {
          '@type': 'Organization',
          'name': 'Concursos Maranhão Pro',
        },
      }
    }

    return null
  }

  const jsonLd = renderSchema()

  return (
    <main className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-white selection:bg-blue-500/30">
      {jsonLd && (
        <Script
          id="schema-detalhes"
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
                    <p className="text-2xl font-bold text-emerald-400">
                      {dados.faixa_salarial
                        ? dados.faixa_salarial
                        : dados.salario_max
                        ? `R$ ${Number(dados.salario_max).toLocaleString('pt-BR')}`
                        : 'Aguardando atualizações'}
                    </p>
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

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                    <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                    Descrição do Certame
                  </h2>
                  <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
                    {/* Renderização do texto tratado sem gerar [object Object] */}
                    {renderTextoFormatado(dados.sobre_concurso) || (
                      <p className="text-slate-300 leading-relaxed text-lg">
                        Informações completas sobre o concurso do órgão {dados.orgao} no estado do Maranhão.
                      </p>
                    )}
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
                <div className="text-slate-300 text-lg leading-relaxed whitespace-pre-line">
                  {dados.conteudo}
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