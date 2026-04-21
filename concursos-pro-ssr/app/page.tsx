'use client';

import { useState, useEffect } from 'react';
import CardQuestao from '../components/CardQuestao';
import Link from "next/link";

export default function Home() {
  const [concursos, setConcursos] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const API_BASE_URL = "https://meu-site-aodm.onrender.com";

  useEffect(() => {
    async function carregarDados() {
      try {
        // 1. Busca Questões - Usando encodeURIComponent para garantir que o espaço no nome não quebre o link
        const nomeBanca = "Instituto JK";
        const resQuestoes = await fetch(`${API_BASE_URL}/questoes?banca=${encodeURIComponent(nomeBanca)}`);
        
        if (resQuestoes.ok) {
          const dataQuestoes = await resQuestoes.json();
          // Filtro de segurança no frontend também
          setQuestoes(dataQuestoes || []);
        }

        // 2. Busca Concursos
        const resConcursos = await fetch(`${API_BASE_URL}/concursos`);
        if (resConcursos.ok) {
          const dataConcursos = await resConcursos.json();
          setConcursos(dataConcursos.items || []);
        }

      } catch (err) {
        console.error("Erro na carga de dados:", err);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  if (carregando) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <p>Carregando simulados e editais...</p>
      </div>
    );
  }

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Concursos Maranhão Pro</h1>
      
      <section style={{ margin: "40px 0" }}>
        <h2 style={{ color: "#3b82f6", borderBottom: "2px solid #3b82f6", paddingBottom: "10px" }}>
          📝 Simulado Rápido
        </h2>
        
        {questoes.length > 0 ? (
          questoes.map((q) => (
            <CardQuestao key={q.id} questao={q} />
          ))
        ) : (
          <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ color: "#64748b" }}>🔍 Buscando questões do Instituto JK no banco de dados...</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "10px" }}>
              Dica: Verifique se no Supabase o nome da banca está escrito exatamente "Instituto JK" sem espaços sobrando.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ marginTop: "40px", color: "#334155" }}>Editais Abertos</h2>
        {concursos.map((c) => (
          <div key={c.id} style={{ border: "1px solid #e2e8f0", padding: "15px", margin: "15px 0", borderRadius: "8px", background: "#fff" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>{c.orgao}</h3>
            <p style={{ fontSize: "14px", color: "#64748b" }}>Local: {c.cidade} | Banca: {c.banca}</p>
            <Link href={`/concurso/${c.id}`} style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "none" }}>
              Ver detalhes do edital →
            </Link>
          </div>
        ))}
      </section>
    </main>
  );
}