'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(URL_SB, KEY_SB)

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [secaoAtiva, setSecaoAtiva] = useState('artigo') // 'artigo', 'questao', 'concurso' ou 'gerenciar'
  
  // Estados para listagens de exclusão
  const [listaArtigos, setListaArtigos] = useState<any[]>([])
  const [listaQuestoes, setListaQuestoes] = useState<any[]>([])
  const [listaConcursos, setListaConcursos] = useState<any[]>([])

  // Estados para Login
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  // Estado da Questão
  const [questao, setQuestao] = useState({
    enunciado: '', alternativa_a: '', alternativa_b: '', alternativa_c: '',
    alternativa_d: '', alternativa_e: '', alternativa_correta: 'A',
    banca: '', disciplina: '', slug: ''
  })

  // Estados para Artigo
  const [artigo, setArtigo] = useState({
    titulo: '', slug: '', categoria: 'Notícias', capa_url: '', resumo: '', conteudo: ''
  })

  // Estado para Concurso/Edital
  const [concurso, setConcurso] = useState({
    orgao: '', cidade: '', banca: '', status: 'Aberto',
    periodo_inscricao: '', valor_inscricao: '', cargos: '',
    salarios: '', escolaridade: '', data_prova: '',
    descricao: '', link_oficial: ''
  })

  // Flags para controlar o "A definir"
  const [aDefinir, setADefinir] = useState({
    periodo_inscricao: false,
    valor_inscricao: false,
    cargos: false,
    salarios: false,
    banca: false,
    escolaridade: false,
    data_prova: false
  })

  const styles = {
    bg: '#0f172a',
    card: '#1e293b',
    primary: '#10b981',
    text: '#f8fafc',
    border: 'rgba(255,255,255,0.1)',
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: 'white', marginBottom: '15px' },
    rowCheck: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-10px', marginBottom: '15px', fontSize: '0.85rem', color: '#a3e635' }
  }

  useEffect(() => {
    checkUser()
  }, [])

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

  // BUSCA DADOS DO BANCO
  async function carregarDadosGerenciamento() {
    // Busca artigos
    const { data: artigos } = await supabase.from('artigos').select('id, titulo, categoria').order('created_at', { ascending: false })
    if (artigos) setListaArtigos(artigos)

    // Busca questões
    const { data: questoes } = await supabase.from('questoes').select('id, enunciado, banca, disciplina').order('created_at', { ascending: false })
    if (questoes) setListaQuestoes(questoes)

    // Busca editais/concursos
    const { data: concursos } = await supabase.from('concursos').select('id, orgao, cidade, status').order('created_at', { ascending: false })
    if (concursos) setListaConcursos(concursos)
  }

  // FUNÇÕES DE EXCLUSÃO
  async function excluirArtigo(id: string, titulo: string) {
    if (!confirm(`Tem certeza que deseja apagar o artigo "${titulo}"?`)) return
    const { error } = await supabase.from('artigos').delete().eq('id', id)
    if (!error) setListaArtigos(listaArtigos.filter(a => a.id !== id))
  }

  async function excluirQuestao(id: string, enunciado: string) {
    if (!confirm(`Tem certeza que deseja apagar a questão selecionada?`)) return
    const { error } = await supabase.from('questoes').delete().eq('id', id)
    if (!error) setListaQuestoes(listaQuestoes.filter(q => q.id !== id))
  }

  async function excluirConcurso(id: any, orgao: string) {
    if (!confirm(`Tem certeza que deseja apagar o edital do órgão: "${orgao}"?`)) return
    const { error } = await supabase.from('concursos').delete().eq('id', id)
    if (error) alert("Erro ao excluir: " + error.message)
    else setListaConcursos(listaConcursos.filter(c => c.id !== id))
  }

  const gerarSlug = (texto: string) => {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-')
  }

const toggleADefinir = (campo: string) => {
    setADefinir(prev => {
      // Usamos 'as keyof typeof prev' para garantir ao TypeScript que a string é uma chave válida do objeto
      const chaveValida = campo as keyof typeof prev;
      const novoEstado = { ...prev, [chaveValida]: !prev[chaveValida] };
      
      if (novoEstado[chaveValida]) {
        setConcurso(c => ({ ...c, [campo]: 'A definir' }));
      } else {
        setConcurso(c => ({ ...c, [campo]: '' }));
      }
      return novoEstado;
    });
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
      banca: questao.banca, disciplina: questao.disciplina, enunciado: questao.enunciado,
      alternativa_correta: questao.alternativa_correta, alternativa_e: questao.alternativa_e || null, slug: questao.slug || null,
      opcoes: { a: questao.alternativa_a, b: questao.alternativa_b, c: questao.alternativa_c, d: questao.alternativa_d, ...(questao.alternativa_e ? { e: questao.alternativa_e } : {}) }
    }
    const { error } = await supabase.from('questoes').insert([dadosParaEnviar])
    if (error) alert("Erro: " + error.message)
    else {
      alert("✅ Questão cadastrada!")
      setQuestao({ enunciado: '', alternativa_a: '', alternativa_b: '', alternativa_c: '', alternativa_d: '', alternativa_e: '', alternativa_correta: 'A', banca: '', disciplina: '', slug: '' })
    }
  }

  async function salvarConcurso(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('concursos').insert([concurso])
    if (error) alert("Erro ao salvar edital: " + error.message)
    else {
      alert("✅ Novo Edital cadastrado com sucesso!")
      setConcurso({
        orgao: '', cidade: '', banca: '', status: 'Aberto', periodo_inscricao: '',
        valor_inscricao: '', cargos: '', salarios: '', escolaridade: '', data_prova: '', descricao: '', link_oficial: ''
      })
      setADefinir({ periodo_inscricao: false, valor_inscricao: false, cargos: false, salarios: false, banca: false, escolaridade: false, data_prova: false })
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
            <button onClick={() => setSecaoAtiva('concurso')} style={{ background: secaoAtiva === 'concurso' ? '#10b981' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏛️ Novo Edital</button>
            <button onClick={() => setSecaoAtiva('gerenciar')} style={{ background: secaoAtiva === 'gerenciar' ? '#ef4444' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Gerenciar / Excluir</button>
          </div>
          <button onClick={logout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Sair</button>
        </div>

        {/* ABA: FORMULÁRIO DE ARTIGO */}
        {secaoAtiva === 'artigo' && (
          <form onSubmit={salvarArtigo}>
            <h1 style={{ marginBottom: '20px' }}>🚀 Novo Artigo</h1>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Título</label>
            <input type="text" value={artigo.titulo} style={styles.input} onChange={e => setArtigo({...artigo, titulo: e.target.value, slug: gerarSlug(e.target.value)})} required />
            <button type="submit" style={{ background: styles.primary, color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Publicar Artigo</button>
          </form>
        )}

        {/* ABA: FORMULÁRIO DE QUESTÃO */}
        {secaoAtiva === 'questao' && (
          <form onSubmit={salvarQuestao}>
            <h1 style={{ marginBottom: '20px' }}>❓ Cadastrar Nova Questão</h1>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Banca</label>
            <input type="text" value={questao.banca} style={styles.input} onChange={e => setQuestao({...questao, banca: e.target.value})} required />
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Enunciado</label>
            <textarea style={{ ...styles.input, height: '100px' }} value={questao.enunciado} onChange={e => setQuestao({...questao, enunciado: e.target.value, slug: gerarSlug(e.target.value.substring(0,40))})} required />
            <button type="submit" style={{ background: styles.primary, color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Salvar Questão</button>
          </form>
        )}

        {/* ABA: FORMULÁRIO DE EDITAL / CONCURSO */}
        {secaoAtiva === 'concurso' && (
          <form onSubmit={salvarConcurso}>
            <h1 style={{ marginBottom: '20px' }}>🏛️ Cadastrar Novo Edital</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Órgão Institucional</label>
                <input type="text" placeholder="Ex: UEMA, Prefeitura de São Luís" value={concurso.orgao} style={styles.input} onChange={e => setConcurso({...concurso, orgao: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Cidade / Região</label>
                <input type="text" placeholder="Ex: São Luís - MA, Estadual" value={concurso.cidade} style={styles.input} onChange={e => setConcurso({...concurso, cidade: e.target.value})} required />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Banca Organizadora</label>
            <input type="text" placeholder="Ex: FGV, Cebraspe" value={concurso.banca} style={styles.input} onChange={e => setConcurso({...concurso, banca: e.target.value})} disabled={aDefinir.banca} required={!aDefinir.banca} />
            <label style={styles.rowCheck}>
              <input type="checkbox" checked={aDefinir.banca} onChange={() => toggleADefinir('banca')} /> Banca a definir
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Período de Inscrição</label>
                <input type="text" placeholder="Ex: 10/10 a 12/11" value={concurso.periodo_inscricao} style={styles.input} onChange={e => setConcurso({...concurso, periodo_inscricao: e.target.value})} disabled={aDefinir.periodo_inscricao} required={!aDefinir.periodo_inscricao} />
                <label style={styles.rowCheck}>
                  <input type="checkbox" checked={aDefinir.periodo_inscricao} onChange={() => toggleADefinir('periodo_inscricao')} /> Período a definir
                </label>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Taxa / Valor da Inscrição</label>
                <input type="text" placeholder="Ex: R$ 85,00" value={concurso.valor_inscricao} style={styles.input} onChange={e => setConcurso({...concurso, valor_inscricao: e.target.value})} disabled={aDefinir.valor_inscricao} required={!aDefinir.valor_inscricao} />
                <label style={styles.rowCheck}>
                  <input type="checkbox" checked={aDefinir.valor_inscricao} onChange={() => toggleADefinir('valor_inscricao')} /> Valor a definir
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Cargos Ofertados</label>
                <input type="text" placeholder="Ex: Assistente, Técnico, Professor" value={concurso.cargos} style={styles.input} onChange={e => setConcurso({...concurso, cargos: e.target.value})} disabled={aDefinir.cargos} required={!aDefinir.cargos} />
                <label style={styles.rowCheck}>
                  <input type="checkbox" checked={aDefinir.cargos} onChange={() => toggleADefinir('cargos')} /> Cargos a definir
                </label>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Remuneração / Salários</label>
                <input type="text" placeholder="Ex: Até R$ 5.400,00" value={concurso.salarios} style={styles.input} onChange={e => setConcurso({...concurso, salarios: e.target.value})} disabled={aDefinir.salarios} required={!aDefinir.salarios} />
                <label style={styles.rowCheck}>
                  <input type="checkbox" checked={aDefinir.salarios} onChange={() => toggleADefinir('salarios')} /> Salários a definir
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Escolaridade Exigida</label>
                <input type="text" placeholder="Ex: Médio e Superior" value={concurso.escolaridade} style={styles.input} onChange={e => setConcurso({...concurso, escolaridade: e.target.value})} disabled={aDefinir.escolaridade} required={!aDefinir.escolaridade} />
                <label style={styles.rowCheck}>
                  <input type="checkbox" checked={aDefinir.escolaridade} onChange={() => toggleADefinir('escolaridade')} /> Escolaridade a definir
                </label>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Data Prevista da Prova</label>
                <input type="text" placeholder="Ex: 24/11/2026" value={concurso.data_prova} style={styles.input} onChange={e => setConcurso({...concurso, data_prova: e.target.value})} disabled={aDefinir.data_prova} required={!aDefinir.data_prova} />
                <label style={styles.rowCheck}>
                  <input type="checkbox" checked={aDefinir.data_prova} onChange={() => toggleADefinir('data_prova')} /> Data a definir
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Status do Certame</label>
                <select style={styles.input} value={concurso.status} onChange={e => setConcurso({...concurso, status: e.target.value})}>
                  <option value="Inscrições Abertas">Inscrições Abertas</option>
                  <option value="Previsto / Anunciado">Previsto / Anunciado</option>
                  <option value="Edital Publicado">Edital Publicado</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Link Oficial do Edital</label>
                <input type="url" placeholder="https://..." value={concurso.link_oficial} style={styles.input} onChange={e => setConcurso({...concurso, link_oficial: e.target.value})} required />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Resumo / Descrição Completa</label>
            <textarea style={{ ...styles.input, height: '120px' }} placeholder="Insira detalhes adicionais sobre as vagas do edital..." value={concurso.descricao} onChange={e => setConcurso({...concurso, descricao: e.target.value})} required />

            <button type="submit" style={{ background: styles.primary, color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>Publicar Edital</button>
          </form>
        )}

        {/* ABA: RELAÇÃO DE EXCLUSÃO */}
        {secaoAtiva === 'gerenciar' && (
          <div>
            <h1 style={{ marginBottom: '25px' }}>🗑️ Gerenciar Conteúdos Existentes</h1>

            {/* EDITAIS */}
            <h2 style={{ fontSize: '1.2rem', color: '#10b981', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>🏛️ Editais / Concursos Ativos</h2>
            {listaConcursos.length === 0 ? <p style={{ color: '#64748b', marginBottom: '20px' }}>Nenhum concurso encontrado.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                {listaConcursos.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{c.orgao}</span>
                      <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>📍 {c.cidade} | {c.status}</span>
                    </div>
                    <button onClick={() => excluirConcurso(c.id, c.orgao)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Apagar</button>
                  </div>
                ))}
              </div>
            )}

            {/* ARTIGOS */}
            <h2 style={{ fontSize: '1.2rem', color: '#3b82f6', marginBottom: '15px' }}>📄 Artigos</h2>
            {/* ... o map do seu listaArtigos original pode continuar idêntico aqui ... */}
            
            {/* QUESTÕES */}
            <h2 style={{ fontSize: '1.2rem', color: '#e11d48', marginBottom: '15px' }}>❓ Questões</h2>
            {/* ... o map do seu listaQuestoes original pode continuar idêntico aqui ... */}
          </div>
        )}
      </div>
    </div>
  )
}