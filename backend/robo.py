import requests
from bs4 import BeautifulSoup
import psycopg2
import hashlib
import re
import os
from datetime import datetime

# Importações para o Selenium
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIG SUPABASE ---
DATABASE_URL = "postgresql://postgres.mczmhvuxujvhrudqmpvg:ANTONIOCASSIO2010Mariano@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Adicione esta função no topo do seu arquivo para padronizar as bancas
def normalizar_nome(texto):
    if not texto: return "A definir"
    return " ".join(texto.split()).strip()

def scraper_jk():
    print("🔎 Verificando Instituto JK Maranhão...")
    url = "https://institutojkma.org/"
    concursos = []
    try:
        res = requests.get(url, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        for link_tag in soup.find_all('a', href=True):
            # Capturamos o texto original do link
            texto_original = link_tag.text.strip().upper()
            
            # Verificamos se o link parece ser de um concurso/seletivo
            # Filtramos links muito curtos ou irrelevantes
            if "CONCURSO" in link_tag['href'].lower() and len(texto_original) > 5:
                concursos.append({
                    "orgao": normalizar_nome(texto_original.replace('\n', ' ')),
                    "cidade": "Maranhão", 
                    "status": "Aberto",
                    "cargos": "Consultar Edital", 
                    "escolaridade": "Ver Edital",
                    # FIXO: Forçamos o nome que existe na tabela 'questoes'
                    "banca": "Instituto JK", 
                    "link_oficial": link_tag['href'].strip(),
                    "link_inscricao": link_tag['href'].strip()
                })
    except Exception as e:
        print(f"Erro no Scraper JK: {e}")
    return concursos

# --- AUXILIARES ---
def formatar_data_para_sql(data_str):
    if not data_str: return None
    try:
        return datetime.strptime(data_str.strip(), "%d/%m/%Y").strftime("%Y-%m-%d")
    except:
        return None

def gerar_hash(orgao, link):
    string_unica = f"{orgao}{link}".upper().strip()
    return hashlib.sha256(string_unica.encode('utf-8')).hexdigest()

# --- NOVO: FILTRO DE QUALIDADE ---
def filtrar_concursos_validos(lista):
    validos = []
    # Lista de termos que indicam que o dado é genérico ou lixo
    termos_proibidos = ["CONCURSOS ABERTOS", "CONCURSOS PREVISTOS", "DIÁRIO OFICIAL", "EDIÇÃO DO DIA", "ENCERRADOS"]
    
    for c in lista:
        orgao = c.get('orgao', '').upper()
        banca = c.get('banca', '').upper()
        
        # 1. Ignora se o nome do órgão for genérico
        if any(termo in orgao for termo in termos_proibidos):
            continue
            
        # 2. Ignora se a banca não estiver definida ou for genérica
        if not banca or banca in ["A DEFINIR", "GOVERNO DO MARANHÃO", "NULL", "NONE"]:
            continue
            
        # 3. Garante que tem um link mínimo
        if not c.get('link_oficial') or len(c['link_oficial']) < 10:
            continue
            
        validos.append(c)
    return validos

# --- SALVAR NO BANCO ---
def salvar_no_banco(concursos):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        novos = 0

        sql = """INSERT INTO concursos 
        (orgao, cidade, status, cargos, salario_min, salario_max, escolaridade, valor_inscricao, 
         data_prova, inicio_inscricao, fim_inscricao, banca, link_oficial, link_inscricao, hash_edital)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (hash_edital) DO NOTHING;"""

        for c in concursos:
            hash_id = gerar_hash(c['orgao'], c['link_oficial'])
            
            vals = (
                c['orgao'][:255], c['cidade'], c['status'], c['cargos'],
                c.get('salario_min', 1412.00), c.get('salario_max', 0.0),
                c['escolaridade'], c.get('valor_inscricao', 0.0),
                c.get('data_prova'), c.get('inicio_inscricao'), c.get('fim_inscricao'),
                c.get('banca'), c['link_oficial'], c['link_inscricao'], hash_id
            )
            cursor.execute(sql, vals)
            if cursor.rowcount > 0: novos += 1

        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ Processamento concluído: {novos} novos concursos concretos adicionados.")
    except Exception as e:
        print("❌ ERRO NO BANCO:", e)

# --- SCRAPERS BANCAS ---
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
            if "MA" in nome.upper() or "MARANHÃO" in nome.upper():
                concursos.append({
                    "orgao": nome.upper(), "cidade": "Maranhão", "status": "Aberto",
                    "cargos": "Consultar Edital", "escolaridade": "Ver Edital",
                    "banca": "Instituto Legatus", "link_oficial": link, "link_inscricao": link
                })
    except: pass
    return concursos

def scraper_aocp():
    print("🔎 Verificando Instituto AOCP...")
    url = "https://www.institutoaocp.org.br/concursos.jsp"
    concursos = []
    try:
        res = requests.get(url, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        for item in soup.select('.concurso-item'):
            link_tag = item.find('a')
            if link_tag:
                link = "https://www.institutoaocp.org.br/" + link_tag['href']
                nome = item.find(class_=re.compile("titulo|nome")).text.strip()
                if "MA" in nome.upper():
                    concursos.append({
                        "orgao": nome.upper(), "cidade": "Maranhão", "status": "Aberto",
                        "cargos": "Consultar Edital", "escolaridade": "Ver Edital",
                        "banca": "Instituto AOCP", "link_oficial": link, "link_inscricao": link
                    })
    except: pass
    return concursos

def scraper_jk():
    print("🔎 Verificando Instituto JK Maranhão...")
    url = "https://institutojkma.org/"
    concursos = []
    try:
        res = requests.get(url, timeout=15)
        soup = BeautifulSoup(res.text, 'html.parser')
        for link_tag in soup.find_all('a', href=True):
            texto = link_tag.text.strip().upper()
            # Filtro básico direto na captura para evitar links vázios
            if "CONCURSO" in link_tag['href'].lower() and len(texto) > 5:
                concursos.append({
                    "orgao": texto,
                    "cidade": "Maranhão", "status": "Aberto",
                    "cargos": "Consultar Edital", "escolaridade": "Ver Edital",
                    "banca": "Instituto JK", "link_oficial": link_tag['href'], "link_inscricao": link_tag['href']
                })
    except: pass
    return concursos

def scraper_doe_selenium():
    print("🔎 Analisando Diário Oficial (DOE-MA)...")
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        concursos_doe = []
        driver.get("https://diariooficial.ma.gov.br/")
        wait = WebDriverWait(driver, 25)
        links_pdf = wait.until(EC.presence_of_all_elements_located((By.XPATH, "//a[contains(@href, '.pdf')]")))

        for link in links_pdf:
            url_pdf = link.get_attribute("href")
            texto_link = link.text.upper()
            # Só pega se tiver palavras-chave de edital real, não apenas "Diário"
            if any(x in texto_link for x in ["EDITAL", "PROCESSO SELETIVO", "SELETIVO"]):
                concursos_doe.append({
                    "orgao": texto_link,
                    "cidade": "Maranhão", "status": "Publicado",
                    "cargos": "Verificar no PDF", "escolaridade": "Ver Edital",
                    "banca": "Comissão Própria", "link_oficial": url_pdf, "link_inscricao": url_pdf
                })
        driver.quit()
        return concursos_doe
    except:
        return []

# --- EXECUTOR ATUALIZADO ---
if __name__ == "__main__":
    lista_suja = []
    
    # Busca em todas as fontes
    lista_suja.extend(scraper_legatus())
    lista_suja.extend(scraper_aocp())
    lista_suja.extend(scraper_jk())
    lista_suja.extend(scraper_doe_selenium())
    
    # Aplica o filtro de "coisas concretas"
    lista_final = filtrar_concursos_validos(lista_suja)
    
    if lista_final:
        salvar_no_banco(lista_final)
    else:
        print("📭 Nada novo ou concreto encontrado nas fontes hoje.")