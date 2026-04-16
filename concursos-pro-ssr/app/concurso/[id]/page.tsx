export async function generateMetadata({ params }: any) {
  const res = await fetch(`https://meu-site-aodm.onrender.com/concursos/${params.id}`);
  const c = await res.json();

  return {
    title: `${c.orgao} - Concurso em ${c.cidade} | Salário até R$ ${c.salario_max}`,
    description: `Confira todos os detalhes do concurso ${c.orgao} em ${c.cidade}. Salários, cargos, inscrições e edital atualizado.`,
  };
}

function gerarTexto(c: any) {
  return `
  O concurso ${c.orgao} em ${c.cidade} é uma excelente oportunidade para quem busca estabilidade no Maranhão. 
  Com salários que podem chegar a R$ ${c.salario_max}, o certame oferece vagas para diferentes níveis de escolaridade.

  Os candidatos devem ficar atentos aos prazos de inscrição e aos requisitos exigidos no edital oficial. 
  Este processo seletivo é uma ótima chance para ingressar no serviço público.

  Confira abaixo todas as informações detalhadas, incluindo cargos, salários e como se inscrever.
  `;
}

async function getConcurso(id: string) {
  const res = await fetch(`https://meu-site-aodm.onrender.com/concursos/${id}`, {
    cache: "no-store"
  });

  return res.json();
}

function gerarTexto(c: any) {
  return `O concurso ${c.orgao} na cidade de ${c.cidade} oferece salário de até R$ ${c.salario_max}. 
  Essa é uma excelente oportunidade para quem busca estabilidade no Maranhão. 
  Confira requisitos, cargos e detalhes completos neste edital atualizado.`;
}

export default async function Page({ params }: any) {
  const c = await getConcurso(params.id);

  return (
    <div style={{ padding: "20px" }}>
      <h1>{c.orgao}</h1>

      <p><strong>Cidade:</strong> {c.cidade}</p>
      <p><strong>Salário:</strong> R$ {c.salario_max}</p>

      <h2>Sobre o concurso</h2>
      <p>{gerarTexto(c)}</p>

      <a href={c.link_oficial} target="_blank">
        📄 Ver edital oficial
      </a>
    </div>
  );
}