import { supabaseServer } from "@/lib/supabaseServer"
import { MetadataRoute } from "next"

export const revalidate = 3600 // Atualiza o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const URL_BASE = "https://meu-site-five-delta.vercel.app"; 

  // 1. Rotas Estáticas Principais
  const rotasEstaticas = [
    { url: URL_BASE, lastModified: new Date() },
    { url: `${URL_BASE}/blog`, lastModified: new Date() },
    { url: `${URL_BASE}/questoes`, lastModified: new Date() },
  ]

  try {
    // 2. Buscar IDs dos Concursos para gerar as rotas dinâmicas de detalhes
    const { data: concursos } = await supabaseServer
      .from("concursos")
      .select("id")

    const rotasConcursos = (concursos || []).map((c) => ({
      url: `${URL_BASE}/detalhes/${c.id}?tipo=concurso`,
      lastModified: new Date(),
    }))

    // 3. Buscar Slugs/IDs das Questões (AJUSTADO PARA O ROBÔ NÃO SE PERDER)
    const { data: questoes } = await supabaseServer
      .from("questoes")
      .select("id, slug") // 👈 Buscando o slug também

    const rotasQuestoes = (questoes || []).map((q) => {
      // 🎯 Se a questão tiver slug, usa o slug. Se não tiver, usa o id.
      const parametroRota = q.slug || q.id
      
      return {
        url: `${URL_BASE}/questoes/${parametroRota}`,
        lastModified: new Date(),
      }
    })

    // 4. Buscar Slugs dos Artigos do Blog
    const { data: artigos } = await supabaseServer
      .from("artigos")
      .select("slug")

    const rotasArtigos = (artigos || []).map((a) => ({
      url: `${URL_BASE}/blog/${a.slug}`,
      lastModified: new Date(),
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