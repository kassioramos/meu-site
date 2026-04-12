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

def get_db_connection():
    # Ele vai pegar aquela DATABASE_URL que vc configurou no Render
    conn = psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
    return conn

# ROTA 1: Listar todos (Essa é a que vc quer ver no navegador)
@app.get("/concursos")
async def listar_concursos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos")
        dados = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"items": dados, "total": len(dados)}
    except Exception as e:
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