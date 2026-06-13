import Link from 'next/link'

export default function PoliticaPrivacidadePage() {
  return (
    <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px 20px' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Voltar para o Início
        </Link>

        <h1 style={{ color: '#3b82f6', fontSize: '2.5rem', marginTop: '20px', marginBottom: '24px', fontWeight: 'bold' }}>
          Política de Privacidade
        </h1>

        <div style={{ lineHeight: '1.8', color: '#cbd5e1', fontSize: '1rem' }}>
          <p style={{ marginBottom: '20px' }}>
            A sua privacidade é extremamente importante para nós. É política do <strong>Concursos Maranhão Pro</strong> respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no nosso site.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            1. Coleta de Informações (Cookies e Google Analytics)
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Nosso site utiliza a ferramenta <strong>Google Analytics</strong> para monitorar o tráfego, entender o comportamento dos usuários e melhorar a experiência de navegação geral. Essa ferramenta coleta dados não identificáveis por meio de <em>cookies</em> padrão (arquivos de texto salvos no seu navegador). Os dados coletados incluem páginas visitadas, tempo de permanência e tipo de dispositivo utilizado.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            2. Uso dos Dados
          </h2>
          <p style={{ marginBottom: '20px' }}>
            As informações estatísticas coletadas são utilizadas exclusivamente para o aperfeiçoamento das funções do site, melhoria no desempenho do simulador de questões e otimização dos conteúdos de editais publicados. Não comercializamos ou compartilhamos dados pessoais com terceiros.
          </p>

          <h2 style={{ color: '#3b82f6', fontSize: '1.4rem', marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
            3. Segurança dos Dados
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Implementamos medidas de segurança técnicas e organizacionais padrão de mercado (incluindo criptografia SSL) para proteger seus dados contra acessos não autorizados, alterações ou destruição.
          </p>

          <p style={{ marginTop: '40px', fontSize: '0.85rem', color: '#64748b' }}>
            Esta política é atualizada periodicamente e entra em vigor imediatamente a partir de sua publicação.
          </p>
        </div>

      </div>
    </div>
  )
}