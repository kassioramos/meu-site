'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(URL_SB, KEY_SB)

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [secaoAtiva, setSecaoAtiva] = useState('artigo') // 'artigo', 'questao' ou 'gerenciar'
  
  // Estados para listagens de exclusão
  const [listaArtigos, setListaArtigos] = useState<any[]>([])
  const [listaQuestoes, setListaQuestoes] = useState<any[]>([])

  // Estados para Login
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  // Estado da Questão
  const [questao, setQuestao] = useState({
    enunciado: '',
    alternativa_a: '',
    alternativa_b: '',
    alternativa_c: '',
    alternativa_d: '',
    alternativa_e: '',
    alternativa_correta: 'A',
    banca: '',
    disciplina: '', 
    slug: ''
  })

  // Estados para Artigo
  const [artigo, setArtigo] = useState({
    titulo: '', slug: '', categoria: 'Notícias', capa_url: '', resumo: '', conteudo: ''
  })

  const styles = {
    bg: '#0f172a',
    card: '#1e293b',
    primary: '#10b981',
    text: '#f8fafc',
    border: 'rgba(255,255,255,0.1)',
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: 'white', marginBottom: '15px' }
  }

  useEffect(() => {
    checkUser()
  }, [])

  // Dispara a busca de dados quando o usuário entra na aba de gerenciamento
  useEffect(() => {
    if (user && secaoAtiva === 'gerenciar') {
      carregarDadosGerenciamento()
    }
  }, [secaoAtiva, user])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) alert("Erro: " + error.message)
    else checkUser()
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // BUSCA ARTIGOS E QUESTÕES PARA GERENCIAR
  async function carregarDadosGerenciamento() {
    // Busca artigos
    const { data: artigos, error: errArt } = await supabase
      .from('artigos')
      .select('id, titulo, categoria')
      .order('created_at', { ascending: false })
    
    if (!errArt && artigos) setListaArtigos(artigos)

    // Busca questões - Alterado para trazer os campos gerais cadastrados no banco
    const { data: questoes, error: errQue } = await supabase
      .from('questoes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (errQue) {
      console.error("Erro ao buscar questões:", errQue.message)
    } else if (questoes) {
      setListaQuestoes(questoes)
    }
  }

  // FUNÇÕES DE EXCLUSÃO
  async function excluirArtigo(id: string, titulo: string) {
    if (!confirm(`Tem certeza que deseja apagar o artigo "${titulo}"?`)) return

    const { error } = await supabase.from('artigos').delete().eq('id', id)
    if (error) {
      alert("Erro ao excluir artigo: " + error.message)
    } else {
      alert("🗑️ Artigo removido com sucesso!")
      setListaArtigos(listaArtigos.filter(a => a.id !== id))
    }
  }

  async function excluirQuestao(id: string, enunciadoCompleto: string) {
    const textoValidado = enunciadoCompleto || 'Questão sem enunciado'
    const resumoEnunciado = textoValidado.substring(0, 30) + '...'
    if (!confirm(`Tem certeza que deseja apagar a questão: "${resumoEnunciado}"?`)) return

    const { error } = await supabase.from('questoes').delete().eq('id', id)
    if (error) {
      alert("Erro ao excluir questão: " + error.message)
    } else {
      alert("🗑️ Questão removida com sucesso!")
      setListaQuestoes(listaQuestoes.filter(q => q.id !== id))
    }
  }

  // Gerador de Slug Automático para Artigos e Questões
  const gerarSlug = (texto: string) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
  }

  const atualizarTituloArtigo = (val: string) => {
    setArtigo({ ...artigo, titulo: val, slug: gerarSlug(val) })
  }

  const atualizarEnunciadoQuestao = (val: string) => {
    const trechoEnunciado = val.substring(0, 40)
    setQuestao({ ...questao, enunciado: val, slug: gerarSlug(trechoEnunciado) })
  }

  async function salvarArtigo(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('artigos').insert([{ ...artigo, created_at: new Date().toISOString() }])
    if (error) alert("Erro: " + error.message)
    else {
      alert("✅ Artigo publicado!")
      setArtigo({ titulo: '', slug: '', categoria: 'Notícias', capa_url: '', resumo: '', conteudo: '' })
    }
  }

  async function salvarQuestao(e: React.FormEvent) {
    e.preventDefault()

    const dadosParaEnviar = {
      banca: questao.banca,
      disciplina: questao.disciplina,
      enunciado: questao.enunciado,
      alternativa_correta: questao.alternativa_correta,
      alternativa_e: questao.alternativa_e || null, 
      slug: questao.slug || null,
      opcoes: {
        a: questao.alternativa_a,
        b: questao.alternativa_b,
        c: questao.alternativa_c,
        d: questao.alternativa_d,
        ...(questao.alternativa_e ? { e: questao.alternativa_e } : {}) 
      }
    }

    const { error } = await supabase
      .from('questoes')
      .insert([dadosParaEnviar])
        
    if (error) {
      alert("Erro ao salvar questão: " + error.message)
    } else {
      alert("✅ Questão cadastrada com sucesso!")
      setQuestao({ 
        enunciado: '', alternativa_a: '', alternativa_b: '', alternativa_c: '', 
        alternativa_d: '', alternativa_e: '', alternativa_correta: 'A', 
        banca: '', disciplina: '', slug: '' 
      })
    }
  }

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Carregando...</div>

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: styles.bg }}>
        <section style={{ maxWidth: '400px', width: '90%', background: styles.card, padding: '30px', borderRadius: '12px', border: `1px solid ${styles.border}`, textAlign: 'center' }}>
          <form onSubmit={handleLogin}>
            <h2 style={{ marginBottom: '10px', color: 'white' }}>🔒 Painel do Mestre</h2>
            <p style={{ color: '#94a3b8', marginBottom: '25px' }}>Kassio, entre para gerenciar o conteúdo</p>
            <input type="email" placeholder="Seu e-mail" required style={styles.input} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Sua senha" required style={styles.input} onChange={e => setSenha(e.target.value)} />
            <button type="submit" style={{ background: styles.primary, color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Acessar Sistema</button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div style={{ background: styles.bg, color: styles.text, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: styles.card, padding: '30px', borderRadius: '12px', border: `1px solid ${styles.border}` }}>
        
        {/* ABAS DO PAINEL SUPERIOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setSecaoAtiva('artigo')} style={{ background: secaoAtiva === 'artigo' ? '#3b82f6' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Novo Artigo</button>
            <button onClick={() => setSecaoAtiva('questao')} style={{ background: secaoAtiva === 'questao' ? '#3b82f6' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>❓ Nova Questão</button>
            <button onClick={() => setSecaoAtiva('gerenciar')} style={{ background: secaoAtiva === 'gerenciar' ? '#ef4444' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Gerenciar / Excluir</button>
          </div>
          <button onClick={logout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Sair</button>
        </div>

        {/* ABA: FORMULÁRIO DE ARTIGO */}
        {secaoAtiva === 'artigo' && (
          <form onSubmit={salvarArtigo}>
            <h1 style={{ marginBottom: '20px' }}>🚀 Novo Artigo</h1>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Título</label>
            <input type="text" value={artigo.titulo} style={styles.input} onChange={e => atualizarTituloArtigo(e.target.value)} required />
            
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Slug (URL)</label>
            <input type="text" value={artigo.slug} style={{ ...styles.input, opacity: 0.6 }} readOnly />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Categoria</label>
                <select style={styles.input} value={artigo.categoria} onChange={e => setArtigo({...artigo, categoria: e.target.value})}>
                  <option value="Notícias">Notícias</option>
                  <option value="Concursos">Concursos</option>
                  <option value="Dicas de Estudo">Dicas de Estudo</option>
                  <option value="Desenvolvimento">Desenvolvimento</option>
                  <option value="UEMA">UEMA</option>
                  <option value="ENEM">ENEM</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>URL da Capa</label>
                <input type="text" value={artigo.capa_url} style={styles.input} onChange={e => setArtigo({...artigo, capa_url: e.target.value})} required />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Resumo</label>
            <input type="text" value={artigo.resumo} style={styles.input} onChange={e => setArtigo({...artigo, resumo: e.target.value})} maxLength={200} required />

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Conteúdo (HTML/Markdown)</label>
            <textarea style={{ ...styles.input, height: '200px', resize: 'vertical' }} value={artigo.conteudo} onChange={e => setArtigo({...artigo, conteudo: e.target.value})} required />

            <button type="submit" style={{ background: styles.primary, color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Publicar Artigo</button>
          </form>
        )}

        {/* ABA: FORMULÁRIO DE QUESTÃO */}
        {secaoAtiva === 'questao' && (
          <form onSubmit={salvarQuestao}>
            <h1 style={{ marginBottom: '20px' }}>❓ Cadastrar Nova Questão</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Banca</label>
                <input type="text" placeholder="Ex: Cebraspe, FGV" value={questao.banca} style={styles.input} onChange={e => setQuestao({...questao, banca: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Disciplina / Assunto</label>
                <input type="text" placeholder="Ex: Português, Direito" value={questao.disciplina} style={styles.input} onChange={e => setQuestao({...questao, disciplina: e.target.value})} required />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Enunciado da Questão</label>
            <textarea style={{ ...styles.input, height: '120px', resize: 'vertical' }} value={questao.enunciado} onChange={e => atualizarEnunciadoQuestao(e.target.value)} required />

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Alternativa A</label>
            <input type="text" value={questao.alternativa_a} style={styles.input} onChange={e => setQuestao({...questao, alternativa_a: e.target.value})} required />

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Alternativa B</label>
            <input type="text" value={questao.alternativa_b} style={styles.input} onChange={e => setQuestao({...questao, alternativa_b: e.target.value})} required />

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Alternativa C</label>
            <input type="text" value={questao.alternativa_c} style={styles.input} onChange={e => setQuestao({...questao, alternativa_c: e.target.value})} required />

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Alternativa D</label>
            <input type="text" value={questao.alternativa_d} style={styles.input} onChange={e => setQuestao({...questao, alternativa_d: e.target.value})} required />

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Alternativa E (Opcional)</label>
            <input type="text" value={questao.alternativa_e} style={styles.input} onChange={e => setQuestao({...questao, alternativa_e: e.target.value})} />

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Alternativa Correta</label>
            <select style={styles.input} value={questao.alternativa_correta} onChange={e => setQuestao({...questao, alternativa_correta: e.target.value})}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>

            <button type="submit" style={{ background: styles.primary, color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Salvar Questão no Banco</button>
          </form>
        )}

        {/* ABA: RELAÇÃO DE EXCLUSÃO */}
        {secaoAtiva === 'gerenciar' && (
          <div>
            <h1 style={{ marginBottom: '25px' }}>🗑️ Gerenciar Conteúdos Existentes</h1>

            {/* LISTAGEM DE ARTIGOS */}
            <h2 style={{ fontSize: '1.2rem', color: '#3b82f6', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>📄 Artigos Publicados</h2>
            {listaArtigos.length === 0 ? (
              <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '0.9rem' }}>Nenhum artigo encontrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
                {listaArtigos.map(art => (
                  <div key={art.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block', fontSize: '0.95rem' }}>{art.titulo}</span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{art.categoria}</span>
                    </div>
                    <button onClick={() => excluirArtigo(art.id, art.titulo)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Apagar</button>
                  </div>
                ))}
              </div>
            )}

            {/* LISTAGEM DE QUESTÕES CORRIGIDA */}
            <h2 style={{ fontSize: '1.2rem', color: '#10b981', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>❓ Questões Cadastradas</h2>
            {listaQuestoes.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nenhuma questão encontrada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {listaQuestoes.map(q => {
                  // Fallback inteligente para extrair o enunciado independente de onde esteja salvo na row
                  const textoEnunciado = q.enunciado || (q.opcoes && typeof q.opcoes === 'object' ? q.opcoes.enunciado : '') || 'Questão sem enunciado cadastrado'
                  
                  return (
                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                      <div style={{ flex: 1, marginRight: '15px' }}>
                        <span style={{ fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '550px' }}>
                          {textoEnunciado}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#334155', padding: '1px 6px', borderRadius: '4px' }}>{q.banca || 'Sem Banca'}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#334155', padding: '1px 6px', borderRadius: '4px' }}>{q.disciplina || 'Sem Disciplina'}</span>
                        </div>
                      </div>
                      <button onClick={() => excluirQuestao(q.id, textoEnunciado)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Apagar</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}