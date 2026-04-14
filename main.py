from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "online"}

def get_db_connection():
    # Pega a URL do Render
    conn = psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
    return conn

# ROTA 1: Listar todos - CORRIGIDA
@app.get("/concursos")
async def listar_concursos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # SQL ajustado para garantir que a coluna 'cidade' não venha vazia
        query = """
            SELECT id, orgao, status, cargos, salario_min, salario_max, 
            escolaridade, link_oficial, link_inscricao, 
            COALESCE(cidade, 'Maranhão') as cidade 
            FROM concursos 
            ORDER BY id DESC
        """
        cursor.execute(query)
        dados = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"items": dados, "total": len(dados)}
    except Exception as e:
        # Importante para você ver o erro real nos logs do Render
        print(f"Erro no banco: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no banco: {str(e)}")

# ROTA 2: Buscar por ID
@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
        return concurso
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro interno")