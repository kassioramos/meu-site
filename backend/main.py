from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal
import uuid

app = FastAPI()

# --- CONFIGURAÇÃO DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Converte formatos do banco para JSON (Datas, Decimais e UUIDs)
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
    if not db_url:
        print("ERRO CRÍTICO: DATABASE_URL não configurada no Render!")
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online", "msg": "API Concursos Maranhão Pro"}

# --- 1. ROTA DE QUESTÕES (SIMULADO) ---
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # SQL usando 'id' (UUID conforme sua imagem bacb87)
        sql = 'SELECT id, banca, enunciado, disciplina, opcoes, alternativa_correta FROM questoes'
        
        if banca:
            banca_limpa = banca.strip()
            print(f"Buscando banca: '{banca_limpa}'") 
            cursor.execute(f"{sql} WHERE banca ILIKE %s LIMIT 50", (f"%{banca_limpa}%",))
        else:
            cursor.execute(f"{sql} LIMIT 50")
            
        dados = cursor.fetchall()
        print(f"Questões encontradas: {len(dados)}") 

        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        
        return dados
    except Exception as e:
        print(f"ERRO NO SQL QUESTOES: {str(e)}")
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# --- 2. ROTA DE CONCURSOS (DASHBOARD) ---
@app.get("/concursos")
def listar_concursos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Ordena pelos concursos mais recentes (ID maior primeiro)
        cursor.execute('SELECT * FROM concursos ORDER BY id DESC')
        dados = cursor.fetchall()
        
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        
        # O Next.js espera a chave "items" para fazer o .map()
        return {"items": dados}
    except Exception as e:
        print(f"ERRO NO SQL CONCURSOS: {str(e)}")
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# --- 3. ROTA DE DETALHES (PÁGINA INDIVIDUAL) ---
@app.get("/concursos/{concurso_id}")
def detalhe_concurso(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Busca concurso específico pelo ID (int4 conforme b9dec6)
        cursor.execute('SELECT * FROM concursos WHERE id = %s', (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
            
        for k, v in concurso.items():
            concurso[k] = serializar(v)
            
        return concurso
    except Exception as e:
        print(f"ERRO NO SQL DETALHES: {str(e)}")
        return {"error": str(e)}
    finally:
        if conn: conn.close()