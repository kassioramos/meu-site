from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import date, datetime
from decimal import Decimal

app = FastAPI()

# --- CONFIGURAÇÃO DE CORS ---
# Permite que o frontend na Vercel acesse o backend no Render sem bloqueios
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Converte formatos que o JSON padrão não aceita (datas e decimais)
def serializar(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return obj

def get_db_connection():
    # Puxa a URL do Banco das variáveis de ambiente do Render
    return psycopg2.connect(os.environ.get("DATABASE_URL"), cursor_factory=RealDictCursor)

@app.get("/")
def home():
    return {"status": "online", "tabelas": ["concursos", "questoes"]}

# --- 1. ROTA DE QUESTÕES (SIMULADO) ---
@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if banca:
            # ILIKE ignora maiúsculas/minúsculas. Strip limpa espaços extras.
            sql = "SELECT * FROM questoes WHERE banca ILIKE %s LIMIT 20"
            cursor.execute(sql, (f"%{banca.strip()}%",))
        else:
            cursor.execute("SELECT * FROM questoes LIMIT 20")
            
        dados = cursor.fetchall()
        questoes_formatadas = []

        for item in dados:
            # Serializa campos básicos (datas/id)
            for k, v in item.items():
                item[k] = serializar(v)
            
            # Formata as alternativas para o componente CardQuestao.tsx
            item['opcoes'] = {
                "a": item.get('alternativa_a'),
                "b": item.get('alternativa_b'),
                "c": item.get('alternativa_c'),
                "d": item.get('alternativa_d'),
                "e": item.get('alternativa_e')
            }
            
            # Remove as colunas originais para o JSON ficar limpo
            colunas_alternativas = ['alternativa_a', 'alternativa_b', 'alternativa_c', 'alternativa_d', 'alternativa_e']
            for col in colunas_alternativas:
                item.pop(col, None)

            questoes_formatadas.append(item)

        return questoes_formatadas

    except Exception as e:
        print(f"Erro em /questoes: {str(e)}")
        return {"error": str(e)}
    finally:
        if conn: conn.close()

# --- 2. ROTA DE CONCURSOS (LISTA E DASHBOARD) ---
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
        
        # Retornamos dentro de 'items' para bater com o seu frontend Next.js
        return {"items": dados}
    except Exception as e:
        print(f"Erro em /concursos: {str(e)}")
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
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
            
        for k, v in concurso.items():
            concurso[k] = serializar(v)
            
        return concurso
    except Exception as e:
        print(f"Erro em /concursos/id: {str(e)}")
        return {"error": str(e)}
    finally:
        if conn: conn.close()