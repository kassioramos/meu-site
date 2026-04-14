from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = FastAPI()

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROTA RAIZ
@app.get("/")
async def root():
    return {"status": "Online", "message": "Concursos Maranhão API"}

# ROTA HEALTH
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def get_db_connection():
    # Certifique-se de que a variável DATABASE_URL esteja configurada no Render
    conn = psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
    return conn

# ROTA 1: Listar todos os concursos (VERSÃO CORRIGIDA)
@app.get("/concursos")
async def listar_concursos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT id, orgao, status, cargos, salario_min, 
            COALESCE(salario_max, 0) as salario_max, 
            escolaridade, link_oficial, link_inscricao, 
            COALESCE(cidade, 'Maranhão') as cidade 
            FROM concursos 
            ORDER BY id DESC
        """
        cursor.execute(query)
        dados = cursor.fetchall()
        
        cursor.close()
        return {"items": dados, "total": len(dados)}
    
    except Exception as e:
        print(f"Erro no banco: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no banco: {str(e)}")
    
    finally:
        if conn:
            conn.close()

# ROTA 2: Buscar detalhes de um concurso por ID
@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        cursor.close()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
        return concurso
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Erro ao buscar ID: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor")
    
    finally:
        if conn:
            conn.close()