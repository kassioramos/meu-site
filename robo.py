import requests
from bs4 import BeautifulSoup
import mysql.connector
import hashlib
from datetime import datetime

# --- 1. CONFIGURAÇÕES DO SEU BANCO DE DADOS ---
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '2010mariano', # <--- COLOQUE SUA SENHA DO MYSQL AQUI
    'database': 'concursos_maranhao'
}

def gerar_hash(texto):
    """Cria um ID único para evitar duplicatas no banco."""
    return hashlib.sha256(texto.encode('utf-8')).hexdigest()

def salvar_no_banco(concursos):
    """Conecta ao MySQL e insere os editais novos."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        novos_inseridos = 0

        for c in concursos:
            # SQL baseado na sua tabela 'editais'
            sql = """INSERT IGNORE INTO editais 
                     (orgao, status, cargos, salario_max, data_prova, link_oficial, hash_edital) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s)"""
            
            hash_id = gerar_hash(c['link_oficial'])
            
            # Preparando os valores (salario_max e data_prova começam nulos/zero)
            vals = (
                c['orgao'][:255], 
                c['status'], 
                c['cargos'], 
                0.00,  # salario_max inicial
                None,  # data_prova inicial
                c['link_oficial'], 
                hash_id
            )
            
            cursor.execute(sql, vals)
            if cursor.rowcount > 0:
                novos_inseridos += 1
        
        conn.commit()
        print(f"\n[BANCO] Sucesso: {novos_inseridos} novos editais adicionados.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[ERRO BANCO] {e}")

# --- 2. RASTREADORES (SCRAPERS) ---

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
        # O PCI lista concursos dentro de classes específicas
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
    print("=== INICIANDO SISTEMA DE RASTREAMENTO - CONCURSOS MA ===\n")
    
    lista_geral = []
    
    # Coletando de todas as fontes
    lista_geral.extend(scraper_sousandrade())
    lista_geral.extend(scraper_pci())
    lista_geral.extend(scraper_doema())
    
    if lista_geral:
        print(f"\nTotal de editais capturados nas fontes: {len(lista_geral)}")
        salvar_no_banco(lista_geral)
    else:
        print("\nNenhum concurso encontrado nas fontes no momento.")
    
    print("\n=== PROCESSO FINALIZADO ===")