from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal

app = FastAPI()

# Configuração de CORS para a Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auxiliar para transformar dados do banco em texto/número puro
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
    return {"status": "online", "projeto": "Concursos Maranhão Pro"}

# ROTA DE QUESTÕES (MANTIDA)
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if banca:
            cursor.execute("SELECT * FROM questoes WHERE banca ILIKE %s LIMIT 10", (f"%{banca}%",))
        else:
            cursor.execute("SELECT * FROM questoes LIMIT 10")
        dados = cursor.fetchall()
        # Tratamento de dados especiais
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        return dados
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# ROTA DE CONCURSOS (RECUPERADA PARA O DASHBOARD)
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

# ROTA DE DETALHE
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