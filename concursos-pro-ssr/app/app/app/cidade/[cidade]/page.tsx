async function getConcursos() {
  const res = await fetch("https://meu-site-aodm.onrender.com/concursos", {
    cache: "no-store"
  });
  const data = await res.json();
  return data.items;
}

export default async function Page({ params }: any) {
  const concursos = await getConcursos();

  const filtrados = concursos.filter(
    (c: any) =>
      c.cidade?.toLowerCase().replace(" ", "-") === params.cidade
  );

  return (
    <main style={{ padding: "20px" }}>
      <h1>Concursos em {params.cidade}</h1>

      <p>
        Veja todos os concursos abertos na cidade de {params.cidade}. 
        Oportunidades atualizadas diariamente com salários e editais completos.
      </p>

      {filtrados.map((c: any) => (
        <div key={c.id}>
          <a href={`/concurso/${c.id}`}>
            <h2>{c.orgao}</h2>
          </a>
        </div>
      ))}
    </main>
  );
}