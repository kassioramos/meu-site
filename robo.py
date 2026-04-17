import requests
from bs4 import BeautifulSoup
import psycopg2
import hashlib

# --- CONFIG SUPABASE ---
DATABASE_URL = "postgresql://postgres.mczmhvuxujvhrudqmpvg:ANTONIOCASSIO2010Mariano@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# --- PALAVRAS-CHAVE ---
TERMOS_BUSCA = [
    "PREFEITURA", "MUNICIPAL", "CÂMARA", "LEGISLATIVO",
    "ESTADUAL", "GOVERNO", "SELETIVO", "CONCURSO",
    "EDITAL", "INSCRIÇÕES", "VAGAS", "MA", "MARANHÃO",
    "SAÚDE", "EDUCAÇÃO", "GUARDA", "AGENTE",
    "PROCESSO", "SIMPLIFICADO", "PSS", "UEMA"
]

# --- GERAR HASH ---
def gerar_hash(texto):
    return hashlib.sha256(texto.encode('utf-8')).hexdigest()

# --- EXTRAIR CIDADE (🔥 SEO) ---
def extrair_cidade(texto):
    texto = texto.upper()

    cidades = [
        "SAO LUIS", "SÃO LUÍS", "IMPERATRIZ", "CAXIAS",
        "BACABAL", "TIMON", "ACOAILANDIA", "AÇAILÂNDIA",
        "BALSAS", "CODÓ", "COELHO NETO", "PINHEIRO",
        "SANTA INES", "SANTA INÊS", "CHAPADINHA", "Peritoró", "Coroatá", "ZÉ Doca", "ZÉ DOCA", "VITORIA DO MEARIM", "VITÓRIA DO MEARIM", "PEDREIRAS", "SÃO JOÃO DE PIRABAS", "SÃO JOÃO DE PIRABAS", "SÃO JOÃO DOS PATOS", "SÃO JOÃO DOS PATOS", "SÃO JOÃO DO CARÚ", "SÃO JOÃO DO CARÚ", "SÃO JOÃO DO PARAÍSO", "SÃO JOÃO DO PARAÍSO", "SÃO JOÃO DO SOTER", 
    ]

    for cidade in cidades:
        if cidade in texto:
            return cidade.title().replace("Sao", "São").replace("Ines", "Inês")

    return "Maranhão"

# --- BUSCAR LINKS REAIS ---
def buscar_links_reais(url_noticia):
    try:
        res = requests.get(url_noticia, timeout=10)
        s = BeautifulSoup(res.text, 'html.parser')

        link_edital = url_noticia
        link_inscricao = url_noticia

        for link in s.find_all('a', href=True):
            texto = link.text.lower()
            href = link['href']

            if "edital" in texto or href.endswith(".pdf"):
                link_edital = href
            if "inscri" in texto or "clique aqui" in texto:
                link_inscricao = href

        return link_edital, link_inscricao
    except:
        return url_noticia, url_noticia

# --- SALVAR NO BANCO ---
def salvar_no_banco(concursos):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        novos = 0

        for c in concursos:
            sql = """INSERT INTO concursos 
            (orgao, status, cargos, salario_min, salario_max, escolaridade, link_oficial, link_inscricao, hash_edital, cidade)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (hash_edital) DO NOTHING"""

            hash_id = gerar_hash(c['orgao'])

            vals = (
                c.get('orgao', '')[:255],
                c.get('status', 'Aberto'),
                c.get('cargos', ''),
                c.get('salario_min', 0.0),
                c.get('salario_max', 0.0),
                c.get('escolaridade', ''),
                c.get('link_oficial'),
                c.get('link_inscricao'),
                hash_id,
                c.get('cidade', 'Maranhão')
            )

            cursor.execute(sql, vals)

            if cursor.rowcount > 0:
                novos += 1

        conn.commit()
        cursor.close()
        conn.close()

        print(f"\n✅ {novos} novos concursos salvos!")

    except Exception as e:
        print("❌ ERRO BANCO:", e)

# --- SCRAPER G1 ---
def scraper_g1():
    print("🔎 G1...")
    url = "https://g1.globo.com/ma/maranhao/concursos-e-emprego/"
    concursos = []

    try:
        res = requests.get(url)
        soup = BeautifulSoup(res.text, 'html.parser')

        for item in soup.select('.feed-post-body'):
            link = item.find('a')
            if link:
                texto = link.text.strip().upper()
                url_noticia = link['href']

                if any(p in texto for p in TERMOS_BUSCA):
                    edital, inscricao = buscar_links_reais(url_noticia)

                    concursos.append({
                        "orgao": texto[:100],
                        "status": "Aberto",
                        "cargos": "Veja matéria",
                        "salario_min": 0.0,
                        "salario_max": 0.0,
                        "escolaridade": "Ver edital",
                        "link_oficial": edital,
                        "link_inscricao": inscricao,
                        "cidade": extrair_cidade(texto)
                    })

    except:
        pass

    return concursos

# --- SCRAPER SOUSANDRADE ---
def scraper_sousandrade():
    print("🔎 Sousândrade...")
    url = "https://www.fsadu.org.br/c/concursos/index.php"
    concursos = []

    try:
        res = requests.get(url)
        soup = BeautifulSoup(res.text, 'html.parser')

        for link in soup.find_all('a', href=True):
            texto = link.text.strip().upper()

            if any(p in texto for p in TERMOS_BUSCA):
                url_final = "https://www.fsadu.org.br/c/concursos/" + link['href']

                concursos.append({
                    "orgao": texto,
                    "status": "Aberto",
                    "cargos": "Ver edital",
                    "salario_min": 0.0,
                    "salario_max": 0.0,
                    "escolaridade": "Ver edital",
                    "link_oficial": url_final,
                    "link_inscricao": url_final,
                    "cidade": extrair_cidade(texto)
                })

    except:
        pass

    return concursos

# --- SCRAPER PCI ---
def scraper_pci():
    print("🔎 PCI...")
    url = "https://www.pciconcursos.com.br/concursos/nordeste/ma/"
    concursos = []

    try:
        res = requests.get(url)
        soup = BeautifulSoup(res.text, 'html.parser')

        for item in soup.select('.ca > .me'):
            link = item.find('a')

            if link:
                nome = link.text.strip().upper()

                concursos.append({
                    "orgao": nome,
                    "status": "Aberto",
                    "cargos": "Vários",
                    "salario_min": 0.0,
                    "salario_max": 0.0,
                    "escolaridade": "Ver site",
                    "link_oficial": link['href'],
                    "link_inscricao": link['href'],
                    "cidade": extrair_cidade(nome)
                })

    except:
        pass

    return concursos

# --- SCRAPER DOE ---
def scraper_doema():
    print("🔎 DOE-MA...")
    url = "http://ba.doema.ma.gov.br/index.php"
    concursos = []

    try:
        res = requests.get(url)
        soup = BeautifulSoup(res.text, 'html.parser')

        for link in soup.find_all('a', href=True):
            texto = link.text.strip().upper()

            if any(p in texto for p in TERMOS_BUSCA):
                href = link['href']
                url_final = href if href.startswith("http") else f"http://ba.doema.ma.gov.br/{href}"

                concursos.append({
                    "orgao": "DOE-MA",
                    "status": "Aberto",
                    "cargos": texto[:255],
                    "salario_min": 0.0,
                    "salario_max": 0.0,
                    "escolaridade": "Ver DOE",
                    "link_oficial": url_final,
                    "link_inscricao": url_final,
                    "cidade": extrair_cidade(texto)
                })

    except:
        pass

    return concursos

# --- EXECUÇÃO ---
if __name__ == "__main__":
    print("\n🚀 INICIANDO ROBÔ...\n")

    lista = []
    lista.extend(scraper_g1())
    lista.extend(scraper_sousandrade())
    lista.extend(scraper_pci())
    lista.extend(scraper_doema())

    print(f"\n📊 Total capturado: {len(lista)}")

    if lista:
        salvar_no_banco(lista)
    else:
        print("❌ Nenhum concurso encontrado.")

    print("\n✅ FINALIZADO\n")