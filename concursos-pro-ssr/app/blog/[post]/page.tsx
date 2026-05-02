'use client'

import { useEffect, useState, use } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface Post {
  titulo: string
  categoria: string
  conteudo: string
  capa_url: string
  created_at: string
  resumo: string
}

export default function PostPage({ params }: { params: Promise<{ post: string }> }) {
  const { post: slug } = use(params)
  const [artigo, setArtigo] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  const styles = {
    bg: '#0f172a',
    cardBg: '#1e293b',
    textMain: '#f8fafc',
    textSub: '#94a3b8',
    primary: '#3b82f6',
    border: 'rgba(255,255,255,0.1)',
  }

  useEffect(() => {
    async function carregarArtigo() {
      try {
        const { data, error } = await supabase
          .from('artigos')
          .select('*')
          .eq('slug', slug) // Busca pelo slug que veio da URL
          .single()

        if (error) throw error
        setArtigo(data)
      } catch (err) {
        console.error("Erro ao carregar post:", err)
      } finally {
        setLoading(false)
      }
    }
    carregarArtigo()
  }, [slug])

  if (loading) {
    return (
      <div style={{ backgroundColor: styles.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: styles.textMain }}>
        <p>Carregando conteúdo...</p>
      </div>
    )
  }

  if (!artigo) {
    return (
      <div style={{ backgroundColor: styles.bg, minHeight: '100vh', textAlign: 'center', padding: '50px', color: styles.textMain }}>
        <h1>Post não encontrado</h1>
        <Link href="/blog" style={{ color: styles.primary }}>Voltar para o Blog</Link>
      </div>
    )
  }

  return (
    <article style={{ backgroundColor: styles.bg, color: styles.textMain, minHeight: '100vh', paddingBottom: '50px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Botão Voltar */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <Link href="/blog" style={{ textDecoration: 'none', color: styles.textSub, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
          ← Voltar para Notícias
        </Link>

        {/* Capa */}
        <div style={{ width: '100%', height: '400px', borderRadius: '24px', overflow: 'hidden', marginBottom: '40px', border: `1px solid ${styles.border}` }}>
          <img 
            src={artigo.capa_url || 'https://via.placeholder.com/1200x600'} 
            alt={artigo.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Cabeçalho do Post */}
        <header style={{ marginBottom: '40px' }}>
          <span style={{ color: styles.primary, fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {artigo.categoria}
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '10px', marginBottom: '20px', lineHeight: '1.2' }}>
            {artigo.titulo}
          </h1>
          <div style={{ color: styles.textSub, fontSize: '0.9rem', borderTop: `1px solid ${styles.border}`, paddingTop: '20px' }}>
            Publicado em {new Date(artigo.created_at).toLocaleDateString('pt-BR')}
          </div>
        </header>

        {/* Conteúdo Renderizado */}
        <div 
          style={{ 
            fontSize: '1.15rem', 
            lineHeight: '1.8', 
            color: '#e2e8f0',
            whiteSpace: 'pre-wrap' // Mantém as quebras de linha do banco de dados
          }}
          dangerouslySetInnerHTML={{ __html: artigo.conteudo }} 
        />
      </div>
    </article>
  )
}