export async function generateMetadata({ params }: any) {
  const res = await fetch(
    `https://meu-site-aodm.onrender.com/concursos/${params.id}`,
    { cache: "no-store" }
  );

  const c = await res.json();

  return {
    title: `${c.orgao} - Concurso em ${c.cidade} | Salário até R$ ${c.salario_max}`,
    description: `Confira todos os detalhes do concurso ${c.orgao} em ${c.cidade}. Salários, cargos, inscrições e edital atualizado.`,
  };
}

// ✅ FUNÇÃO ÚNICA (corrigido)
function gerarTexto(c: any) {
  return `O concurso ${c.orgao} na cidade de ${c.cidade} oferece salário de até R$ ${c.salario_max}. 
Essa é uma excelente oportunidade para quem busca estabilidade no Maranhão. 
Confira requisitos, cargos e detalhes completos neste edital atualizado.`;
}

// ✅ BUSCA DO CONCURSO
async function getConcurso(id: string) {
  const res = await fetch(
    `https://meu-site-aodm.onrender.com/concursos/${id}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Erro ao buscar concurso");
  }

  return res.json();
}

// ✅ PÁGINA
export default async function Page({ params }: any) {
  const c = await getConcurso(params.id);

  return (
    <div style={{ padding: "20px" }}>
      <h1>{c.orgao}</h1>

      <p><strong>Cidade:</strong> {c.cidade}</p>
      <p><strong>Salário:</strong> R$ {c.salario_max}</p>

      <h2>Sobre o concurso</h2>
      <p>{gerarTexto(c)}</p>

      <a href={c.link_oficial} target="_blank" rel="noopener noreferrer">
        📄 Ver edital oficial
      </a>
    </div>
  );
}