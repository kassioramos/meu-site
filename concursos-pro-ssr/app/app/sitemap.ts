export default async function sitemap() {
  const res = await fetch("https://meu-site-aodm.onrender.com/concursos");
  const data = await res.json();

  return data.items.map((c: any) => ({
    url: `https://meu-site-five-delta.vercel.app/concurso/${c.id}`,
    lastModified: new Date(),
  }));
}