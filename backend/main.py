from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal
import uuid

app = FastAPI()

# 🔓 Configuração de CORS para permitir que a Vercel acesse o Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔄 Serializador para tipos que o JSON padrão não aceita
def serializar(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    return obj

# 🔌 Conexão com o banco (DATABASE_URL deve estar no painel do Render)
def get_db_connection():
    db_url = os.environ.get("DATABASE_URL")
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online", "msg": "API Concursos Maranhão Pro funcionando! 🚀"}

# 📚 Rota de Questões com Busca Segura
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Selecionando as colunas necessárias (certifique-se que 'opcoes' existe no seu banco)
        sql_base = "SELECT id, banca, enunciado, disciplina, opcoes, alternativa_correta, comentario_professor FROM questoes"

        if banca:
            banca_limpa = banca.strip()
            print(f"--- DEBUG: Buscando banca: '{banca_limpa}' ---")
            
            # ILIKE é o segredo: ele ignora maiúsculas/minúsculas automaticamente no Postgres
            query = f"{sql_base} WHERE banca ILIKE %s"
            cursor.execute(query, (f"%{banca_limpa}%",))
        else:
            cursor.execute(f"{sql_base} LIMIT 20")

        dados = cursor.fetchall()
        
        # Converte os dados para um formato que o Python consegue enviar via API
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)

        return dados

    except Exception as e:
        print(f"--- ERRO NO SERVIDOR: {str(e)} ---")
        return {"error": str(e)}
    finally:
        if conn:
            conn.close()

# 📄 Rota de Concursos
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