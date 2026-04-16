async function getConcursos() {
  const res = await fetch("https://meu-site-aodm.onrender.com/concursos", {
    cache: "no-store"
  });

  const data = await res.json();
  return data.items;
}

function gerarTexto(c: any) {
  return `O concurso ${c.orgao} na cidade de ${c.cidade} oferece salário de até R$ ${c.salario_max}. Excelente oportunidade no Maranhão.`;
}

export default async function Home() {
  const concursos = await getConcursos();

  return (
    <main style={{ padding: "20px" }}>
      <h1>Concursos Maranhão Pro</h1>

      {concursos.map((c: any) => (
        <div key={c.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          
          <a href={`/concurso/${c.id}`}>
            <h2>{c.orgao}</h2>
          </a>

          <p>Cidade: {c.cidade}</p>
          <p>Salário: R$ {c.salario_max}</p>

          <p>{gerarTexto(c)}</p>
        </div>
      ))}
    </main>
  );
}