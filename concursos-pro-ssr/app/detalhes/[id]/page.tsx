'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const URL_SB = 'https://mczmhvuxujvhrudqmpvg.supabase.co'
const KEY_SB = 'sb_publishable_VTkTKTGqA7QtDR3cnENUwQ_mGDWVkle'
const supabase = createClient(URL_SB, KEY_SB)

export default function DetalhesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [respostaMarcada, setRespostaMarcada] = useState<string | null>(null)

  const id = params.id 
  const tipo = searchParams.get('tipo') || 'concurso'

  useEffect(() => {
    // Evita busca se o ID for inválido ou for apenas o texto "id"
    if (!id || id === 'id') {
      setLoading(false)
      return
    }

    async function carregarConteudo() {
      setLoading(true)
      try {
        let query;
        
        if (tipo === 'concurso') {
          // Conforme image_94fbbd.png, a tabela 'concursos' usa id int4 (número)
          query = supabase.from('concursos')
            .select('*')
            .eq('id', Number(id)) // Converte para número
            .single()
        } else if (tipo === 'questao') {
          // Conforme image_94fede.png, a tabela 'questoes' usa id uuid (string)
          query = supabase.from('questoes')
            .select('*')
            .eq('id', id) // Mantém como string/uuid
            .single()
        }

        const { data, error } = await query!
        
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
      Buscando informações do certame...
    </div>
  )
  
  if (!dados) return (
    <div className="min-h-screen bg-[#0f172a] p-10 text-white text-center">
      <p className="text-4xl mb-4">❌</p>
      <h2 className="text-xl font-bold">Ops! Conteúdo não encontrado.</h2>
      <p className="text-slate-400 mt-2">Não encontramos dados para o ID: <span className="text-yellow-400">{id}</span></p>
      <button 
        onClick={() => router.push('/')} 
        className="mt-6 bg-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-500 transition-all"
      >
        Voltar ao Início
      </button>
    </div>
  )

  // RENDERIZAÇÃO PARA CONCURSOS
  const renderConcurso = () => (
    <>
      <div className="mb-6">
        <span className="bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold uppercase">
          {dados.status || 'Aberto'}
        </span>
        <h1 className="text-3xl font-bold mt-4 text-blue-400">{dados.orgao}</h1>
        <p className="text-slate-400 mt-1">📍 {dados.cidade} | 🏢 Banca: {dados.banca}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-black/20 p-5 rounded-lg border border-white/5">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Salário Estimado</p>
          <p className="text-xl font-bold text-emerald-400">
            {dados.salario_max ? `R$ ${Number(dados.salario_max).toLocaleString('pt-BR')}` : 'Ver Edital'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Data da Prova</p>
          <p className="text-xl font-bold text-slate-200">{dados.data_prova || 'A definir'}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold border-b border-white/10 pb-2 mb-4 text-blue-400 text-left">📋 Descrição do Certame</h3>
        <p className="text-slate-300 leading-relaxed text-left">
          {dados.descricao || `Informações completas sobre o concurso do órgão ${dados.orgao} no Maranhão.`}
        </p>
      </div>

      <a 
        href={dados.link_oficial} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-10 block w-full bg-blue-600 text-center py-4 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg"
      >
        ACESSAR PÁGINA DO EDITAL
      </a>
    </>
  )

  // RENDERIZAÇÃO PARA QUESTÕES
  const renderQuestao = () => {
    const opcoes = typeof dados.opcoes === 'string' ? JSON.parse(dados.opcoes) : dados.opcoes
    return (
      <div className="text-left">
        <div className="mb-6">
          <span className="bg-violet-600 text-white px-3 py-1 rounded text-xs font-bold uppercase">{dados.banca}</span>
          <h1 className="text-2xl font-bold mt-4 text-blue-400">{dados.disciplina}</h1>
        </div>

        <div className="bg-black/20 p-6 rounded-xl border-l-4 border-blue-500 mb-8">
          <p className="text-slate-200 leading-relaxed">{dados.enunciado}</p>
        </div>

        <div className="space-y-3">
          {Object.entries(opcoes).map(([letra, texto]: any) => {
            const isCorreta = letra === dados.alternativa_correta
            const isSelecionada = letra === respostaMarcada
            let bgColor = 'bg-slate-700 hover:bg-slate-600'
            
            if (respostaMarcada) {
              if (isCorreta) bgColor = 'bg-emerald-600 border-2 border-emerald-400'
              else if (isSelecionada) bgColor = 'bg-red-600 border-2 border-red-400'
            }

            return (
              <button
                key={letra}
                disabled={!!respostaMarcada}
                onClick={() => setRespostaMarcada(letra)}
                className={`w-full text-left p-4 rounded-lg transition-all ${bgColor} text-white font-medium`}
              >
                <span className="font-bold mr-2">{letra.toUpperCase()})</span> {texto}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-5 text-white">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="text-blue-400 mb-6 hover:underline flex items-center gap-2 font-semibold"
        >
          ← Voltar para a lista
        </button>
        
        <div className="bg-[#1e293b] rounded-xl p-8 border-t-4 border-blue-500 shadow-2xl">
          {tipo === 'concurso' ? renderConcurso() : renderQuestao()}
        </div>
      </div>
    </main>
  )
}