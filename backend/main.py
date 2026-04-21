from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal

app = FastAPI()

# Permite que a Vercel acesse o Render sem bloqueios
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Converte formatos chatos do banco (datas/decimais) para texto/número simples
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
    return {"status": "online", "tabelas": ["concursos", "questoes"]}

# --- 1. ROTA DE QUESTÕES (O QUE VOCÊ QUER RESOLVER) ---
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # O ILIKE ajuda a achar mesmo se houver erro de maiúscula ou espaços
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

# --- 2. ROTA DE CONCURSOS (PARA VOLTAR OS CARDS E O DASHBOARD) ---
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
        return {"items": dados} # O frontend na Vercel exige o nome "items"
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# --- 3. ROTA DE DETALHES (PARA VOLTAR A PÁGINA DE DETALHES) ---
@app.get("/concursos/{concurso_id}")
def detalhe_concurso(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        if not concurso:
            raise HTTPException(status_code=404, detail="Não encontrado")
        for k, v in concurso.items():
            concurso[k] = serializar(v)
        return concurso
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()