'use client'

import { useState } from 'react'

export default function QuestaoInterativa({ questao }: { questao: any }) {
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [respondido, setRespondido] = useState(false)

  const listaOpcoes = questao.opcoes ? Object.entries(questao.opcoes) : []
  const acertou = selecionada === questao.alternativa_correta

  return (
    <>
      {/* Bloco de Alternativas */}
      <div style={{ 
        background: '#1e293b', 
        padding: '25px', 
        borderRadius: '10px', 
        borderLeft: '5px solid #6366f1',
        marginBottom: '20px' 
      }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', marginBottom: '20px' }}>
          <span>📝</span> Alternativas
        </h3>
        
        <div style={{ display: 'grid', gap: '10px' }}>
          {listaOpcoes.map(([letra, texto]: any) => {
            const eACorreta = letra === questao.alternativa_correta
            const eASelecionada = selecionada === letra
            
            let estiloBotao = {
              width: '100%',
              padding: '14px 20px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: 'white',
              textAlign: 'left' as const, // Mudado para 'left' para ficar padrão vestibular (letra na esquerda, texto corrido)
              cursor: respondido ? 'default' : 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }

            if (respondido) {
              if (eACorreta) {
                estiloBotao.background = '#10b981'
                estiloBotao.border = '1px solid #10b981'
              } else if (eASelecionada) {
                estiloBotao.background = '#ef4444'
                estiloBotao.border = '1px solid #ef4444'
              }
            } else if (eASelecionada) {
              estiloBotao.border = '1px solid #3b82f6'
              estiloBotao.background = '#334155'
            }

            // Tratamento preventivo: se o texto já começar com "a)", remove os caracteres repetidos
            const textoFormatado = typeof texto === 'string' && texto.toLowerCase().startsWith(`${letra.toLowerCase()})`)
              ? texto.substring(2).trim()
              : texto;

            return (
              <button 
                key={letra} 
                disabled={respondido}
                onClick={() => setSelecionada(letra)}
                style={estiloBotao}
              >
                {/* Deixa a letra em negrito e com destaque */}
                <span style={{ fontWeight: 'bold', color: eASelecionada || (respondido && eACorreta) ? 'white' : '#3b82f6' }}>
                  {letra.toUpperCase()})
                </span>
                <span>{textoFormatado}</span>
              </button>
            )
          })}
        </div>

        {!respondido && (
          <button 
            onClick={() => {
              if (selecionada) setRespondido(true)
            }}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: [{selecionada}][0].selecionada ? 'pointer' : 'not-allowed',
              opacity: [{selecionada}][0].selecionada ? 1 : 0.5,
              transition: 'opacity 0.2s'
            }}
          >
            Confirmar Resposta
          </button>
        )}
      </div>

      {/* Bloco de Feedback (Resultado) */}
      {respondido && (
        <div style={{ 
          background: '#1e293b', 
          padding: '25px', 
          borderRadius: '10px', 
          borderLeft: `5px solid ${acertou ? '#10b981' : '#ef4444'}`,
          animation: 'fadeIn 0.3s ease'
        }}>
          <h3 style={{ color: acertou ? '#10b981' : '#ef4444', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {acertou ? '✅ Resposta correta!' : '❌ Resposta errada!'}
          </h3>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            Resposta correta: <span style={{ color: '#10b981' }}>{questao.alternativa_correta?.toUpperCase()}</span>
          </p>
          {questao.comentario_professor && (
            <div style={{ marginTop: '15px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#6366f1', marginBottom: '8px' }}>💡 Comentário do Professor:</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                {questao.comentario_professor}
              </p>
            </div>
          )}
          <button 
            onClick={() => { setRespondido(false); setSelecionada(null); }}
            style={{ marginTop: '20px', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}
          >
            Refazer Questão
          </button>
        </div>
      )}
    </>
  )
}