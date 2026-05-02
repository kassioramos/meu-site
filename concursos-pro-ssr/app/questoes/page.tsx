'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function QuestoesPage() {
  const [questoes, setQuestoes] = useState<any[]>([])
  const [filtradas, setFiltradas] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState('todos')

  const styles = {
    bg: '#0f172a',
    cardBg: 'rgba(255,255,255,0.05)',
    primary: '#3b82f6',
    red: '#ef4444',
    amber: '#fbbf24',
    textMain: '#e2e8f0',
    textSub: '#94a3b8',
    border: 'rgba(255,255,255,0.1)'
  }

  useEffect(() => {
    async function baixarQuestoes() {
      setCarregando(true)
      const { data, error } = await supabase
        .from('questoes')
        .select('*')
      
      if (error) {
        console.error("Erro ao carregar questões:", error.message)
      } else if (data) {
        setQuestoes(data)
        setFiltradas(data)
      }
      setCarregando(false)
    }
    baixarQuestoes()
  }, [])

  const filtrar = (termo: string) => {
    setFiltroAtivo(termo)
    if (termo === 'todos') {
      setFiltradas(questoes)
    } else {
      const termoLow = termo.toLowerCase()
      const novaLista = questoes.filter(q => 
        (q.disciplina?.toLowerCase().includes(termoLow)) || 
        (q.banca?.toLowerCase().includes(termoLow)) ||
        (q.enunciado?.toLowerCase().includes(termoLow))
      )
      setFiltradas(novaLista)
    }
  }

  return (
    <div style={{ backgroundColor: styles.bg, minHeight: '100vh', color: 'white', paddingBottom: '50px' }}>
      <header style={{ padding: '40px 20px', textAlign: 'center', background: '#1e293b' }}>
        <Link href="/" style={{ color: styles.textSub, textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Voltar ao Início
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '15px' }}>Banco de Questões</h1>
        <p style={{ color: styles.textSub }}>Simulados, Redações e Análises de Obras</p>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* Filtros */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifySelf: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <button 
            onClick={() => filtrar('todos')}
            style={btnStyle(filtroAtivo === 'todos', styles.primary)}
          >Tudo</button>
          
          <button onClick={() => filtrar('ENEM')} style={btnStyle(filtroAtivo === 'ENEM', styles.primary)}>🎓 ENEM</button>
          <button onClick={() => filtrar('UEMA')} style={btnStyle(filtroAtivo === 'UEMA', styles.primary)}>🏹 UEMA</button>

          <select 
            onChange={(e) => filtrar(e.target.value)}
            style={{ ...btnStyle(false, styles.primary), background: styles.bg, color: 'white' }}
          >
            <option value="todos">Concursos por banca</option>
            <option value="FGV">FGV</option>
            <option value="Instituto JK">Instituto JK</option>
            <option value="FCC">FCC</option>
          </select>

          <button onClick={() => filtrar('Redação')} style={btnStyle(filtroAtivo === 'Redação', styles.red)}>✍️ Redação</button>
          <button onClick={() => filtrar('Obras UEMA')} style={btnStyle(filtroAtivo === 'Obras UEMA', styles.amber)}>📚 Obras UEMA</button>
        </div>

        {/* Lista de Questões */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {carregando ? (
            <p style={{ textAlign: 'center' }}>Carregando banco de dados...</p>
          ) : filtradas.length === 0 ? (
            <p style={{ textAlign: 'center' }}>Nenhuma questão encontrada.</p>
          ) : (
            filtradas.map(q => (
              <div key={q.id} style={{ background: styles.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${styles.border}` }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <span style={tagStyle('#8b5cf6')}>{q.disciplina || 'Geral'}</span>
                  <span style={tagStyle('#10b981')}>{q.banca || 'Simulado'}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', color: styles.textMain, lineHeight: '1.5', marginBottom: '15px' }}>
                  {q.enunciado ? q.enunciado.substring(0, 160) + '...' : 'Questão sem enunciado'}
                </h3>
                <p style={{ color: styles.textSub, fontSize: '0.85rem' }}>
                  Banca: {q.banca} | Matéria: {q.disciplina}
                </p>
                <Link 
                  href={`/questoes/${q.id}`} 
                  style={{ display: 'inline-block', marginTop: '15px', color: styles.primary, fontWeight: '700', textDecoration: 'none' }}
                >
                  RESPONDER QUESTÃO →
                </Link>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

const btnStyle = (active: boolean, color: string) => ({
  padding: '10px 20px',
  borderRadius: '8px',
  border: `1px solid ${color}`,
  background: active ? color : 'transparent',
  color: active ? (color === '#fbbf24' ? 'black' : 'white') : 'white',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600' as const
})

const tagStyle = (bg: string) => ({
  fontSize: '0.7rem',
  padding: '4px 10px',
  borderRadius: '6px',
  background: bg,
  color: 'white',
  fontWeight: 'bold' as const,
  textTransform: 'uppercase' as const
})