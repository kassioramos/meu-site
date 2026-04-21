from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal
import uuid

app = FastAPI()

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
    db_url = os.environ.get("DATABASE_URL")
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online"}

@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # SQL ajustado para os nomes exatos das suas colunas na imagem bacb87
        sql = 'SELECT id, banca, enunciado, disciplina, opcoes, alternativa_correta FROM questoes'
        
        if banca:
            # O TRIM remove espaços extras e o ILIKE ignora maiúsculas/minúsculas
            termo = f"%{banca.strip()}%"
            cursor.execute(f"{sql} WHERE banca ILIKE %s", (termo,))
        else:
            cursor.execute(f"{sql} LIMIT 20")
            
        dados = cursor.fetchall()

        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        
        return dados
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

@app.get("/concursos")
def listar_concursos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Ordena pelo ID conforme imagem ba6ccd
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