from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal

app = FastAPI()

# Permite que a Vercel acesse os dados do Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Converte formatos do banco (como datas) para texto puro
def serializar(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return obj

def get_db_connection():
    return psycopg2.connect(os.environ.get("DATABASE_URL"), cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online", "tabelas_ativas": ["concursos", "questoes"]}

# --- AQUI ESTÁ O QUE FALTAVA PARA A TABELA QUESTOES ---
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Busca na tabela 'questoes' (conforme seu print do Supabase)
        if banca:
            cursor.execute("SELECT * FROM questoes WHERE banca ILIKE %s LIMIT 10", (f"%{banca.strip()}%",))
        else:
            cursor.execute("SELECT * FROM questoes LIMIT 10")
            
        dados = cursor.fetchall()
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        return dados
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# --- ROTA PARA A TABELA CONCURSOS (QUE JÁ FUNCIONAVA) ---
@app.get("/concursos")
def listar_concursos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos ORDER BY fim_inscricao ASC NULLS LAST")
        dados = cursor.fetchall()
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        return {"items": dados}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()