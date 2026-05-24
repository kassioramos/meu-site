"use client"

import { useState } from "react"
import Link from "next/link"

export default function BuscaConcursos({ lista }: any) {
  const [busca, setBusca] = useState("")

  const filtrados = lista.filter((c: any) =>
    c.orgao?.toLowerCase().includes(busca.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(busca.toLowerCase()) ||
    c.banca?.toLowerCase().includes(busca.toLowerCase())
  )

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <>
      {/* Campo de busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔎 Buscar por órgão, cidade ou banca..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
        />
      </div>

      {/* Lista filtrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.length === 0 && (
          <div className="col-span-full text-center text-slate-400 mt-10">
            Nenhum resultado encontrado.
          </div>
        )}

        {filtrados.map((c: any) => (
          <div key={c.id} className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col hover:border-blue-500/50 transition">
            
            <div className="flex justify-between items-center mb-4">
              <span className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold">
                {(c.categoria || c.cidade || "MA").toUpperCase()}
              </span>
            </div>

            <h3 className="text-blue-400 font-bold text-lg mb-4">
              {c.orgao}
            </h3>

            <div className="text-sm text-slate-300 space-y-2 flex-grow">
              <p>📍 {c.cidade || "Maranhão"}</p>
              <p>🏢 {c.banca || "A definir"}</p>
              <p className="text-white font-bold mt-4">
                💰 {c.salario > 0
                  ? `Até ${formatarMoeda(c.salario)}`
                  : "Salário não informado"}
              </p>
            </div>

            <Link
              href={`/detalhes/${c.id}?tipo=concurso`}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm text-center hover:bg-blue-700 transition"
            >
              VER DETALHES
            </Link>

          </div>
        ))}
      </div>
    </>
  )
}