// 🔥 SEO META TAG
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

// 🔥 FORMATAR CIDADE
function formatarCidade(cidade: string) {
  return cidade
    .replace("-", " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

// 🔥 TEXTO MELHORADO
function gerarTexto(c: any) {
  const salario =
    c.salario_max > 0
      ? `com salários de até R$ ${c.salario_max}`
      : `com remuneração definida em edital`;

  return `
O edital do ${c.orgao} traz oportunidades para atuação na região de ${c.cidade}.

O processo seletivo conta ${salario}, abrangendo diferentes níveis de escolaridade.

Para participar, é fundamental acompanhar os prazos e requisitos descritos no edital oficial.

Essa pode ser uma excelente oportunidade para ingressar no serviço público em ${c.cidade}.
`;
}

// 🔥 BUSCA CONCURSO
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

// 🔥 PAGE
export default async function Page({ params }: any) {
  const c = await getConcurso(params.id);

  return (
    <div style={{ padding: "20px" }}>
      <h1>{c.orgao}</h1>

      <p>
        <strong>Cidade:</strong> {formatarCidade(c.cidade)}
      </p>

      <p>
        <strong>Salário:</strong>{" "}
        {c.salario_max > 0
          ? `R$ ${c.salario_max}`
          : "A consultar no edital"}
      </p>

      <h2>Sobre o concurso</h2>
      <p>{gerarTexto(c)}</p>

      <a href={c.link_oficial} target="_blank" rel="noopener noreferrer">
        📄 Ver edital oficial
      </a>
    </div>
  );
}