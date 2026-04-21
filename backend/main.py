from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal
import uuid

app = FastAPI()

# --- Configuração de CORS (Essencial para Vercel -> Render) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serializar(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    return obj

def get_db_connection():
    return psycopg2.connect(os.environ.get("DATABASE_URL"), cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online", "msg": "API Concursos Maranhão Pro"}

# --- 1. ROTA DE QUESTÕES (A que está dando erro) ---
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Selecionamos id, banca, enunciado, disciplina, opcoes e alternativa_correta
        sql_base = 'SELECT id, banca, enunciado, disciplina, opcoes, alternativa_correta FROM questoes'
        
        if banca:
            # O segredo: TRIM remove espaços invisíveis e ILIKE ignora MAIÚSCULAS/minúsculas
            # Buscamos por partes do nome para garantir que 'Instituto JK' funcione
            termo_busca = f"%{banca.strip()}%"
            cursor.execute(f"{sql_base} WHERE banca ILIKE %s LIMIT 50", (termo_busca,))
        else:
            cursor.execute(f"{sql_base} LIMIT 50")
            
        dados = cursor.fetchall()
        
        # Converte formatos especiais para JSON
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        
        return dados
    except Exception as e:
        print(f"ERRO NO BACKEND: {e}")
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# --- 2. ROTA DE CONCURSOS ---
@app.get("/concursos")
def listar_concursos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM concursos ORDER BY id DESC')
        dados = cursor.fetchall()
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        return {"items": dados}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# --- 3. ROTA DE DETALHES ---
@app.get("/concursos/{concurso_id}")
def detalhe_concurso(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM concursos WHERE id = %s', (concurso_id,))
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