from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random  # Import necessário para o sorteio das frases

app = FastAPI()

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FUNÇÃO DE SEO DINÂMICO ---
def gerar_descricao_seo(concurso):
    # Formata o órgão e cidade para não ficarem em CAIXA ALTA
    orgao = str(concurso['orgao']).title()
    cidade = str(concurso['cidade']).title()
    
    intros = [
        f"Excelente oportunidade aberta no órgão {orgao}.",
        f"O edital para {orgao} em {cidade} já está disponível para consulta.",
        f"Quem busca estabilidade no Maranhão deve conferir a vaga para {orgao}."
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

# ROTA RAIZ
@app.get("/")
async def root():
    return {"status": "Online", "message": "Concursos Maranhão API"}

# ROTA HEALTH
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def get_db_connection():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
    return conn

# ROTA 1: Listar todos os concursos (COM DISTINCT E SEO)
@app.get("/concursos")
async def listar_concursos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # SQL atualizado: 
        # 1. DISTINCT ON (orgao) evita repetir o mesmo órgão várias vezes seguidas
        # 2. Ordenamos por orgao e depois ID para o DISTINCT funcionar
        query = """
            SELECT DISTINCT ON (orgao) 
            id, orgao, status, cargos, salario_min, 
            COALESCE(salario_max, 0) as salario_max, 
            escolaridade, link_oficial, link_inscricao, 
            COALESCE(cidade, 'Maranhão') as cidade 
            FROM concursos 
            ORDER BY orgao, id DESC
        """
        cursor.execute(query)
        dados = cursor.fetchall()
        
        # Aplicando a descrição dinâmica para cada item
        for item in dados:
            item["descricao_seo"] = gerar_descricao_seo(item)
            # Aproveitamos para limpar o título do órgão aqui também
            item["orgao"] = str(item["orgao"]).title()

        cursor.close()
        conn.close()
        
        return {"items": dados, "total": len(dados)}
    except Exception as e:
        print(f"Erro no banco: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no banco: {str(e)}")

# ROTA 2: Buscar detalhes (COM SEO)
@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        
        if concurso:
            concurso["descricao_seo"] = gerar_descricao_seo(concurso)

        cursor.close()
        conn.close()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
        return concurso
    except Exception as e:
        print(f"Erro ao buscar ID: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor")