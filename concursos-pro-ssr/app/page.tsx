import Link from "next/link";

// 🔥 BUSCA DADOS
async function getConcursos() {
  const res = await fetch("https://meu-site-aodm.onrender.com/concursos", {
    cache: "no-store",
  });

  const data = await res.json();
  return data.items;
}

// 🔥 FORMATA CIDADE
function formatarCidade(cidade: string) {
  return cidade
    .replace("-", " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function gerarTexto(c: any) {
  const salario =
    c.salario_max > 0
      ? `com salários de até R$ ${c.salario_max}`
      : `com remuneração definida em edital`;

  return `
O edital do ${c.orgao} apresenta oportunidades para atuação em ${c.cidade}.

O processo seletivo conta ${salario}, com vagas para diferentes níveis de escolaridade.

Os interessados devem acompanhar os prazos e requisitos descritos no edital oficial.

Essa é uma boa oportunidade para quem deseja ingressar no serviço público.
`;
}

// 🔥 HOME
export default async function Home() {
  const concursos = await getConcursos();

  return (
    <main style={{ padding: "20px" }}>
      <h1>Concursos Maranhão Pro</h1>
      <p>
Encontre os concursos públicos abertos no Maranhão com informações atualizadas diariamente.
Consulte vagas, salários, editais e oportunidades em diversas cidades do estado.
</p>


      <h2>Oportunidades de concursos no Maranhão</h2>
<p>
Os concursos públicos no Maranhão oferecem oportunidades em diversas áreas,
como educação, saúde, segurança e administração.
Fique atento às atualizações diárias para não perder prazos e vagas disponíveis.
</p>

      {/* 🔥 LINKS SEO */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/cidade/sao-luis">São Luís</Link> |{" "}
        <Link href="/cargo/professor">Professor</Link>
      </div>

      {concursos.map((c: any) => (
        <div
          key={c.id}
          style={{
            border: "1px solid #ccc",
            margin: "10px 0",
            padding: "10px",
          }}
        >
          <h2>
  <Link href={`/concurso/${c.id}`}>
    Concurso {c.orgao} em {formatarCidade(c.cidade)}
  </Link>
        </h2>

          <p>
            <strong>Cidade:</strong> {formatarCidade(c.cidade)}
          </p>

          <p>
            <strong>Salário:</strong>{" "}
            {c.salario_max > 0
              ? `R$ ${c.salario_max}`
              : "A consultar no edital"}
          </p>

          <p>{gerarTexto(c)}</p>
        </div>
      ))}
    </main>
  );
}