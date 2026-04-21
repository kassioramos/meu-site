from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = FastAPI()

# Permite que seu site na Vercel fale com este servidor no Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    # Puxa a URL que você configurou no painel do Render
    return psycopg2.connect(os.environ.get("DATABASE_URL"), cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online"}

@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if banca:
            # Busca ignorando maiúsculas/minúsculas
            cursor.execute("SELECT * FROM questoes WHERE banca ILIKE %s LIMIT 10", (f"%{banca}%",))
        else:
            cursor.execute("SELECT * FROM questoes LIMIT 10")
            
        questoes = cursor.fetchall()
        cursor.close()
        return questoes
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn:
            conn.close()