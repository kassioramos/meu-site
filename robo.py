import requests
from bs4 import BeautifulSoup
import psycopg2
import hashlib
import re
from datetime import datetime

# --- CONFIG SUPABASE ---
DATABASE_URL = "postgresql://postgres.mczmhvuxujvhrudqmpvg:ANTONIOCASSIO2010Mariano@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# --- AUXILIARES DE FORMATAÇÃO ---
def formatar_data_para_sql(data_str):
    """Converte dd/mm/aaaa para aaaa-mm-dd para o PostgreSQL"""
    if not data_str:
        return None
    try:
        # Tenta converter o formato brasileiro para o formato de banco
        return datetime.strptime(data_str, "%d/%m/%Y").strftime("%Y-%m-%d")
    except:
        return None

# --- FUNÇÃO DE EXTRAÇÃO COMPLETA (INTEGRADA) ---
def extrair_detalhes_completos(texto):
    texto_upper = texto.upper()
    
    # 1. Extrair Cidade
    cidades_ma = ["SÃO LUÍS", "IMPERATRIZ", "CAXIAS", "BACABAL", "TIMON", "AÇAILÂNDIA", "BALSAS", "CODÓ", "COELHO NETO", "PINHEIRO", "SANTA INÊS", "CHAPADINHA", "CAJARI", "PAÇO DO LUMIAR", "SÃO JOSÉ DE RIBAMAR"]
    cidade_encontrada = "Maranhão"
    for cidade in cidades_ma:
        if cidade in texto_upper:
            cidade_encontrada = cidade.title()
            break

    # 2. Extrair Banca
    bancas_comuns = r"(FCC|FGV|CEBRASPE|CESPE|VUNESP|SOUSÂNDRADE|FSADU|FUNCERN|INSTITUTO AOCP|LEGATUS|LJ ASSESSORIA)"
    banca_match = re.search(bancas_comuns, texto_upper)
    banca = banca_match.group(1) if banca_match else "A definir"

    # 3. Extrair Escolaridade
    escolaridade_niveis = []
    if "SUPERIOR" in texto_upper: escolaridade_niveis.append("Superior")
    if "MÉDIO" in texto_upper or "MEDIO" in texto_upper: escolaridade_niveis.append("Médio")
    if "FUNDAMENTAL" in texto_upper: escolaridade_niveis.append("Fundamental")
    escolaridade = "/ ".join(escolaridade_niveis) if escolaridade_niveis else "Ver Edital"

    # 4. Extrair Data da Prova
    data_prova_match = re.search(r"(?:prova|data da prova|avaliação).*?(\d{2}/\d{2}/\d{4})", texto_upper, re.IGNORECASE | re.DOTALL)
    data_prova = data_prova_match.group(1) if data_prova_match else None

    # 5. Extrair Período de Inscrição
    datas_inscricao = re.findall(r"(\d{2}/\d{2}/\d{4})", texto)
    inicio_insc = None
    fim_insc = None
    
    if len(datas_inscricao) >= 2:
        inicio_insc = datas_inscricao[0]
        fim_insc = datas_inscricao[1]
    elif len(datas_inscricao) == 1:
        fim_insc = datas_inscricao[0]

    # 6. Extrair Valor da Inscrição e Salário Máximo
    valor_match = re.search(r"(?:inscrição|taxa|valor).*?R\$\s?(\d[\d.,]+)", texto_upper, re.IGNORECASE)
    valor_insc = 0.0
    if valor_match:
        valor_insc = float(valor_match.group(1).replace('.', '').replace(',', '.'))

    salario_match = re.findall(r"R\$\s?(\d[\d.,]+)", texto_upper)
    sal_max = 0.0
    if salario_match:
        # Pegamos o maior valor encontrado no texto para ser o salário máximo
        valores = [float(v.replace('.', '').replace(',', '.')) for v in salario_match]
        sal_max = max(valores)

    return {
        "cidade": cidade_encontrada,
        "banca": banca,
        "escolaridade": escolaridade,
        "data_prova": formatar_data_para_sql(data_prova),
        "inicio_inscricao": formatar_data_para_sql(inicio_insc),
        "fim_inscricao": formatar_data_para_sql(fim_insc),
        "valor_inscricao": valor_insc,
        "salario_max": sal_max
    }

# --- GERAR HASH ---
def gerar_hash(orgao, cidade, link):
    string_unica = f"{orgao}{cidade}{link}".upper().strip()
    return hashlib.sha256(string_unica.encode('utf-8')).hexdigest()

# --- SALVAR NO BANCO ---
def salvar_no_banco(concursos):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        novos = 0

        # SQL atualizado com as novas colunas
        sql = """INSERT INTO concursos 
        (orgao, cidade, status, cargos, salario_min, salario_max, escolaridade, valor_inscricao, 
         data_prova, inicio_inscricao, fim_inscricao, banca, link_oficial, link_inscricao, hash_edital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (hash_edital) DO UPDATE SET
        status = EXCLUDED.status,
        fim_inscricao = EXCLUDED.fim_inscricao,
        salario_max = GREATEST(concursos.salario_max, EXCLUDED.salario_max);"""

        for c in concursos:
            hash_id = gerar_hash(c['orgao'], c['cidade'], c['link_oficial'])

            vals = (
                c['orgao'][:255],
                c['cidade'],
                c['status'],
                c['cargos'],
                c.get('salario_min', 1412.00),
                c.get('salario_max', 0.0),
                c['escolaridade'],
                c.get('valor_inscricao', 0.0),
                c.get('data_prova'),
                c.get('inicio_inscricao'),
                c.get('fim_inscricao'),
                c.get('banca', 'A definir'),
                c['link_oficial'],
                c['link_inscricao'],
                hash_id
            )
            cursor.execute(sql, vals)
            if cursor.rowcount > 0: novos += 1

        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ {novos} registros processados no Supabase.")
    except Exception as e:
        print("❌ ERRO BANCO:", e)

# --- SCRAPER G1 ---
def scraper_g1():
    print("🔎 Minerando G1 Maranhão...")
    url = "https://g1.globo.com/ma/maranhao/concursos-e-emprego/"
    concursos = []
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        for item in soup.select('.feed-post-body'):
            link_tag = item.find('a')
            if link_tag:
                resumo_tag = item.select_one('.feed-post-header-chapeu')
                orgao_nome = resumo_tag.text.strip() if resumo_tag else link_tag.text.strip()
                
                # Extraímos tudo do texto do post
                dados_extras = extrair_detalhes_completos(item.text)
                
                concursos.append({
                    "orgao": orgao_nome.upper(),
                    "cidade": dados_extras['cidade'],
                    "status": "Aberto",
                    "cargos": "Consultar Edital",
                    "salario_min": 1412.00,
                    "salario_max": dados_extras['salario_max'],
                    "escolaridade": dados_extras['escolaridade'],
                    "valor_inscricao": dados_extras['valor_inscricao'],
                    "data_prova": dados_extras['data_prova'],
                    "inicio_inscricao": dados_extras['inicio_inscricao'],
                    "fim_inscricao": dados_extras['fim_inscricao'],
                    "banca": dados_extras['banca'],
                    "link_oficial": link_tag['href'],
                    "link_inscricao": link_tag['href']
                })
    except Exception as e:
        print(f"Erro no Scraper: {e}")
    
    return concursos

if __name__ == "__main__":
    lista_concursos = scraper_g1()
    if lista_concursos:
        salvar_no_banco(lista_concursos)