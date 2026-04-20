'use client';
import React, { useState } from 'react';

interface QuestaoProps {
  questao: {
    id: string;
    disciplina: string;
    banca: string;
    enunciado: string;
    opcoes: Record<string, string>;
    alternativa_correta: string;
    comentario_professor: string;
  };
}

const CardQuestao = ({ questao }: QuestaoProps) => {
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [mostrarComentario, setMostrarComentario] = useState(false);

  const handleSelecao = (letra: string) => {
    setRespostaSelecionada(letra);
    setMostrarComentario(true);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 shadow-xl text-white">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase">
          {questao.disciplina}
        </span>
        <span className="text-slate-400 text-sm italic">Banca: {questao.banca}</span>
      </div>

      {/* Pergunta */}
      <p className="text-lg font-medium mb-6 leading-relaxed">
        {questao.enunciado}
      </p>

      {/* Alternativas */}
      <div className="grid gap-3">
        {Object.entries(questao.opcoes).map(([letra, texto]) => {
          const correta = letra === questao.alternativa_correta;
          const selecionada = letra === respostaSelecionada;
          
          let estiloFundo = "bg-slate-700 border-slate-600 hover:border-blue-500";
          if (respostaSelecionada) {
            if (correta) estiloFundo = "bg-emerald-600 border-emerald-400 text-white";
            else if (selecionada) estiloFundo = "bg-rose-600 border-rose-400 text-white";
          }

          return (
            <button
              key={letra}
              onClick={() => !respostaSelecionada && handleSelecao(letra)}
              disabled={!!respostaSelecionada}
              className={`w-full text-left p-4 border rounded-lg transition-all flex items-start gap-3 ${estiloFundo}`}
            >
              <span className="font-bold uppercase">{letra})</span>
              <span>{texto}</span>
            </button>
          );
        })}
      </div>

      {/* Comentário (Blog de Estudos) */}
      {mostrarComentario && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-900 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-2">
              💡 Dica do Professor:
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {questao.comentario_professor}
            </p>
          </div>
          <div className="mt-4 text-center">
             <button className="text-xs text-slate-500 hover:text-blue-400 underline">
               Ver mais questões de {questao.disciplina}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardQuestao;