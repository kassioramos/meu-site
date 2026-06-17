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

  // Estados para controle de Edição de Concurso
  const [idEditalEmEdicao, setIdEditalEmEdicao] = useState<any>(null)
  const [isEditando, setIsEditando] = useState(false)

  // 1. FORMULÁRIO DE QUESTÃO COMPLETAMENTE ESTRUTURADO (JSONB)
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

  // 2. FORMULÁRIO DE ARTIGO COMPLETAMENTE ESTRUTURADO
  const [artigo, setArtigo] = useState({
    titulo: '', 
    slug: '', 
    categoria: 'Notícias', 
    capa_url: '', 
    resumo: '', 
    conteudo: ''
  })

  // 3. FORMULÁRIO DE CONCURSO AJUSTADO COM AS COLUNAS REAIS DO POSTGRES
  const [concurso, setConcurso] = useState({
    orgao: '', 
    cidade: '', 
    banca: '', 
    status: 'Inscrições Abertas',
    periodo_inscricao: '', 
    valor_inscricao: '', 
    cargos: '',
    salarios: '',        
    escolaridade: '', 
    data_prova: '',
    sobre_concurso: '',  
    link_oficial: ''
  })

  // Flags para controlar o "A definir" sem dar erro de TypeScript
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
    rowCheck: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-10px', marginBottom: '15px', fontSize: '0.85rem', color: '#a3e635', cursor: 'pointer' }
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

  async function carregarDadosGerenciamento() {
    const { data: artigos, error: errArtigos } = await supabase
      .from('artigos')
      .select('id, titulo, categoria')
      .order('created_at', { ascending: false })
    if (errArtigos) console.error("Erro ao carregar artigos:", errArtigos.message)
    if (artigos) setListaArtigos(artigos)

    const { data: questoes, error: errQuestoes } = await supabase
      .from('questoes')
      .select('id, enunciado, banca, disciplina')
      .order('created_at', { ascending: false })
    if (errQuestoes) console.error("Erro ao carregar questões:", errQuestoes.message)
    if (questoes) setListaQuestoes(questoes)

    const { data: concursos, error: errConcursos } = await supabase
      .from('concursos')
      .select('*') // Buscando tudo para quando for alimentar a edição ter os dados completos
      .order('id', { ascending: false })

    if (errConcursos) {
      console.error("🚨 ERRO CRÍTICO AO BUSCAR CONCURSOS:", errConcursos.message)
      alert("Erro ao listar editais: " + errConcursos.message)
    } else {
      console.log("📂 Concursos carregados com sucesso:", concursos)
      setListaConcursos(concursos || [])
    }
  }

  // FUNÇÕES DE REMOÇÃO
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

  // PREPARAR FORMULÁRIO PARA EDIÇÃO
  function prepararEdicaoConcurso(item: any) {
    setIdEditalEmEdicao(item.id)
    setIsEditando(true)
    
    // Alimenta o formulário do edital com os dados antigos vindos do banco
    setConcurso({
      orgao: item.orgao || '',
      cidade: item.cidade || '',
      banca: item.banca === 'A definir' ? '' : item.banca || '',
      status: item.status || 'Inscrições Abertas',
      periodo_inscricao: item.periodo_inscricao === 'A definir' ? '' : item.periodo_inscricao || '',
      valor_inscricao: item.valor_inscricao === 'A definir' ? '' : item.valor_inscricao || '',
      cargos: item.cargos === 'A definir' ? '' : item.cargos || '',
      salarios: item.faixa_salarial === 'A definir' ? '' : item.faixa_salarial || '',
      escolaridade: item.escolaridade === 'A definir' ? '' : item.escolaridade || '',
      data_prova: item.data_prova === 'A definir' ? '' : item.data_prova || '',
      sobre_concurso: item.sobre_concurso || '',
      link_oficial: item.link_oficial || ''
    })

    // Seta os checkboxes com base no conteúdo atual do banco
    setADefinir({
      banca: item.banca === 'A definir',
      periodo_inscricao: item.periodo_inscricao === 'A definir',
      valor_inscricao: item.valor_inscricao === 'A definir',
      cargos: item.cargos === 'A definir',
      salarios: item.faixa_salarial === 'A definir',
      escolaridade: item.escolaridade === 'A definir',
      data_prova: item.data_prova === 'A definir'
    })

    // Redireciona o usuário visualmente para a aba do formulário
    setSecaoAtiva('concurso')
  }

  // CANCELAR MODO EDIÇÃO
  function cancelarEdicao() {
    setIsEditando(false)
    setIdEditalEmEdicao(null)
    setConcurso({
      orgao: '', cidade: '', banca: '', status: 'Inscrições Abertas', periodo_inscricao: '',
      valor_inscricao: '', cargos: '', salarios: '', escolaridade: '', data_prova: '', sobre_concurso: '', link_oficial: ''
    })
    setADefinir({ periodo_inscricao: false, valor_inscricao: false, cargos: false, salarios: false, banca: false, escolaridade: false, data_prova: false })
  }

  // ENVIO DOS FORMULÁRIOS
  async function salvarArtigo(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('artigos').insert([{ ...artigo, created_at: new Date().toISOString() }])
    if (error) alert("Erro: " + error.message)
    else {
      alert("✅ Artigo publicado com sucesso!")
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
    const { error } = await supabase.from('questoes').insert([dadosParaEnviar])
    if (error) alert("Erro ao salvar questão: " + error.message)
    else {
      alert("✅ Questão cadastrada com sucesso!")
      setQuestao({ enunciado: '', alternativa_a: '', alternativa_b: '', alternativa_c: '', alternativa_d: '', alternativa_e: '', alternativa_correta: 'A', banca: '', disciplina: '', slug: '' })
    }
  }

  async function salvarConcurso(e: React.FormEvent) {
    e.preventDefault()

    const dadosConcurso = {
      orgao: concurso.orgao,
      cidade: concurso.cidade,
      banca: concurso.banca || 'A definir',
      status: concurso.status,
      periodo_inscricao: concurso.periodo_inscricao || 'A definir',
      cargos: concurso.cargos || 'A definir',
      escolaridade: concurso.escolaridade || 'A definir',
      data_prova: concurso.data_prova || 'A definir',
      link_oficial: concurso.link_oficial,
      sobre_concurso: concurso.sobre_concurso,
      faixa_salarial: concurso.salarios || 'A definir', 
      valor_inscricao: concurso.valor_inscricao || 'A definir',
      salario_max: null,
      salario_min: null
    }

    if (isEditando) {
      // Executa o UPDATE caso esteja no modo edição
      const { error } = await supabase
        .from('concursos')
        .update(dadosConcurso)
        .eq('id', idEditalEmEdicao)

      if (error) {
        alert("Erro ao atualizar edital: " + error.message)
      } else {
        alert("✅ Edital atualizado com sucesso!")
        cancelarEdicao()
        setSecaoAtiva('gerenciar') // Devolve o usuário para a lista após editar
      }
    } else {
      // Executa o INSERT tradicional se for novo
      const { error } = await supabase.from('concursos').insert([dadosConcurso])
      if (error) alert("Erro ao salvar edital: " + error.message)
      else {
        alert("✅ Novo Edital cadastrado com sucesso!")
        setConcurso({
          orgao: '', cidade: '', banca: '', status: 'Inscrições Abertas', periodo_inscricao: '',
          valor_inscricao: '', cargos: '', salarios: '', escolaridade: '', data_prova: '', sobre_concurso: '', link_oficial: ''
        })
        setADefinir({ periodo_inscricao: false, valor_inscricao: false, cargos: false, salarios: false, banca: false, escolaridade: false, data_prova: false })
      }
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
        
        {/* NAVEGAÇÃO DE SEÇÕES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => { if(isEditando) cancelarEdicao(); setSecaoAtiva('artigo') }} style={{ background: secaoAtiva === 'artigo' ? '#3b82f6' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Novo Artigo</button>
            <button onClick={() => { if(isEditando) cancelarEdicao(); setSecaoAtiva('questao') }} style={{ background: secaoAtiva === 'questao' ? '#3b82f6' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>❓ Nova Questão</button>
            <button onClick={() => setSecaoAtiva('concurso')} style={{ background: secaoAtiva === 'concurso' ? '#10b981' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isEditando ? '✏️ Editando Edital' : '🏛️ Novo Edital'}
            </button>
            <button onClick={() => setSecaoAtiva('gerenciar')} style={{ background: secaoAtiva === 'gerenciar' ? '#ef4444' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Gerenciar / Excluir</button>
          </div>
          <button onClick={logout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Sair</button>
        </div>

        {/* SECÃO: NOVO ARTIGO COMPLETO */}
        {secaoAtiva === 'artigo' && (
          <form onSubmit={salvarArtigo}>
            <h1 style={{ marginBottom: '20px' }}>🚀 Novo Artigo</h1>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Título</label>
            <input type="text" value={artigo.titulo} style={styles.input} onChange={e => setArtigo({...artigo, titulo: e.target.value, slug: gerarSlug(e.target.value)})} required />
            
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

        {/* SEÇÃO: NOVA QUESTÃO COMPLETA */}
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
            <textarea style={{ ...styles.input, height: '120px', resize: 'vertical' }} value={questao.enunciado} onChange={e => setQuestao({...questao, enunciado: e.target.value, slug: gerarSlug(e.target.value.substring(0, 40))})} required />

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

        {/* SEÇÃO: FORMULÁRIO COMPARTILHADO (NOVO EDITAL / ATUALIZAR EDITAL) */}
        {secaoAtiva === 'concurso' && (
          <form onSubmit={salvarConcurso}>
            <h1 style={{ marginBottom: '20px', color: isEditando ? '#3b82f6' : 'white' }}>
              {isEditando ? `✏️ Atualizar Edital (ID: ${idEditalEmEdicao})` : '🏛️ Cadastrar Novo Edital'}
            </h1>
            
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
            <textarea style={{ ...styles.input, height: '120px' }} placeholder="Insira detalhes adicionais sobre as vagas do edital..." value={concurso.sobre_concurso} onChange={e => setConcurso({...concurso, sobre_concurso: e.target.value})} required />

            {/* BOTÕES DINÂMICOS DEPENDENDO DO MODO */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {isEditando && (
                <button type="button" onClick={cancelarEdicao} style={{ background: '#64748b', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
                  Cancelar Edição
                </button>
              )}
              <button type="submit" style={{ background: isEditando ? '#3b82f6' : styles.primary, color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 2 }}>
                {isEditando ? 'Salvar Alterações' : 'Publicar Edital'}
              </button>
            </div>
          </form>
        )}

        {/* SEÇÃO: GERENCIAR / EXCLUIR CONTEÚDOS */}
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => prepararEdicaoConcurso(c)} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Editar
                      </button>
                      <button onClick={() => excluirConcurso(c.id, c.orgao)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Apagar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ARTIGOS */}
            <h2 style={{ fontSize: '1.2rem', color: '#3b82f6', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>📄 Artigos Publicados</h2>
            {listaArtigos.length === 0 ? <p style={{ color: '#64748b', marginBottom: '30px' }}>Nenhum artigo encontrado.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
                {listaArtigos.map(art => (
                  <div key={art.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{art.titulo}</span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{art.categoria}</span>
                    </div>
                    <button onClick={() => excluirArtigo(art.id, art.titulo)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Apagar</button>
                  </div>
                ))}
              </div>
            )}

            {/* QUESTÕES */}
            <h2 style={{ fontSize: '1.2rem', color: '#e11d48', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>❓ Questões Cadastradas</h2>
            {listaQuestoes.length === 0 ? <p style={{ color: '#64748b' }}>Nenhuma questão encontrada.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {listaQuestoes.map(q => {
                  const textoEnunciado = q.enunciado || 'Questão sem enunciado cadastrado'
                  return (
                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${styles.border}` }}>
                      <div style={{ flex: 1, marginRight: '15px' }}>
                        <span style={{ fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '550px' }}>{textoEnunciado}</span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#334155', padding: '1px 6px', borderRadius: '4px' }}>{q.banca}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#334155', padding: '1px 6px', borderRadius: '4px' }}>{q.disciplina}</span>
                        </div>
                      </div>
                      <button onClick={() => excluirQuestao(q.id, textoEnunciado)} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Apagar</button>
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