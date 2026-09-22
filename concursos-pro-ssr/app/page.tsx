import Link from "next/link"
import Script from "next/script"
import { supabaseServer } from "@/lib/supabaseServer"

export const revalidate = 60

export const metadata = {
  title: "Concursos Maranhão: Editais Abertos, Vagas e Salários",
  description: "Lista atualizada de concursos públicos e seletivos abertos no Maranhão. Confidential salários, bancas organizadoras e detalhes dos editais.",
  keywords: [
    "concursos maranhão",
    "editais abertos maranhão",
    "concurso público ma",
    "seletivo maranhão",
    "vagas concurso maranhão"
  ],
  alternates: {
    canonical: "https://concursosmaranhao.com.br",
  }
}

export default async function Home() {
  // 1. Busca os dados no servidor
  const { data: concursos, error } = await supabaseServer
    .from('concursos')
    .select('id, orgao, cidade, banca, salario_max') 

  if (error) {
    console.error("Erro ao carregar concursos:", error)
    return (
      <div className="text-center p-10 text-red-400">
        Erro ao carregar concursos 😢
      </div>
    )
  }

  const lista = (concursos || []).map(c => ({
    ...c,
    salario: !isNaN(Number(c.salario_max)) ? Number(c.salario_max) : 0
  }))

  // Lógica de estatísticas
  const salarios = lista
    .map(c => c.salario)
    .filter(s => s > 0)
  const mediaSalarial = salarios.length ? salarios.reduce((a, b) => a + b, 0) / salarios.length : 0
  const maiorSalario = salarios.length ? Math.max(...salarios) : 0

  const formatarMoeda = (valor: number) => 
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Schema.org ItemList para SEO de agregador de oportunidades
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Concursos Públicos Abertos no Maranhão",
    "numberOfItems": lista.length,
    "itemListElement": lista.map((c, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "JobPosting",
        "title": c.orgao,
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": c.cidade || "Maranhão",
            "addressRegion": "MA",
            "addressCountry": "BR"
          }
        },
        "hiringOrganization": {
          "@type": "Organization",
          "name": c.orgao
        },
        ...(c.salario > 0 && {
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "BRL",
            "value": {
              "@type": "QuantitativeValue",
              "value": c.salario,
              "unitText": "MONTH"
            }
          }
        })
      }
    }))
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-white font-sans">
      
      {/* Schema.org estruturado em JSON-LD */}
      <Script
        id="schema-itemlist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />

      <header className="py-16 px-5 text-center bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
        <h1 className="text-4xl font-bold mb-2">Concursos Maranhão</h1>
        <p className="text-slate-400">{lista.length} editais disponíveis no estado</p>
        
        {/* Links Rápidos */}
        <nav aria-label="Navegação rápida" className="flex gap-4 justify-center mt-6">
          <Link href="/blog" className="bg-blue-500/10 text-blue-400 border border-blue-500 px-5 py-2 rounded-full text-sm hover:bg-blue-500 hover:text-white transition">
            📄 Blog
          </Link>
          <Link href="/questoes" className="bg-purple-500/10 text-purple-400 border border-purple-500 px-5 py-2 rounded-full text-sm hover:bg-purple-500 hover:text-white transition">
            📝 Questões
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto p-5">
        
        {/* Cards de Estatísticas com tags semânticas corrigidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
            <span className="text-xs text-slate-400 block mb-2 uppercase tracking-wider">💰 Média Salarial</span>
            <p className="text-2xl font-bold text-white">{formatarMoeda(mediaSalarial)}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
            <span className="text-xs text-slate-400 block mb-2 uppercase tracking-wider">🏢 Maior Salário</span>
            <p className="text-2xl font-bold text-white">{formatarMoeda(maiorSalario)}</p>
          </div>
        </div>

        {/* Heading H2 Semântico para agrupamento */}
        <h2 className="text-2xl font-bold mb-6 text-slate-200">
          Concursos e Seletivos Abertos
        </h2>

        {/* Grid de Concursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lista.length === 0 && (
            <div className="col-span-full text-center text-slate-400 mt-10">
              Nenhum concurso encontrado no momento.
            </div>
          )}
          
          {lista.map((c) => {
            return (
              <article key={c.id} className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col hover:border-blue-500/50 transition">
                
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold">
                    {(c.cidade || "MA").toUpperCase()}
                  </span>
                </div>

                <h3 className="text-blue-400 font-bold text-lg mb-4 leading-tight min-h-[3.5rem]">
                  {c.orgao}
                </h3>
                
                <div className="text-sm text-slate-300 space-y-2 flex-grow">
                  <p>📍 {c.cidade || "Maranhão"}</p>
                  <p>🏢 {c.banca || "A definir"}</p>
                  <p className="text-white font-bold mt-4 text-base">
                    💰 {c.salario > 0 ? `Até ${formatarMoeda(c.salario)}` : "Salário não informado"}
                  </p>
                </div>

                <Link
                  href={`/detalhes/${c.id}?tipo=concurso`}
                  aria-label={`Ver detalhes do concurso ${c.orgao}`}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm text-center hover:bg-blue-700 transition"
                >
                  Ver Detalhes do Concurso
                </Link>

              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}