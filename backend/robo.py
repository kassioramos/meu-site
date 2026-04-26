import requests
from bs4 import BeautifulSoup
import psycopg2
import hashlib
import re
import os
from datetime import datetime

# --- CONFIG SUPABASE ---
# Use a Connection String da porta 5432 ou 6543 do Supabase
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres.mczmhvuxujvhrudqmpvg:ANTONIOCASSIO2010Mariano@aws-1-us-east-1.pooler.supabase.com:5432/postgres")

def normalizar_nome(texto):
    if not texto: return "A definir"
    return " ".join(texto.split()).strip()

# --- AUXILIARES ---
def formatar_data_para_sql(data_str):
    if not data_str: return None
    try:
        # Tenta converter o formato brasileiro para o formato ISO do Postgres
        return datetime.strptime(data_str.strip(), "%d/%m/%Y").strftime("%Y-%m-%d")
    except:
        return None

def gerar_hash(orgao, link):
    string_unica = f"{orgao}{link}".upper().strip()
    return hashlib.sha256(string_unica.encode('utf-8')).hexdigest()

def filtrar_concursos_validos(lista):
    validos = []
    termos_proibidos = ["CONCURSOS ABERTOS", "CONCURSOS PREVISTOS", "DIÁRIO OFICIAL", "EDIÇÃO DO DIA", "ENCERRADOS"]
    
    for c in lista:
        orgao = c.get('orgao', '').upper()
        banca = c.get('banca', '').upper()
        
        if any(termo in orgao for termo in termos_proibidos): continue
        if not banca or banca in ["A DEFINIR", "GOVERNO DO MARANHÃO", "NULL", "NONE"]: continue
        if not c.get('link_oficial') or len(c['link_oficial']) < 10: continue
            
        validos.append(c)
    return validos

# --- SALVAR NO BANCO ---
def salvar_no_banco(concursos):
    conn = None
    try:
        # Adicionado sslmode='require' para garantir conexão com o Supabase
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cursor = conn.cursor()
        novos = 0

        sql = """INSERT INTO concursos 
        (orgao, cidade, status, cargos, salario_min, salario_max, escolaridade, valor_inscricao, 
         data_prova, inicio_inscricao, fim_inscricao, banca, link_oficial, link_inscricao, hash_edital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (hash_edital) DO UPDATE SET
            status = EXCLUDED.status,
            link_oficial = EXCLUDED.link_oficial;"""

        for c in concursos:
            hash_id = gerar_hash(c['orgao'], c['link_oficial'])
            
            # Garantir que valores numéricos não sejam None/vazios
            s_min = c.get('salario_min') if c.get('salario_min') else 1412.00
            s_max = c.get('salario_max') if c.get('salario_max') else 0.0
            v_insc = c.get('valor_inscricao') if c.get('valor_inscricao') else 0.0

            vals = (
                c['orgao'][:255], 
                c['cidade'][:100], 
                c['status'][:50], 
                c['cargos'],
                s_min, 
                s_max,
                c['escolaridade'][:100], 
                v_insc,
                formatar_data_para_sql(c.get('data_prova')), 
                formatar_data_para_sql(c.get('inicio_inscricao')), 
                formatar_data_para_sql(c.get('fim_inscricao')),
                c.get('banca', 'A definir'), 
                c['link_oficial'], 
                c['link_inscricao'], 
                hash_id
            )
            cursor.execute(sql, vals)
            if cursor.rowcount > 0: novos += 1

        conn.commit()
        print(f"✅ Sucesso: {novos} concursos processados no Supabase.")
    except Exception as e:
        if conn: conn.rollback()
        print("❌ ERRO NO SUPABASE:", e)
    finally:
        if conn:
            cursor.close()
            conn.close()

# --- SCRAPERS (Exemplo resumido, mantenha sua lógica de extração) ---
def scraper_legatus():
    print("🔎 Verificando Instituto Legatus...")
    url = "https://legatus.org.br/"
    concursos = []
    try:
        res = requests.get(url, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        for box in soup.select('.curso-box'):
            link = box.find('a')['href']
            nome = box.find('h3').text.strip()
            if any(x in nome.upper() for x in ["MA", "MARANHÃO"]):
                concursos.append({
                    "orgao": normalizar_nome(nome.upper()), "cidade": "Maranhão", "status": "Aberto",
                    "cargos": "Consultar Edital", "escolaridade": "Ver Edital",
                    "banca": "Instituto Legatus", "link_oficial": link, "link_inscricao": link
                })
    except: pass
    return concursos

# --- EXECUTOR ---
if __name__ == "__main__":
    lista_total = []
    lista_total.extend(scraper_legatus())
    # Adicione os outros scrapers aqui...
    
    lista_final = filtrar_concursos_validos(lista_total)
    
    if lista_final:
        salvar_no_banco(lista_final)
    else:
        print("📭 Nada novo para o Maranhão hoje.")