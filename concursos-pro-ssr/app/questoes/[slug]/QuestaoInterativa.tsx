'use client'

import { useState } from 'react'

interface QuestaoInterativaProps {
  questao: {
    id: string
    opcoes: Record<string, string> | any
    alternativa_correta: string
    comentario_professor?: string | null
  }
}

export default function QuestaoInterativa({ questao }: QuestaoInterativaProps) {
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<string | null>(null)
  const [revelouGabarito, setRevelouGabarito] = useState(false)

  const listaOpcoes = questao?.opcoes ? Object.entries(questao.opcoes) : []

  const handleConfirmar = () => {
    if (alternativaSelecionada) {
      setRevelouGabarito(true)
    }
  }

  return (
    <div style={{ marginTop: '25px' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#94a3b8' }}>
        Selecione a alternativa correta:
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {listaOpcoes.map(([letra, texto]: [string, any]) => {
          const isSelecionada = alternativaSelecionada === letra
          const isCorreta = questao.alternativa_correta?.toLowerCase() === letra.toLowerCase()
          
          let backgroundColor = '#1e293b'
          let borderColor = isSelecionada ? '#3b82f6' : '#334155'

          if (revelouGabarito) {
            if (isCorreta) {
              backgroundColor = '#065f46'
              borderColor = '#10b981'
            } else if (isSelecionada && !isCorreta) {
              backgroundColor = '#991b1b'
              borderColor = '#ef4444'
            }
          }

          return (
            <button
              key={letra}
              disabled={revelouGabarito}
              onClick={() => setAlternativaSelecionada(letra)}
              style={{
                backgroundColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '16px',
                color: 'white',
                textAlign: 'left',
                cursor: revelouGabarito ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                fontSize: '1rem'
              }}
            >
              <div style={{
                fontWeight: 'bold',
                background: isSelecionada ? '#3b82f6' : '#475569',
                color: 'white',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textTransform: 'uppercase'
              }}>
                {letra}
              </div>
              <span style={{ flex: 1 }}>{texto}</span>
            </button>
          )
        })}
      </div>

      {!revelouGabarito && (
        <button
          disabled={!alternativaSelecionada}
          onClick={handleConfirmar}
          style={{
            marginTop: '25px',
            width: '100%',
            backgroundColor: alternativaSelecionada ? '#3b82f6' : '#475569',
            color: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: alternativaSelecionada ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s'
          }}
        >
          Responder Questão
        </button>
      )}

      {revelouGabarito && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#1e293b',
          borderRadius: '8px',
          borderTop: alternativaSelecionada?.toLowerCase() === questao.alternativa_correta?.toLowerCase()
            ? '4px solid #10b981'
            : '4px solid #ef4444'
        }}>
          <h4 style={{
            fontSize: '1.2rem',
            color: alternativaSelecionada?.toLowerCase() === questao.alternativa_correta?.toLowerCase() ? '#10b981' : '#ef4444',
            marginBottom: '10px'
          }}>
            {alternativaSelecionada?.toLowerCase() === questao.alternativa_correta?.toLowerCase()
              ? '🎉 Resposta Correta!'
              : `❌ Resposta Incorreta! O gabarito é a alternativa ${questao.alternativa_correta?.toUpperCase()}`}
          </h4>
          
          {questao.comentario_professor && (
            <div style={{ marginTop: '15px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
              <h5 style={{ color: '#3b82f6', marginBottom: '5px', fontSize: '1rem' }}>💡 Comentário do Professor:</h5>
              <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{questao.comentario_professor}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}