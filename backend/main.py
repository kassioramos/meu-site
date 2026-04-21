from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random
from datetime import date, datetime
from decimal import Decimal

# 1. INICIALIZAÇÃO
app = FastAPI(title="Concursos Maranhão API")

# 2. CONFIGURAÇÃO DE CORS - CRUCIAL PARA A VERCEL FUNCIONAR
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FUNÇÃO AUXILIAR PARA SERIALIZAÇÃO
def serializar_dados(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return str(obj) if obj is not None else None

# 3. LÓGICA DE SEO
def gerar_descricao_seo(concurso):
    orgao = str(concurso.get('orgao', 'Órgão')).title()
    banca = str(concurso.get('banca', 'Comissão Própria')).strip()
    return f"Edital aberto para {orgao} organizado por {banca}. Confira vagas e salários."

# 4. CONEXÃO COM O BANCO
def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)

# 5. ROTAS

@app.get("/")
async def root():
    return {"status": "Online", "message": "API Concursos Maranhão Pro"}

# ROTA DE QUESTÕES CORRIGIDA
@app.get("/questoes")
def get_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Se vier banca na URL, filtra. Se não, traz 10 aleatórias.
        if banca and banca != "null":
            query = "SELECT * FROM questoes WHERE banca ILIKE %s ORDER BY random() LIMIT 10"
            cursor.execute(query, (f"%{banca.strip()}%",))
        else:
            cursor.execute("SELECT * FROM questoes ORDER BY random() LIMIT 10")
            
        dados = cursor.fetchall()
        
        # Limpa os dados para o JSON não quebrar
        for q in dados:
            for chave, valor in q.items():
                if isinstance(valor, (date, datetime, Decimal)):
                    q[chave] = serializar_dados(valor)
        
        cursor.close()
        return dados 
    except Exception as e:
        print(f"Erro na rota /questoes: {e}")
        return [] # Retorna lista vazia em vez de erro para não quebrar o site
    finally:
        if conn: conn.close()

# ROTA DE LISTAGEM DE CONCURSOS
@app.get("/concursos")
async def listar_concursos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos ORDER BY fim_inscricao ASC NULLS LAST")
        dados = cursor.fetchall()
        
        for item in dados:
            item["descricao_seo"] = gerar_descricao_seo(item)
            for campo in ["inicio_inscricao", "fim_inscricao", "salario_max", "valor_inscricao_min"]:
                item[campo] = serializar_dados(item.get(campo))
        
        cursor.close()
        return {"items": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# ROTA DE DETALHE
@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Não encontrado")
            
        for campo in concurso:
            if isinstance(concurso[campo], (date, datetime, Decimal)):
                concurso[campo] = serializar_dados(concurso[campo])
        
        cursor.close()
        return concurso
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()