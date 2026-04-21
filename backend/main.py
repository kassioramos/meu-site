from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal
import uuid

app = FastAPI()

# 🔓 Libera acesso (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔄 Serializador (pra JSON)
def serializar(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    return obj

# 🔌 Conexão com banco
def get_db_connection():
    return psycopg2.connect(
        os.environ.get("DATABASE_URL"),
        cursor_factory=RealDictCursor
    )

# 🏠 Rota inicial
@app.get("/")
def home():
    return {"status": "online", "msg": "API funcionando 🚀"}

# 📚 LISTAR QUESTÕES (CORRIGIDO)
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql_base = """
            SELECT id, banca, enunciado, disciplina
            FROM questoes
        """

        if banca:
            banca_limpa = banca.strip()
            print(f"--- DEBUG: Buscando por: '{banca_limpa}' ---")

            query = f"""
                {sql_base}
                WHERE banca ILIKE %s
            """

            cursor.execute(query, (f"%{banca_limpa}%",))
        else:
            cursor.execute(f"{sql_base} LIMIT 20")

        dados = cursor.fetchall()
        print(f"--- DEBUG: Encontradas {len(dados)} questões ---")

        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)

        return dados

    except Exception as e:
        print(f"--- ERRO BACKEND: {str(e)} ---")
        return {"error": str(e)}

    finally:
        if conn:
            conn.close()

# 📄 LISTAR CONCURSOS
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
        if conn:
            conn.close()

# 🔎 DETALHE DO CONCURSO
@app.get("/concursos/{concurso_id}")
def detalhe_concurso(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            'SELECT * FROM concursos WHERE id = %s',
            (concurso_id,)
        )

        concurso = cursor.fetchone()

        if not concurso:
            raise HTTPException(status_code=404, detail="Não encontrado")

        for k, v in concurso.items():
            concurso[k] = serializar(v)

        return concurso

    except Exception as e:
        return {"error": str(e)}

    finally:
        if conn:
            conn.close()