import Link from "next/link"
import { supabaseServer } from "@/lib/supabaseServer"

import BuscaConcursos from "@/components/BuscaConcursos"

export const revalidate = 60

export const metadata = {
  title: "Concursos Maranhão 2026",
  description: "Veja os concursos abertos no Maranhão com salários atualizados",
  keywords: ["concursos 2026", "concursos Maranhão", "editais MA"]
}

export default async function Home() {
  // 1. Busca os dados diretamente no servidor
const { data: concursos, error } = await supabaseServer
  .from('concursos')
  .select('id, orgao, cidade, banca, salario_max, categoria')

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

  // Lógica de estatísticas (agora feita no servidor)
const salarios = lista
  .map(c => c.salario)
  .filter(s => s > 0)
  const mediaSalarial = salarios.length ? salarios.reduce((a, b) => a + b, 0) / salarios.length : 0
  const maiorSalario = salarios.length ? Math.max(...salarios) : 0

  const formatarMoeda = (valor: number) => 
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <main className="min-h-screen bg-[#0f172a] text-white font-sans">
      
      <header className="py-16 px-5 text-center bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
        <h1 className="text-4xl font-bold mb-2">Concursos Maranhão Pro 2026</h1>
        <div className="text-slate-400">{lista.length} editais disponíveis no estado</div>
        
        {/* Links Rápidos */}
        <div className="flex gap-4 justify-center mt-6">
          <Link href="/blog" className="bg-blue-500/10 text-blue-400 border border-blue-500 px-5 py-2 rounded-full text-sm hover:bg-blue-500 hover:text-white transition">
            📄 Blog
          </Link>
          <Link href="/questoes" className="bg-purple-500/10 text-purple-400 border border-purple-500 px-5 py-2 rounded-full text-sm hover:bg-purple-500 hover:text-white transition">
            📝 Questões
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto p-5">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
            <span className="text-xs text-slate-400 block mb-2 uppercase tracking-wider">💰 Média Salarial</span>
            <h3 className="text-2xl font-bold">{formatarMoeda(mediaSalarial)}</h3>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
            <span className="text-xs text-slate-400 block mb-2 uppercase tracking-wider">🏢 Maior Salário</span>
            <h3 className="text-2xl font-bold">{formatarMoeda(maiorSalario)}</h3>
          </div>
        </div>

        {/* Grid de Concursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lista.length === 0 && (
        <div className="col-span-full text-center text-slate-400 mt-10">
          Nenhum concurso encontrado no momento.
        </div>
          )}
          {lista.map((c) => {

  return (
    <div key={c.id} className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col hover:border-blue-500/50 transition">
      
      <div className="flex justify-between items-center mb-4">
        <span className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold">
          {(c.categoria || c.cidade || "MA").toUpperCase()}
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
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm text-center hover:bg-blue-700 transition"
      >
        VER DETALHES
      </Link>

    </div>
  )
})}
        </div>
      </section>
    </main>
  )
}