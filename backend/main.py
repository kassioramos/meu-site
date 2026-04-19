from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random

# 1. INICIALIZAÇÃO ÚNICA (O nome deve ser 'app' para a Vercel)
app = FastAPI()

# 2. CONFIGURAÇÃO DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FUNÇÃO DE SEO DINÂMICO ---
def gerar_descricao_seo(concurso):
    orgao = str(concurso.get('orgao', '')).title()
    cidade = str(concurso.get('cidade', 'Maranhão')).title()
    
    # Tratando a coluna "Banca" vinda do Supabase
    banca_raw = concurso.get('Banca') or concurso.get('banca') or ''
    banca_db = str(banca_raw).strip()

    if not banca_db or banca_db.lower() in ['nulo', 'null', 'none', '']:
        banca_final = "comissão própria da instituição"
    else:
        banca_final = f"organização de {banca_db}"

    intros = [
        f"Excelente oportunidade aberta no órgão {orgao} sob {banca_final}.",
        f"O edital para {orgao} em {cidade} já está disponível para consulta, organizado por {banca_final}.",
        f"Quem busca estabilidade no Maranhão deve conferir a vaga para {orgao} ({banca_final})."
    ]
    
    detalhes = ""
    salario = concurso.get('salario_max', 0)
    
    if salario and salario > 5000:
        detalhes += f" Com remuneração atrativa de R$ {salario:.2f}, este certame é um dos destaques na região."
    elif salario and salario > 0:
        detalhes += f" O processo seletivo oferece vencimentos de até R$ {salario:.2f}."
    else:
        detalhes += " A remuneração detalhada e os benefícios podem ser conferidos diretamente no edital oficial."

    ctas = [
        " Fique atento aos prazos e não perca o período de inscrição.",
        " Prepare-se com antecedência para garantir sua vaga neste concurso.",
        " Verifique os requisitos de escolaridade e cargos no documento anexo."
    ]

    return f"{random.choice(intros)}{detalhes}{random.choice(ctas)}"

# --- CONEXÃO COM O BANCO DE DADOS ---
def get_db_connection():
    # Certifique-se de que a variável DATABASE_URL está configurada na Vercel
    conn = psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
    return conn

# ROTA RAIZ
@app.get("/")
async def root():
    return {"status": "Online", "message": "Concursos Maranhão API"}

# ROTA HEALTH
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ROTA 1: Listar todos os concursos
@app.get("/concursos")
async def listar_concursos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # SQL ajustado para pegar as colunas novas que seu robô está extraindo
        query = """
            SELECT DISTINCT ON (orgao) 
            id, orgao, status, cargos, salario_min, 
            COALESCE(salario_max, 0) as salario_max, 
            escolaridade, link_oficial, link_inscricao, 
            COALESCE(cidade, 'Maranhão') as cidade,
            "Banca", data_prova, fim_inscricao
            FROM concursos 
            ORDER BY orgao, id DESC
        """
        cursor.execute(query)
        dados = cursor.fetchall()
        
        for item in dados:
            item["descricao_seo"] = gerar_descricao_seo(item)
            item["orgao"] = str(item["orgao"]).title()

        cursor.close()
        conn.close()
        return {"items": dados, "total": len(dados)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no banco: {str(e)}")

# ROTA 2: Detalhes específicos
@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT *, "Banca" FROM concursos WHERE id = %s', (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
            
        concurso["descricao_seo"] = gerar_descricao_seo(concurso)

        cursor.close()
        conn.close()
        return concurso
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno no servidor")