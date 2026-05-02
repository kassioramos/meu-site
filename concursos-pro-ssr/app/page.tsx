'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// Registro obrigatório do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Home() {
  const [concursos, setConcursos] = useState<any[]>([])
  const [busca, setBusca] = useState("")
  const [temaClaro, setTemaClaro] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase.from('concursos').select('*')
      if (error) console.error(error)
      else setConcursos(data || [])
    }
    carregar()
  }, [])

  const filtrados = concursos.filter(c =>
    (c.orgao || "").toLowerCase().includes(busca.toLowerCase()) ||
    (c.cidade || "").toLowerCase().includes(busca.toLowerCase())
  )

  // Cálculos de Estatísticas
  const salarios = concursos.map(c => Number(c.salario_max) || 0).filter(s => s > 0)
  const mediaSalarial = salarios.length ? salarios.reduce((a, b) => a + b, 0) / salarios.length : 0
  const maiorSalario = salarios.length ? Math.max(...salarios) : 0

  const formatarMoeda = (valor: number) => 
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Dados dos Gráficos
  const cidadesMap: any = {}
  concursos.forEach(c => { const n = c.cidade || "MA"; cidadesMap[n] = (cidadesMap[n] || 0) + 1 })
  const top5Cidades = Object.entries(cidadesMap).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)

  const chartColor = temaClaro ? '#1e293b' : '#ffffff'

  const dataBarra = {
    labels: top5Cidades.map(x => x[0]),
    datasets: [{ label: 'Editais', data: top5Cidades.map(x => x[1]), backgroundColor: '#3b82f6', borderRadius: 4 }]
  }

  const dataPizza = {
    labels: ['Educação', 'Saúde', 'Outros'],
    datasets: [{
      data: [
        concursos.filter(c => c.orgao?.toLowerCase().includes('educ')).length,
        concursos.filter(c => c.orgao?.toLowerCase().includes('saud')).length,
        concursos.filter(c => !c.orgao?.toLowerCase().includes('educ') && !c.orgao?.toLowerCase().includes('saud')).length
      ],
      backgroundColor: ['#60a5fa', '#34d399', '#94a3b8'],
      borderWidth: 0
    }]
  }

  const chartOptions: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { 
      x: { grid: { display: false }, ticks: { color: chartColor } }, 
      y: { grid: { display: false }, ticks: { color: chartColor } } 
    }
  }

  return (
    <main style={{ 
      background: temaClaro ? "#f8fafc" : "#0f172a", 
      color: temaClaro ? "#1e293b" : "white", 
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* Botão de Tema */}
      <button 
        onClick={() => setTemaClaro(!temaClaro)}
        style={{ position: "fixed", top: "20px", right: "20px", zIndex: 1000, background: "#3b82f6", border: "none", borderRadius: "50%", width: "45px", height: "45px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {temaClaro ? "🌙" : "☀️"}
      </button>

      {/* Header com Gradiente */}
      <header style={{
        padding: "60px 20px 40px",
        textAlign: "center",
        background: temaClaro 
          ? "linear-gradient(180deg, #e2e8f0 0%, #f8fafc 100%)" 
          : "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)"
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "10px" }}>Concursos Maranhão Pro</h1>
        <div style={{ color: "#94a3b8", marginBottom: "25px" }}>{concursos.length} editais carregados</div>

        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="Pesquisar editais..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ 
              width: "100%", padding: "12px 20px", borderRadius: "8px", border: "none", 
              marginBottom: "20px", color: "#000", outline: "none", fontSize: "1rem" 
            }}
          />
          
          {/* Botões de Filtro/Navegação */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/blog" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid #3b82f6", padding: "8px 20px", borderRadius: "20px", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}>
              <span>📄</span> Blog
            </Link>
            <Link href="/questoes" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid #8b5cf6", padding: "8px 20px", borderRadius: "20px", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "5px" }}>
              <span>📝</span> Questões
            </Link>
            <button style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "20px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}>
              📥 Lista PDF
            </button>
          </div>
          
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "15px", flexWrap: "wrap" }}>
             {['Notícias', 'UEMA', 'ENEM', 'Dicas'].map(cat => (
               <button key={cat} style={{ background: "transparent", color: "#94a3b8", border: "1px solid #475569", padding: "5px 15px", borderRadius: "20px", fontSize: "0.75rem", cursor: "pointer" }}>
                 {cat}
               </button>
             ))}
          </div>
        </div>
      </header>

      {/* Seção de Estatísticas */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          <div style={{ background: temaClaro ? "#fff" : "rgba(255,255,255,0.05)", padding: "25px", borderRadius: "12px", textAlign: "center", border: temaClaro ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "10px" }}>💰 Média Salarial</span>
            <h3 style={{ margin: 0, fontSize: "1.4rem" }}>{formatarMoeda(mediaSalarial)}</h3>
          </div>
          <div style={{ background: temaClaro ? "#fff" : "rgba(255,255,255,0.05)", padding: "25px", borderRadius: "12px", textAlign: "center", border: temaClaro ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "10px" }}>🏢 Maior Salário</span>
            <h3 style={{ margin: 0, fontSize: "1.4rem" }}>{formatarMoeda(maiorSalario)}</h3>
          </div>
        </div>

        {/* Gráficos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <div style={{ background: temaClaro ? "#fff" : "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "12px", border: temaClaro ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.1)" }}>
             <h4 style={{ fontSize: "0.9rem", textAlign: "center", marginBottom: "20px" }}>📊 Vagas por Cidade</h4>
             <div style={{ height: "250px" }}><Bar data={dataBarra} options={chartOptions} /></div>
          </div>
          <div style={{ background: temaClaro ? "#fff" : "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "12px", border: temaClaro ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.1)" }}>
             <h4 style={{ fontSize: "0.9rem", textAlign: "center", marginBottom: "20px" }}>🍩 Distribuição</h4>
             <div style={{ height: "250px" }}>
               <Doughnut data={dataPizza} options={{ ...chartOptions, indexAxis: 'x', plugins: { legend: { display: true, position: 'bottom', labels: { color: chartColor } } } }} />
             </div>
          </div>
        </div>

        {/* Grid de Cards de Concursos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
          {filtrados.map((c) => (
            <div key={c.id} style={{
              background: temaClaro ? "#fff" : "rgba(255,255,255,0.05)",
              padding: "24px", borderRadius: "12px",
              border: temaClaro ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.1)",
              display: "flex", flexDirection: "column", transition: "0.2s"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <span style={{ background: "#3b82f6", color: "#fff", padding: "3px 10px", borderRadius: "5px", fontSize: "0.7rem", fontWeight: "700" }}>{c.cidade?.toUpperCase() || "MA"}</span>
                <button style={{ background: "none", border: "none", color: "#ffca28", fontSize: "1.2rem", cursor: "pointer" }}>☆</button>
              </div>
              
              <h3 style={{ color: "#60a5fa", fontSize: "1rem", marginBottom: "15px", lineHeight: "1.4", minHeight: "2.8em" }}>{c.orgao}</h3>
              
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
                <p>📍 {c.cidade || "Maranhão"}</p>
                <p>🏢 {c.banca || "A definir"}</p>
                <p style={{ color: temaClaro ? "#1e293b" : "#fff", fontWeight: "700", marginTop: "10px", fontSize: "1rem" }}>💰 Até {formatarMoeda(Number(c.salario_max))}</p>
              </div>
              
              <Link href={`/detalhes/${c.id}?tipo=concurso`} style={{ textDecoration: 'none' }}>
                <button style={{ marginTop: "20px", width: "100%", background: "#3b82f6", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer" }}>
                  DETALHES
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}