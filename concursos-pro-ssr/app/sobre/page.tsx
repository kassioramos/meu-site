import Link from 'next/link'

export default function SobrePage() {
  return (
    <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px 20px' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Voltar para o Início
        </Link>

        <h1 style={{ color: '#3b82f6', fontSize: '2.5rem', marginTop: '20px', marginBottom: '24px', fontWeight: 'bold' }}>
          Sobre o Concursos Maranhão Pro
        </h1>

        <div style={{ lineHeight: '1.8', color: '#cbd5e1', fontSize: '1.05rem'}}>
          <p style={{ marginBottom: '20px' }}>
            O <strong>Concursos Maranhão Pro</strong> nasceu com uma missão clara: centralizar, simplificar e democratizar o acesso a informações sobre concursos públicos e processos seletivos em todo o estado do Maranhão.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Sabemos o quão desafiador é rastrear editais municipais, acompanhar prazos de inscrições e encontrar materiais de qualidade focados na realidade da nossa região. Por isso, desenvolvemos uma plataforma robusta que reúne tudo o que o candidato precisa em um único lugar.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            Foco na UEMA e Vestibulares Regionais
          </h2>
          
          <p style={{ marginBottom: '20px' }}>
            Além dos certames públicos, dedicamos um espaço exclusivo para o ecossistema de preparação para o <strong>PAES UEMA</strong> e o ENEM. Nosso banco de dados conta com simulados, questões gabaritadas e análises detalhadas das obras literárias exigidas pelo vestibular da Universidade Estadual do Maranhão.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            Compromisso com a Verdade
          </h2>

          <p style={{ marginBottom: '20px' }}>
            Toda a nossa curadoria de dados é pautada na transparência e na busca direta por fontes oficiais (Diários Oficiais e portais das bancas organizadoras). Nosso objetivo é fornecer a tecnologia necessária para que você foque apenas no que importa: os seus estudos e a sua aprovação.
          </p>
        </div>

      </div>
    </div>
  )
}