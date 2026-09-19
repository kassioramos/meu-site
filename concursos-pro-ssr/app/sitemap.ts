import { supabaseServer } from "@/lib/supabaseServer"
import { MetadataRoute } from "next"

export const revalidate = 3600 // Atualiza o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Domínio de Produção Oficial
  const URL_BASE = "https://concursosmaranhao.com.br" 

  // 1. Rotas Estáticas Principais e Institucionais
  const rotasEstaticas: MetadataRoute.Sitemap = [
    {
      url: URL_BASE,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1.0,
    },
    {
      url: `${URL_BASE}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${URL_BASE}/questoes`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${URL_BASE}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${URL_BASE}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${URL_BASE}/termos-de-uso`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  try {
    // 2. Buscar IDs dos Concursos para gerar as rotas dinâmicas de detalhes
    const { data: concursos } = await supabaseServer
      .from("concursos")
      .select("id, updated_at")

    const rotasConcursos: MetadataRoute.Sitemap = (concursos || []).map((c) => ({
      url: `${URL_BASE}/detalhes/${c.id}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    }))

    // 3. Buscar Slugs/IDs das Questões
    const { data: questoes } = await supabaseServer
      .from("questoes")
      .select("id, slug, updated_at")

    const rotasQuestoes: MetadataRoute.Sitemap = (questoes || []).map((q) => {
      const parametroRota = q.slug || q.id
      
      return {
        url: `${URL_BASE}/questoes/${parametroRota}`,
        lastModified: q.updated_at ? new Date(q.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      }
    })

    // 4. Buscar Slugs dos Artigos do Blog
    const { data: artigos } = await supabaseServer
      .from("artigos")
      .select("slug, updated_at")

    const rotasArtigos: MetadataRoute.Sitemap = (artigos || []).map((a) => ({
      url: `${URL_BASE}/blog/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }))

    // Retorna a união de todas as rotas mapeadas
    return [
      ...rotasEstaticas,
      ...rotasConcursos,
      ...rotasQuestoes,
      ...rotasArtigos,
    ]
  } catch (error) {
    console.error("Erro ao gerar sitemap dinâmico:", error)
    return rotasEstaticas
  }
}