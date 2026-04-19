import requests
from bs4 import BeautifulSoup
import psycopg2
import hashlib
import re # Biblioteca para extrair números e datas

# --- CONFIG SUPABASE ---
DATABASE_URL = "postgresql://postgres.mczmhvuxujvhrudqmpvg:ANTONIOCASSIO2010Mariano@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# --- AUXILIARES DE EXTRAÇÃO ---
def extrair_valor(texto):
    # Procura padrões de R$ 1.000,00 ou apenas números com vírgula
    valores = re.findall(r'R\$\s?(\d[\d.,]+)', texto)
    if valores:
        # Limpa pontos e troca vírgula por ponto para o banco (Decimal)
        val = valores[0].replace('.', '').replace(',', '.')
        return float(val)
    return 0.0

def extrair_data(texto):
    # Procura datas no formato dd/mm/aaaa ou dd/mm/aa
    datas = re.findall(r'(\d{2}/\d{2}/\d{2,4})', texto)
    return datas[0] if datas else None

def extrair_escolaridade(texto):
    texto = texto.upper()
    niveis = []
    if "SUPERIOR" in texto: niveis.append("Superior")
    if "MÉDIO" in texto or "MEDIO" in texto: niveis.append("Médio")
    if "TÉCNICO" in texto or "TECNICO" in texto: niveis.append("Técnico")
    if "FUNDAMENTAL" in texto: niveis.append("Fundamental")
    
    return ", ".join(niveis) if niveis else "Ver Edital"

# --- GERAR HASH (CORREÇÃO DE DUPLICIDADE) ---
def gerar_hash(orgao, cidade, link):
    # Mistura o nome, cidade e link. Assim, se o link mudar ou o órgão, o ID muda.
    string_unica = f"{orgao}{cidade}{link}".upper().strip()
    return hashlib.sha256(string_unica.encode('utf-8')).hexdigest()

# --- EXTRAIR CIDADE ---
def extrair_cidade(texto):
    texto = texto.upper()
    cidades = ["SÃO LUÍS", "IMPERATRIZ", "CAXIAS", "BACABAL", "TIMON", "AÇAILÂNDIA", "BALSAS", "CODÓ", "COELHO NETO", "PINHEIRO", "SANTA INÊS", "CHAPADINHA", "CAJARI"]
    for cidade in cidades:
        if cidade.replace("Ã", "A").replace("Í", "I") in texto or cidade in texto:
            return cidade.title()
    return "Maranhão"

# --- SALVAR NO BANCO ---
def salvar_no_banco(concursos):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        novos = 0

        sql = """INSERT INTO concursos 
        (orgao, cidade, status, cargos, salario_min, salario_max, escolaridade, valor_inscricao, data_prova, link_oficial, link_inscricao, hash_edital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (hash_edital) DO UPDATE SET
        status = EXCLUDED.status, 
        salario_max = GREATEST(concursos.salario_max, EXCLUDED.salario_max);"""

        for c in concursos:
            # Gerar Hash robusto para evitar duplicidade
            hash_id = gerar_hash(c['orgao'], c['cidade'], c['link_oficial'])

            vals = (
                c['orgao'][:255],
                c['cidade'],
                c['status'],
                c['cargos'],
                c.get('salario_min', 0.0),
                c.get('salario_max', 0.0),
                c['escolaridade'],
                c.get('valor_inscricao', 0.0),
                c.get('data_prova'), # Pode ser None
                c['link_oficial'],
                c['link_inscricao'],
                hash_id
            )
            cursor.execute(sql, vals)
            if cursor.rowcount > 0: novos += 1

        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ {novos} registros processados.")
    except Exception as e:
        print("❌ ERRO BANCO:", e)

# --- SCRAPER G1 (EXEMPLO MELHORADO) ---
def scraper_g1():
    print("🔎 Minerando G1...")
    url = "https://g1.globo.com/ma/maranhao/concursos-e-emprego/"
    concursos = []
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        for item in soup.select('.feed-post-body'):
            link_tag = item.find('a')
            if link_tag:
                resumo = item.select_one('.feed-post-header-chapeu')
                orgao = resumo.text.strip() if resumo else link_tag.text.strip()
                texto_completo = item.text
                
                concursos.append({
                    "orgao": orgao.upper(),
                    "cidade": extrair_cidade(texto_completo),
                    "status": "Aberto",
                    "cargos": "Consultar Edital",
                    "salario_min": 1412.00, # Valor padrão do salário mínimo
                    "salario_max": extrair_valor(texto_completo),
                    "escolaridade": extrair_escolaridade(texto_completo),
                    "valor_inscricao": 0.0,
                    "data_prova": None,
                    "link_oficial": link_tag['href'],
                    "link_inscricao": link_tag['href']
                })
    except: pass
    return concursos

if __name__ == "__main__":
    lista = scraper_g1()
    if lista:
        salvar_no_banco(lista)