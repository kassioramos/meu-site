import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ListagemQuestoes() {
  const { data: questoes, error } = await supabase
    .from('questoes')
    .select('id, slug, disciplina, banca, enunciado')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px' }}>
        <p>Erro ao carregar questões: {error.message}</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#3b82f6', fontSize: '2.5rem', marginBottom: '30px' }}>
          Questões Disponíveis
        </h1>

        <div style={{ display: 'grid', gap: '20px' }}>
          {questoes?.map((questao) => {
            const parametroRota = questao.slug || questao.id

            return (
              <div 
                key={questao.id} 
                style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #3b82f6' }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', marginRight: '10px' }}>
                    {questao.banca || 'Geral'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    {questao.disciplina}
                  </span>
                </div>
                
                <p style={{ color: '#cbd5e1', lineHeight: '1.5', marginBottom: '15px' }}>
                  {questao.enunciado ? questao.enunciado.substring(0, 140) + '...' : ''}
                </p>

                <Link 
                  href={`/questoes/${parametroRota}`} 
                  style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}
                >
                  Responder Questão →
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}