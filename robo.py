import requests
from bs4 import BeautifulSoup
import psycopg2  # Mudamos de mysql para psycopg2 para usar o Supabase
import hashlib
from datetime import datetime

# --- 1. CONFIGURAÇÃO DO SUPABASE ---
# Use a DATABASE_URL que você configurou no Render (SEM os colchetes na senha)
DATABASE_URL = "postgresql://postgres.mczmhvuxujvhrudqmpvg:ANTONIOCASSIO2010Mariano@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

def gerar_hash(texto):
    """Cria um ID único para evitar duplicatas no banco."""
    return hashlib.sha256(texto.encode('utf-8')).hexdigest()

def salvar_no_banco(concursos):
    """Conecta ao PostgreSQL (Supabase) e insere os editais novos."""
    try:
        # Conexão direta com a URL do Supabase
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        novos_inseridos = 0

        for c in concursos:
            # SQL para a tabela 'concursos' (nome que você criou no Supabase)
            sql = """INSERT INTO concursos 
                     (orgao, status, cargos, salario_max, link_oficial, hash_edital) 
                     VALUES (%s, %s, %s, %s, %s, %s)
                     ON CONFLICT (hash_edital) DO NOTHING"""
            
            hash_id = gerar_hash(c['link_oficial'])
            
            vals = (
                c['orgao'][:255], 
                c['status'], 
                c['cargos'], 
                0.00, 
                c['link_oficial'], 
                hash_id
            )
            
            cursor.execute(sql, vals)
            if cursor.rowcount > 0:
                novos_inseridos += 1
        
        conn.commit()
        print(f"\n[BANCO] Sucesso: {novos_inseridos} novos editais adicionados ao Supabase.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[ERRO BANCO] {e}")

# --- 2. RASTREADORES (Mantive seus scrapers que já estão funcionando) ---

def scraper_sousandrade():
    print("-> Rastreando Fundação Sousândrade...")
    url = "https://www.fsadu.org.br/c/concursos/index.php"
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        concursos = []
        for link in soup.find_all('a', href=True):
            texto = link.text.strip().upper()
            if any(p in texto for p in ["PREFEITURA", "SELETIVO", "CÂMARA", "ESTADUAL"]):
                concursos.append({
                    "orgao": texto,
                    "status": "Aberto",
                    "cargos": "Consulte o Edital",
                    "link_oficial": "https://www.fsadu.org.br/c/concursos/" + link['href']
                })
        return concursos
    except: return []

def scraper_pci():
    print("-> Rastreando PCI Concursos (Maranhão)...")
    url = "https://www.pciconcursos.com.br/concursos/nordeste/ma/"
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        concursos = []
        for item in soup.select('.ca > .me'):
            link_tag = item.find('a')
            if link_tag:
                concursos.append({
                    "orgao": link_tag.text.strip().upper(),
                    "status": "Aberto",
                    "cargos": "Vários cargos",
                    "link_oficial": link_tag['href']
                })
        return concursos
    except: return []

def scraper_doema():
    print("-> Rastreando Diário Oficial do Maranhão...")
    url = "http://ba.doema.ma.gov.br/index.php" 
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        res = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        concursos = []
        for link in soup.find_all('a', href=True):
            texto = link.text.strip().upper()
            if any(p in texto for p in ["EDITAL", "CONCURSO", "SELETIVO"]):
                concursos.append({
                    "orgao": "Governo do Estado (DOE-MA)",
                    "status": "Aberto",
                    "cargos": texto,
                    "link_oficial": "http://ba.doema.ma.gov.br/" + link['href'] if not link['href'].startswith('http') else link['href']
                })
        return concursos
    except: return []

# --- 3. EXECUÇÃO PRINCIPAL ---

if __name__ == "__main__":
    print("=== INICIANDO ROBÔ - ENVIANDO PARA O SUPABASE ===\n")
    lista_geral = []
    lista_geral.extend(scraper_sousandrade())
    lista_geral.extend(scraper_pci())
    lista_geral.extend(scraper_doema())
    
    if lista_geral:
        print(f"\nTotal de editais capturados: {len(lista_geral)}")
        salvar_no_banco(lista_geral)
    else:
        print("\nNenhum concurso encontrado nas fontes.")
    print("\n=== PROCESSO FINALIZADO ===")