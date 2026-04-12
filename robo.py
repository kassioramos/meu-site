import requests
from bs4 import BeautifulSoup
import psycopg2 
import hashlib
from datetime import datetime

# --- 1. CONFIGURAÇÃO DO SUPABASE ---
DATABASE_URL = "postgresql://postgres.mczmhvuxujvhrudqmpvg:ANTONIOCASSIO2010Mariano@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Lista Mestra de Termos
TERMOS_BUSCA = [
    "PREFEITURA", "MUNICIPAL", "CÂMARA", "LEGISLATIVO", 
    "ESTADUAL", "GOVERNO", "SELETIVO", "CONCURSO", 
    "EDITAL", "INSCRIÇÕES", "VAGAS", "MA", "MARANHÃO", 
    "SANEAMENTO", "SAÚDE", "EDUCAÇÃO", "GUARDA", 
    "AGENTE", "PROCESSO", "SIMPLIFICADO", "PSS", "UEMA"
]

# --- 2. FUNÇÕES DE APOIO ---

def gerar_hash(texto):
    return hashlib.sha256(texto.encode('utf-8')).hexdigest()

def buscar_links_reais(url_noticia):
    """Entra na matéria para buscar o link do edital ou inscrição"""
    try:
        res = requests.get(url_noticia, timeout=10)
        s = BeautifulSoup(res.text, 'html.parser')
        
        link_edital = url_noticia 
        link_inscricao = url_noticia

        links = s.find_all('a', href=True)
        for link in links:
            t = link.text.lower()
            h = link['href']
            
            # Busca link que pareça ser o edital
            if "edital" in t or h.endswith('.pdf'):
                link_edital = h
            # Busca link que pareça ser de inscrição
            if "inscri" in t or "clique aqui" in t or "página" in t:
                link_inscricao = h
                
        return link_edital, link_inscricao
    except:
        return url_noticia, url_noticia

def salvar_no_banco(concursos):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        novos_inseridos = 0
        for c in concursos:
            sql = """INSERT INTO concursos 
                     (orgao, status, cargos, salario_min, salario_max, escolaridade, link_oficial, link_inscricao, hash_edital) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                     ON CONFLICT (hash_edital) DO NOTHING"""
            
            hash_id = gerar_hash(c['link_oficial'])
            
            vals = (
                c.get('orgao', '')[:255], 
                c.get('status', 'Aberto'), 
                c.get('cargos', ''), 
                c.get('salario_min', 0.00),
                c.get('salario_max', 0.00),
                c.get('escolaridade', 'Não Informado'),
                c.get('link_oficial'), 
                c.get('link_inscricao'), 
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

# --- 3. RASTREADORES ---

def scraper_g1():
    print("-> Rastreando G1 Maranhão (Concursos)...")
    url = "https://g1.globo.com/ma/maranhao/concursos-e-emprego/"
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        concursos = []
        for item in soup.select('.feed-post-body'):
            link_tag = item.find('a')
            if link_tag:
                url_noticia = link_tag['href']
                texto = link_tag.text.strip().upper()
                
                if any(p in texto for p in TERMOS_BUSCA):
                    print(f"   - Investigando matéria: {texto[:40]}...")
                    # Aqui acontece a mágica: ele entra no G1 para buscar o link real
                    edital, inscricao = buscar_links_reais(url_noticia)
                    
                    concursos.append({
                        "orgao": texto[:100],
                        "status": "Aberto",
                        "cargos": "Veja detalhes na matéria",
                        "salario_min": 0.00,
                        "salario_max": 0.00,
                        "escolaridade": "Ver Edital",
                        "link_oficial": edital, 
                        "link_inscricao": inscricao
                    })
        return concursos
    except: return []

def scraper_sousandrade():
    print("-> Rastreando Fundação Sousândrade...")
    url = "https://www.fsadu.org.br/c/concursos/index.php"
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        concursos = []
        for link in soup.find_all('a', href=True):
            texto = link.text.strip().upper()
            if any(p in texto for p in TERMOS_BUSCA):
                url_final = "https://www.fsadu.org.br/c/concursos/" + link['href']
                concursos.append({
                    "orgao": texto,
                    "status": "Aberto",
                    "cargos": "Consulte o Edital",
                    "salario_min": 0.00,
                    "salario_max": 0.00,
                    "escolaridade": "Ver Edital",
                    "link_oficial": url_final,
                    "link_inscricao": url_final
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
                nome_orgao = link_tag.text.strip().upper()
                concursos.append({
                    "orgao": nome_orgao,
                    "status": "Aberto",
                    "cargos": "Vários cargos",
                    "salario_min": 0.00,
                    "salario_max": 0.00,
                    "escolaridade": "Ver no Site",
                    "link_oficial": link_tag['href'],
                    "link_inscricao": link_tag['href']
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
            if any(p in texto for p in TERMOS_BUSCA):
                url_final = "http://ba.doema.ma.gov.br/" + link['href'] if not link['href'].startswith('http') else link['href']
                concursos.append({
                    "orgao": "Governo do Estado (DOE-MA)",
                    "status": "Aberto",
                    "cargos": texto[:255],
                    "salario_min": 0.00,
                    "salario_max": 0.00,
                    "escolaridade": "Ver DOE",
                    "link_oficial": url_final,
                    "link_inscricao": url_final
                })
        return concursos
    except: return []

# --- 4. EXECUÇÃO PRINCIPAL ---

if __name__ == "__main__":
    print("=== INICIANDO ROBÔ - ENVIANDO PARA O SUPABASE ===\n")
    lista_geral = []
    
    # Rodando os scrapers
    lista_geral.extend(scraper_g1())
    lista_geral.extend(scraper_sousandrade())
    lista_geral.extend(scraper_pci())
    lista_geral.extend(scraper_doema())
    
    # TESTE MANUAL (Opcional, pode remover se quiser)
    lista_geral.append({
        "orgao": "TESTE DE CONEXÃO LUCAS",
        "status": "Aberto",
        "cargos": "Desenvolvedor Python",
        "salario_min": 1500.00,
        "salario_max": 8000.00,
        "escolaridade": "Superior",
        "link_oficial": "https://google.com/edital-" + datetime.now().strftime("%H%M"),
        "link_inscricao": "https://google.com/inscricao-" + datetime.now().strftime("%H%M")
    })
    
    if lista_geral:
        print(f"\nTotal de editais capturados: {len(lista_geral)}")
        salvar_no_banco(lista_geral)
    else:
        print("\nNenhum concurso encontrado nas fontes.")
    print("\n=== PROCESSO FINALIZADO ===")