async function getConcursos() {
  const res = await fetch("https://meu-site-aodm.onrender.com/concursos", {
    cache: "no-store"
  });

  const data = await res.json();
  return data.items;
}

function gerarTexto(c: any) {
  const salario = c.salario_max > 0 
    ? `com salários de até R$ ${c.salario_max}` 
    : `com remuneração conforme edital`;

  return `O concurso ${c.orgao} na cidade de ${c.cidade} é uma excelente oportunidade no Maranhão, ${salario}. Confira todos os detalhes e requisitos para participar.`;
}

export default async function Home() {
  const concursos = await getConcursos();

  return (
    <main style={{ padding: "20px" }}>
      
      <h1>Concursos Maranhão Pro</h1>

      {/* LINKS SEO */}
      <div style={{ marginBottom: "20px" }}>
        <a href="/cidade/sao-luis">São Luís</a> |{" "}
        <a href="/cargo/professor">Professor</a>
      </div>

      {/* TEXTO SEO (AGORA NO LUGAR CERTO) */}
      <section>
        <h2>Concursos no Maranhão</h2>
        <p>
          Confira os principais concursos públicos e processos seletivos abertos no Maranhão.
          As oportunidades abrangem diversas áreas como educação, saúde e administração pública,
          com vagas em cidades como São Luís, Imperatriz e Caxias.
        </p>
      </section>

      {/* LISTA DE CONCURSOS */}
      {concursos.map((c: any) => (
        <div key={c.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          
          <a href={`/concurso/${c.id}`}>
            <h2>{c.orgao}</h2>
          </a>

          <p><strong>Cidade:</strong> {c.cidade}</p>

          <p><strong>Salário:</strong> 
            {c.salario_max > 0 ? `R$ ${c.salario_max}` : "A consultar no edital"}
          </p>

          <p>{gerarTexto(c)}</p>
        </div>
      ))}

    </main>
  );
}