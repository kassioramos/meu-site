export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface Props {
  params: Promise<{ slug: string }>
}

export default async function QuestaoDetalhe({ params }: Props) {
  const { slug } = await params
  
  return (
    <div style={{ color: 'white', padding: '100px', fontSize: '2rem' }}>
      Testando Rota Dinâmica! O parâmetro da URL é: {slug}
    </div>
  )
}