// app/components/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ 
      backgroundColor: '#0f172a', 
      borderTop: '1px solid #1e293b', 
      padding: '30px 20px', 
      marginTop: 'auto',
      color: '#94a3b8',
      fontSize: '0.9rem'
    }}>
      <div style={{ 
        maxWidth: '750px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        alignItems: 'center' 
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} Concursos Maranhão Pro. Todos os direitos reservados.
        </p>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/sobre" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Sobre
          </Link>
          <Link href="/politica-de-privacidade" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Política de Privacidade
          </Link>
          <Link href="/termos-de-uso" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Termos de Uso
          </Link>
        </div>
      </div>
    </footer>
  )
}