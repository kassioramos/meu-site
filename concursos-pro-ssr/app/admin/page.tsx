'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Next.js puxa automaticamente do seu arquivo .env.local de forma segura
const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(URL_SB, KEY_SB)

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [secaoAtiva, setSecaoAtiva] = useState('artigo')
  
  // Estados para Login
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

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

  // Gerador de Slug Automático
  const atualizarTitulo = (val: string) => {
    const limpo = val.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    const slug = limpo.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-')
    setArtigo({ ...artigo, titulo: val, slug })
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setSecaoAtiva('artigo')} style={{ background: secaoAtiva === 'artigo' ? '#3b82f6' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Artigo</button>
            <button onClick={() => setSecaoAtiva('questao')} style={{ background: secaoAtiva === 'questao' ? '#3b82f6' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>❓ Questão</button>
            <button onClick={() => setSecaoAtiva('excluir')} style={{ background: secaoAtiva === 'excluir' ? '#ef4444' : '#334155', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Excluir</button>
          </div>
          <button onClick={logout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Sair</button>
        </div>

        {secaoAtiva === 'artigo' && (
          <form onSubmit={salvarArtigo}>
            <h1 style={{ marginBottom: '20px' }}>🚀 Novo Artigo</h1>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Título</label>
            <input type="text" value={artigo.titulo} style={styles.input} onChange={e => atualizarTitulo(e.target.value)} required />
            
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Slug (URL)</label>
            <input type="text" value={artigo.slug} style={{ ...styles.input, opacity: 0.6 }} readOnly />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Categoria</label>
                <select style={styles.input} value={artigo.categoria} onChange={e => setArtigo({...artigo, categoria: e.target.value})}>
                  <option value="Notícias">Notícias</option>
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

        {secaoAtiva === 'questao' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
             <h2 style={{ color: '#94a3b8' }}>Formulário de questões pronto para implementar...</h2>
             {/* Você pode seguir a mesma lógica do formulário acima para as questões */}
          </div>
        )}

      </div>
    </div>
  )
}