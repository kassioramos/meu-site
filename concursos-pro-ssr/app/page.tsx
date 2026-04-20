'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import CardQuestao from '../components/CardQuestao';
import Link from "next/link";

export default function Home() {
  const [concursos, setConcursos] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        console.log("Iniciando busca de dados...");

        // 1. Busca Questões (Supabase) - Primeiro porque é mais rápido
        const { data: dataQuestoes, error: erroSupabase } = await supabase
          .from('questoes')
          .select('*')
          .limit(5);

        if (erroSupabase) {
          console.error("Erro no Supabase:", erroSupabase.message);
        } else {
          console.log("Questões carregadas com sucesso!");
          setQuestoes(dataQuestoes || []);
        }

        // 2. Busca Concursos (API Render) - Em um bloco separado para não travar
        try {
          const res = await fetch("https://meu-site-aodm.onrender.com/concursos", {
             signal: AbortSignal.timeout(5000) // Cancela se demorar mais de 5 segundos
          });
          const dataConcursos = await res.json();
          setConcursos(dataConcursos.items || []);
        } catch (apiErr) {
          console.error("A API do Render está demorando ou fora do ar.");
        }

      } catch (err) {
        console.error("Erro geral na página:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []); // Mantém o array vazio para evitar loop infinito

  if (carregando) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <p>Carregando simulados e editais...</p>
        <p style={{ fontSize: "12px", color: "#666" }}>Se demorar, a API do Render pode estar acordando.</p>
      </div>
    );
  }

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Concursos Maranhão Pro</h1>
      
      {/* SEÇÃO DE QUESTÕES */}
      <section style={{ margin: "40px 0" }}>
        <h2 style={{ color: "#3b82f6", borderBottom: "2px solid #3b82f6", paddingBottom: "10px" }}>
          📝 Simulado Rápido
        </h2>
        <p style={{ marginBottom: "20px" }}>Teste seus conhecimentos agora:</p>
        
        {questoes.length > 0 ? (
          questoes.map((q: any) => (
            <CardQuestao key={q.id} questao={q} />
          ))
        ) : (
          <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px" }}>
            <p>Nenhuma questão disponível no momento. Verifique a conexão com o Supabase.</p>
          </div>
        )}
      </section>

      <hr style={{ margin: "40px 0", opacity: "0.2" }} />

      {/* LISTA DE CONCURSOS */}
      <section>
        <h2 style={{ marginTop: "40px" }}>Editais Abertos</h2>
        {concursos.length > 0 ? (
          concursos.map((c: any) => (
            <div key={c.id} style={{ border: "1px solid #ddd", padding: "15px", margin: "15px 0", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 10px 0" }}>{c.orgao}</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>Cidade: {c.cidade}</p>
              <Link href={`/concurso/${c.id}`} style={{ color: "#3b82f6", fontWeight: "bold", textDecoration: "none" }}>
                Ver detalhes do edital →
              </Link>
            </div>
          ))
        ) : (
          <p>Buscando editais atualizados...</p>
        )}
      </section>
    </main>
  );
}