// ✅ SEO META TAG
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

// ✅ FORMATAR CIDADE (AGORA NO LUGAR CERTO)
function formatarCidade(cidade: string) {
  return cidade
    .replace("-", " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

// ✅ TEXTO SEO
function gerarTexto(c: any) {
  const salario = c.salario_max > 0 
    ? `com salários de até R$ ${c.salario_max}` 
    : `com remuneração conforme edital`;

  return `
O concurso ${c.orgao} na cidade de ${c.cidade} é uma oportunidade importante para quem busca estabilidade no serviço público no Maranhão.

O edital oferece vagas ${salario}, contemplando diferentes níveis de escolaridade e áreas de atuação.

Os interessados devem acompanhar os prazos de inscrição e todas as exigências descritas no edital oficial.

Este processo seletivo pode ser uma excelente porta de entrada para carreira pública em ${c.cidade}.
`;
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

      <p><strong>Cidade:</strong> {formatarCidade(c.cidade)}</p>

      <p><strong>Salário:</strong> 
        {c.salario_max > 0 ? `R$ ${c.salario_max}` : "A consultar no edital"}
      </p>

      <h2>Sobre o concurso</h2>
      <p>{gerarTexto(c)}</p>

      <a href={c.link_oficial} target="_blank" rel="noopener noreferrer">
        📄 Ver edital oficial
      </a>
    </div>
  );
}