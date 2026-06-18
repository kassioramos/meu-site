'use client'

import { useEffect, useState, use } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DetalhesPage() {
  // Tratando params de forma segura para Next.js 14/15
  const rawParams = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [respostaMarcada, setRespostaMarcada] = useState<string | null>(null)

  const id = rawParams?.id as string
  const tipo = searchParams.get('tipo') || 'concurso'

  useEffect(() => {
    // Validação extra se o ID vier como string literal "id" ou vazio
    if (!id || id === 'id') {
      setLoading(false)
      return
    }

    async function carregarConteudo() {
      setLoading(true)
      try {
        let query = null;
        
        if (tipo === 'concurso') {
          query = supabase.from('concursos')
            .select('*')
            .eq('id', Number(id)) // Se no banco for UUID, mude para id string
            .single()
        } else if (tipo === 'questao') {
          query = supabase.from('questoes')
            .select('*')
            .eq('id', id) 
            .single()
        } else if (tipo === 'artigo') {
          query = supabase.from('artigos')
            .select('*')
            .eq('id', id)
            .single()
        }

        // Evita quebra caso o tipo seja inválido e query fique nula
        if (!query) {
          setDados(null)
          return
        }

        const { data, error } = await query
        
        if (error || !data) throw error
        setDados(data)
      } catch (err) {
        console.error("Erro ao carregar do Supabase:", err)
        setDados(null)
      } finally {
        setLoading(false)
      }
    }

    carregarConteudo()
  }, [id, tipo])

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-bold">
      <div className="animate-pulse">Buscando informações...</div>
    </div>
  )
  
  if (!dados) return (
    <div className="min-h-screen bg-[#0f172a] p-10 text-white text-center flex flex-col items-center justify-center">
      <p className="text-6xl mb-6">❌</p>
      <h2 className="text-2xl font-bold">Ops! Conteúdo não encontrado.</h2>
      <p className="text-slate-400 mt-2">Não encontramos dados para o ID: <span className="text-yellow-400 font-mono">{id}</span></p>
      <button 
        onClick={() => router.push('/')} 
        className="mt-8 bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 hover:scale-105 transition-all shadow-lg"
      >
        Voltar ao Início
      </button>
    </div>
  )

  // RENDERIZAÇÃO ESTRUTURADA DE ARTIGOS
  const renderArtigo = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {dados.capa_url && (
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 border border-white/5 shadow-lg">
          <img 
            src={dados.capa_url} 
            alt={dados.titulo} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="mb-6">
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {dados.categoria || 'Geral'}
        </span>
        <h1 className="text-3xl md:text-5xl font-black mt-4 text-white leading-tight">
          {dados.titulo}
        </h1>
        {dados.created_at && (
          <p className="text-slate-400 text-sm mt-3 flex items-center gap-2">
            <span>📅 Publicado em: {new Date(dados.created_at).toLocaleDateString('pt-BR')}</span>
          </p>
        )}
      </div>

      {dados.resumo && (
        <div className="bg-slate-800/30 p-5 rounded-2xl border-l-4 border-blue-500 mb-8">
          <p className="text-slate-300 text-lg italic leading-relaxed">{dados.resumo}</p>
        </div>
      )}

      <hr className="border-white/5 my-8" />

      <div className="prose prose-invert max-w-none text-slate-300 text-lg leading-relaxed whitespace-pre-line match-brs">
        {dados.conteudo}
      </div>
    </div>
  )

  const renderConcurso = () => (
    <>
      <div className="mb-8">
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          {dados.status || 'Aberto'}
        </span>
        <h1 className="text-4xl font-extrabold mt-4 text-white leading-tight">{dados.orgao}</h1>
        <p className="text-slate-400 mt-2 flex items-center gap-2 text-lg">
          <span>📍 {dados.cidade}</span>
          <span className="text-slate-600">|</span>
          <span>🏢 Banca: {dados.banca}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
          <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Salário Estimado</p>
          <p className="text-2xl font-bold text-emerald-400">
            {dados.faixa_salarial ? dados.faixa_salarial : (dados.salario_max ? `R$ ${Number(dados.salario_max).toLocaleString('pt-BR')}` : 'Consultar Edital')}
          </p>
        </div>
        <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
          <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">Data da Prova</p>
          <p className="text-2xl font-bold text-slate-200">{dados.data_prova || 'A definir'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
          <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
          Descrição do Certame
        </h3>
        <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/5">
          <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg">
            {dados.sobre_concurso || `Informações completas sobre o concurso do órgão ${dados.orgao} no estado do Maranhão.`}
          </p>
        </div>
      </div>

      {dados.link_oficial && (
        <a 
          href={dados.link_oficial} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-12 block w-full bg-blue-600 text-white text-center py-5 rounded-2xl font-black text-lg hover:bg-blue-500 hover:-translate-y-1 transition-all shadow-[0_10px_20px_-10px_rgba(59,130,246,0.5)]"
        >
          ACESSAR PÁGINA DO EDITAL
        </a>
      )}
    </>
  )

  const renderQuestao = () => {
    // Tratamento ultra-seguro para o objeto/string de opções
    let opcoes: Record<string, string> = {}
    try {
      opcoes = typeof dados.opcoes === 'string' ? JSON.parse(dados.opcoes) : (dados.opcoes || {})
    } catch (e) {
      console.error("Erro ao tratar opções da questão", e)
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <span className="bg-violet-500/20 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Banca: {dados.banca}
          </span>
          <h1 className="text-3xl font-extrabold mt-4 text-blue-400">{dados.disciplina}</h1>
        </div>

        <div className="bg-slate-800/40 p-8 rounded-2xl border-l-8 border-blue-500 mb-10 shadow-inner">
          <p className="text-slate-100 text-xl leading-relaxed italic">"{dados.enunciado}"</p>
        </div>

        <div className="grid gap-4">
          {Object.entries(opcoes).map(([letra, texto]: [string, any]) => {
            const isCorreta = letra === dados.alternativa_correta
            const isSelecionada = letra === respostaMarcada
            
            let stateClasses = 'bg-slate-800/60 border-white/5 hover:border-blue-500/50 hover:bg-slate-700/60'
            
            if (respostaMarcada) {
              if (isCorreta) stateClasses = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              else if (isSelecionada) stateClasses = 'bg-red-500/20 border-red-500 text-red-400'
              else stateClasses = 'opacity-50 border-white/5'
            }

            return (
              <button
                key={letra}
                disabled={!!respostaMarcada}
                onClick={() => setRespostaMarcada(letra)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 flex items-start gap-4 group ${stateClasses}`}
              >
                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black ${isSelecionada ? 'bg-current text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                  {letra.toUpperCase()}
                </span>
                <span className="text-lg font-medium pt-0.5">{texto}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderConteudoDinamico = () => {
    switch (tipo) {
      case 'concurso':
        return renderConcurso()
      case 'questao':
        return renderQuestao()
      case 'artigo':
        return renderArtigo()
      default:
        return renderConcurso()
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-white selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="group text-slate-400 mb-8 hover:text-blue-400 flex items-center gap-2 font-bold transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          Voltar para a lista
        </button>
        
        <article className="bg-[#1e293b]/50 backdrop-blur-sm rounded-3xl p-6 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            {renderConteudoDinamico()}
          </div>
        </article>
      </div>
    </main>
  )
}