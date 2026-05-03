'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation' // Importado useRouter
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function BlogContent() {
  const searchParams = useSearchParams()
  const router = useRouter() // Instanciado o roteador
  const [artigosCache, setArtigosCache] = useState<any[]>([])
  const [artigosFiltrados, setArtigosFiltrados] = useState<any[]>([])
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos')
  const [carregando, setCarregando] = useState(true)

  const styles = {
    bg: '#0f172a',
    cardBg: '#1e293b',
    textMain: '#f8fafc',
    textSub: '#94a3b8',
    primary: '#3b82f6',
    border: 'rgba(255,255,255,0.1)',
  }

  // Carregamento inicial e sincronização com a URL
  useEffect(() => {
    async function carregarBlog() {
      try {
        const { data, error } = await supabase
          .from('artigos')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        const posts = data || []
        setArtigosCache(posts)

        const catUrl = searchParams.get('cat')
        executarFiltro(catUrl || 'todos', posts)
      } catch (err) {
        console.error(err)
      } finally {
        setCarregando(false)
      }
    }
    carregarBlog()
  }, [searchParams])

  // Lógica de filtro corrigida para comparação exata
  const executarFiltro = (cat: string, listaBase: any[]) => {
    setCategoriaAtiva(cat)
    if (cat === 'todos') {
      setArtigosFiltrados(listaBase)
    } else {
      const filtrados = listaBase.filter(a =>
        a.categoria?.trim().toLowerCase() === cat.toLowerCase()
      )
      setArtigosFiltrados(filtrados)
    }
  }

  return (
    <div style={{ backgroundColor: styles.bg, color: styles.textMain, minHeight: '100vh', padding: '20px 10px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Nav Home */}
        <nav style={{ marginBottom: '40px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '10px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: styles.textSub, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🏠 Início
          </Link>
        </nav>

        {/* Header Dinâmico baseado na categoria ativa */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: styles.primary, fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>
            {categoriaAtiva === 'todos' ? 'Notícias & Dicas' : `Categoria: ${categoriaAtiva}`}
          </h1>
          <p style={{ color: styles.textSub, fontSize: '1rem', fontWeight: '500' }}>Tudo o que você precisa para vencer nos concursos.</p>
        </header>

        {/* Filtros Estilo Pill com atualização de URL */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: '📚 Tudo' },
            { id: 'Notícias', label: '📰 Notícias' },
            { id: 'Dicas', label: '💡 Dicas' },
            { id: 'Dev', label: '💻 Dev' },
            { id: 'UEMA', label: '🏹 UEMA' },
            { id: 'ENEM', label: '🎓 ENEM' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                executarFiltro(cat.id, artigosCache);
                router.push(`/blog?cat=${cat.id}`, { scroll: false }); // Atualiza a URL sem scroll
              }}
              style={{
                background: categoriaAtiva === cat.id ? styles.primary : '#1e293b',
                border: 'none',
                color: 'white',
                padding: '10px 22px',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: '0.2s'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Artigos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {carregando ? (
            <p style={{ textAlign: 'center', color: styles.textSub }}>Carregando conteúdo...</p>
          ) : artigosFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: styles.textSub }}>Nenhum post encontrado para esta categoria.</p>
          ) : (
            artigosFiltrados.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`} 
                style={{ 
                  background: styles.cardBg, 
                  borderRadius: '20px', 
                  overflow: 'hidden', 
                  border: `1px solid ${styles.border}`, 
                  textDecoration: 'none', 
                  color: 'inherit',
                  display: 'block',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Imagem do Card */}
                <div style={{ width: '100%', height: '280px', position: 'relative' }}>
                  <img 
                    src={post.capa_url || 'https://via.placeholder.com/900x300'} 
                    alt={post.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Conteúdo do Card */}
                <div style={{ padding: '25px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: styles.primary, textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
                    {post.categoria}
                  </span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px', lineHeight: '1.3' }}>
                    {post.titulo}
                  </h2>
                  <p style={{ color: styles.textSub, fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {post.resumo}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function BlogPage() {
  return (
    <Suspense fallback={null}>
      <BlogContent />
    </Suspense>
  )
}