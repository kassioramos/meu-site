from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal
import uuid

app = FastAPI()

# 🔓 Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔄 Serializador para tipos especiais
def serializar(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    return obj

# 🔌 Conexão com o banco
def get_db_connection():
    db_url = os.environ.get("DATABASE_URL")
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online", "msg": "API Concursos Maranhão Pro funcionando! 🚀"}

# ==========================================
# 📚 BLOCO: QUESTÕES
# ==========================================
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql_base = "SELECT id, banca, enunciado, disciplina, opcoes, alternativa_correta, comentario_professor FROM questoes"

        if banca:
            banca_limpa = banca.strip()
            query = f"{sql_base} WHERE banca ILIKE %s"
            cursor.execute(query, (f"%{banca_limpa}%",))
        else:
            cursor.execute(f"{sql_base} LIMIT 20")

        dados = cursor.fetchall()
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        return dados
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# ==========================================
# 📰 BLOCO: BLOG (ARTIGOS)
# ==========================================
@app.get("/artigos")
def listar_artigos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, titulo, slug, resumo, capa_url, categoria, created_at FROM artigos ORDER BY created_at DESC')
        dados = cursor.fetchall()
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)
        return dados
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

@app.get("/artigos/{slug}")
def obter_artigo_por_slug(slug: str):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM artigos WHERE slug = %s', (slug,))
        artigo = cursor.fetchone()

        if not artigo:
            raise HTTPException(status_code=404, detail="Artigo não encontrado")

        for k, v in artigo.items():
            artigo[k] = serializar(v)
        return artigo
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# ==========================================
# 📄 BLOCO: CONCURSOS
# ==========================================
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

@app.get("/concursos/{concurso_id}")
def obter_concurso_por_id(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
            
        for k, v in concurso.items():
            concurso[k] = serializar(v)
            
        return concurso
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn: conn.close()