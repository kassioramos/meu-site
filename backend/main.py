from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random
from datetime import date, datetime
from decimal import Decimal

# 1. INICIALIZAÇÃO
app = FastAPI(title="Concursos Maranhão API", version="1.0.0")

# 2. CONFIGURAÇÃO DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FUNÇÃO AUXILIAR PARA SERIALIZAÇÃO JSON
def serializar_dados(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return str(obj) if obj is not None else None

# 3. LÓGICA DE SEO DINÂMICO
def gerar_descricao_seo(concurso):
    orgao = str(concurso.get('orgao', 'Órgão não informado')).title()
    cidade = str(concurso.get('cidade', 'Maranhão')).title()
    banca_db = str(concurso.get('banca', '')).strip()

    if not banca_db or banca_db.lower() in ['nulo', 'null', 'none', '']:
        banca_final = "comissão própria"
    else:
        banca_final = f"banca {banca_db}"

    intros = [
        f"Edital aberto para {orgao} em {cidade} organizado pela {banca_final}.",
        f"Oportunidade de concurso público no Maranhão: {orgao} ({banca_final}).",
        f"Confira as vagas e prazos para o certame da {orgao} sob {banca_final}."
    ]
    
    salario = concurso.get('salario_max', 0)
    try:
        salario_val = float(salario) if salario else 0
        detalhe_salario = f" Salários chegam a R$ {salario_val:.2f}." if salario_val > 0 else ""
    except:
        detalhe_salario = ""

    ctas = [" Veja o edital.", " Inscrições abertas.", " Prepare sua apostila."]
    return f"{random.choice(intros)}{detalhe_salario}{random.choice(ctas)}"

# 4. CONEXÃO COM O BANCO DE DADOS
def get_db_connection():
    try:
        return psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)
    except Exception as e:
        print(f"ERRO DE CONEXÃO COM O BANCO: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao conectar ao banco de dados")

# 5. ROTAS DA API

@app.get("/")
async def root():
    return {"status": "Online", "servidor": "Render", "projeto": "Concursos Maranhão Pro"}

# ROTA DE QUESTÕES (USADA NO SIMULADO DO FRONTEND)
@app.get("/questoes")
def get_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if banca:
            query = "SELECT * FROM questoes WHERE banca ILIKE %s ORDER BY random() LIMIT 10"
            cursor.execute(query, (f"%{banca.strip()}%",))
        else:
            cursor.execute("SELECT * FROM questoes ORDER BY random() LIMIT 10")
            
        dados = cursor.fetchall()
        
        for q in dados:
            for chave, valor in q.items():
                if isinstance(valor, (date, datetime, Decimal)):
                    q[chave] = serializar_dados(valor)
        
        cursor.close()
        return dados 
    except Exception as e:
        print(f"ERRO /QUESTOES: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# ROTA DE LISTAGEM DE CONCURSOS
@app.get("/concursos")
async def listar_concursos():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            SELECT 
                id, orgao, status, cargos, cidade, escolaridade, banca,
                salario_min, salario_max, valor_inscricao_min, valor_inscricao_max,
                inicio_inscricao, fim_inscricao, data_prova, link_oficial, link_inscricao,
                tabela_vagas
            FROM concursos 
            ORDER BY fim_inscricao ASC NULLS LAST, orgao ASC
        """
        cursor.execute(query)
        dados = cursor.fetchall()
        
        for item in dados:
            item["descricao_seo"] = gerar_descricao_seo(item)
            # Sanitização completa de campos especiais
            for campo in ["inicio_inscricao", "fim_inscricao", "salario_max", "valor_inscricao_min"]:
                item[campo] = serializar_dados(item.get(campo))
            item["data_prova"] = str(item["data_prova"]) if item["data_prova"] else "A definir"

        cursor.close()
        return {"items": dados}
    except Exception as e:
        print(f"ERRO /CONCURSOS: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# ROTA DE DETALHE DE UM CONCURSO ESPECÍFICO
@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM concursos WHERE id = %s", (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
            
        concurso["descricao_seo"] = gerar_descricao_seo(concurso)
        # Serialização de todos os campos possíveis
        for campo in concurso:
            if isinstance(concurso[campo], (date, datetime, Decimal)):
                concurso[campo] = serializar_dados(concurso[campo])
        
        if not concurso.get("data_prova"):
            concurso["data_prova"] = "A definir"

        cursor.close()
        return concurso
    except Exception as e:
        print(f"ERRO /CONCURSOS/ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

# ROTA ADICIONAL PARA STATUS DE SAÚDE DA API (ÚTIL PARA O RENDER)
@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}