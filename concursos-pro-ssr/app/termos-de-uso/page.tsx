import Link from 'next/link'

export default function TermosUsoPage() {
  return (
    <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px 20px' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Voltar para o Início
        </Link>

        <h1 style={{ color: '#3b82f6', fontSize: '2.5rem', marginTop: '20px', marginBottom: '24px', fontWeight: 'bold' }}>
          Termos de Uso
        </h1>

        <div style={{ lineHeight: '1.8', color: '#cbd5e1', fontSize: '1rem' }}>
          <p style={{ marginBottom: '20px' }}>
            Ao acessar e utilizar a plataforma <strong>Concursos Maranhão Pro</strong>, você concorda expressamente em cumprir e respeitar os termos e condições descritos abaixo.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            1. Uso do Simulador e Conteúdos
          </h2>
          <p style={{ marginBottom: '20px' }}>
            O acesso às questões, comentários de professores, dados de editais e artigos do blog é disponibilizado de forma estritamente educacional e pessoal. É proibida a reprodução em massa de nossos simulados, raspagem automatizada de dados (scraping) sem autorização prévia, ou comercialização de qualquer material hospedado na plataforma.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            2. Limitação de Responsabilidade
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Embora nossa equipe faça um esforço contínuo para manter todas as informações sobre salários, vagas e bancas rigorosamente atualizadas, o <strong>Concursos Maranhão Pro</strong> funciona como um agregador informativo. O candidato possui a obrigação legal de ler e conferir as informações diretamente no Edital Oficial publicado no site da respectiva banca organizadora.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            3. Modificações no Serviço
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Reservamo-nos o direito de alterar, suspender ou descontinuar qualquer recurso, banco de questões ou ferramentas do site a qualquer momento, visando atualizações de segurança ou melhorias estruturais no sistema.
          </p>

          <p style={{ marginTop: '40px', fontSize: '0.85rem', color: '#64748b' }}>
            O uso continuado do site após alterações nestes termos constituirá sua aceitação das novas regras.
          </p>
        </div>

      </div>
    </div>
  )
}