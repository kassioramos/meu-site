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
      (c.orgao + c.cargos).toLowerCase().includes(params.cargo)
  );

  return (
    <main style={{ padding: "20px" }}>
      <h1>Vagas para {params.cargo}</h1>

      <p>
        Confira todos os concursos com vagas para {params.cargo}. 
        Lista atualizada com salários e editais.
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