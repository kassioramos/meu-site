from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random

# 1. INICIALIZAÇÃO
app = FastAPI()

# 2. CONFIGURAÇÃO DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. FUNÇÃO DE SEO DINÂMICO
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

# 4. CONEXÃO COM O BANCO DE DADOS
def get_db_connection():
    # Certifique-se de que a variável DATABASE_URL está configurada na Vercel
    return psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)

# 5. ROTAS
@app.get("/")
async def root():
    return {"status": "Online", "message": "Concursos Maranhão API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/concursos")
async def listar_concursos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                id, orgao, status, cargos, cidade, escolaridade, "Banca",
                salario_min, salario_max, 
                valor_inscricao_min, valor_inscricao_max,
                inicio_inscricao, fim_inscricao, data_prova,
                link_oficial, link_inscricao
            FROM concursos 
            ORDER BY fim_inscricao ASC, orgao ASC
        """
        cursor.execute(query)
        dados = cursor.fetchall()
        
        for item in dados:
            item["descricao_seo"] = gerar_descricao_seo(item)
            # Padronização para o frontend encontrar tanto 'Banca' quanto 'banca'
            item["banca"] = item.get("Banca") 

        cursor.close()
        conn.close()
        return {"items": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Usando aspas duplas em "Banca" por ser Case Sensitive no PostgreSQL
        cursor.execute('SELECT *, "Banca" FROM concursos WHERE id = %s', (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
            
        concurso["descricao_seo"] = gerar_descricao_seo(concurso)
        concurso["banca"] = concurso.get("Banca")

        cursor.close()
        conn.close()
        return concurso
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno no servidor")