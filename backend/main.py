from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import random
from datetime import date, datetime
from decimal import Decimal

# 1. INICIALIZAÇÃO
app = FastAPI()

# 2. CONFIGURAÇÃO DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FUNÇÃO AUXILIAR PARA CONVERTER TIPOS ESPECIAIS PARA JSON
def serializar_dados(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return str(obj) if obj is not None else None

# 3. FUNÇÃO DE SEO DINÂMICO
def gerar_descricao_seo(concurso):
    orgao = str(concurso.get('orgao', '')).title()
    cidade = str(concurso.get('cidade', 'Maranhão')).title()
    
    banca_db = str(concurso.get('banca', '')).strip()

    if not banca_db or banca_db.lower() in ['nulo', 'null', 'none', '']:
        banca_final = "comissão própria da instituição"
    else:
        banca_final = f"organização de {banca_db}"

    intros = [
        f"Excelente oportunidade aberta no órgão {orgao} sob {banca_final}.",
        f"O edital para {orgao} em {cidade} já está disponível para consulta, organizado por {banca_final}.",
        f"Quem busca estabilidade no Maranhão deve conferir a vaga para {orgao} ({banca_final})."
    ]
    
    detalhes = ""
    salario = concurso.get('salario_max', 0)
    
    try:
        salario_val = float(salario) if salario else 0
        if salario_val > 0:
            detalhes += f" O processo seletivo oferece vencimentos de até R$ {salario_val:.2f}."
        else:
            detalhes += " A remuneração detalhada pode ser conferida no edital oficial."
    except:
        detalhes += " Confira os detalhes salariais no edital completo."

    ctas = [" Fique atento aos prazos.", " Prepare-se com antecedência.", " Verifique os requisitos no anexo."]
    return f"{random.choice(intros)}{detalhes}{random.choice(ctas)}"

# 4. CONEXÃO COM O BANCO DE DADOS
def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=RealDictCursor)

# 5. ROTAS

@app.get("/")
async def root():
    return {"status": "Online", "message": "Concursos Maranhão API"}

@app.get("/concursos")
async def listar_concursos():
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
            item["inicio_inscricao"] = serializar_dados(item["inicio_inscricao"])
            item["fim_inscricao"] = serializar_dados(item["fim_inscricao"])
            item["data_prova"] = str(item["data_prova"]) if item["data_prova"] else "A definir"
            item["salario_max"] = serializar_dados(item["salario_max"])
            item["valor_inscricao_min"] = serializar_dados(item["valor_inscricao_min"])

        cursor.close()
        conn.close()
        return {"items": dados}
    except Exception as e:
        print(f"ERRO LISTAR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                id, orgao, status, cargos, cidade, escolaridade, banca,
                salario_min, salario_max, valor_inscricao_min, valor_inscricao_max,
                inicio_inscricao, fim_inscricao, data_prova, link_oficial, link_inscricao,
                tabela_vagas
            FROM concursos WHERE id = %s
        """
        cursor.execute(query, (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
            
        concurso["descricao_seo"] = gerar_descricao_seo(concurso)
        concurso["inicio_inscricao"] = serializar_dados(concurso.get("inicio_inscricao"))
        concurso["fim_inscricao"] = serializar_dados(concurso.get("fim_inscricao"))
        concurso["data_prova"] = str(concurso.get("data_prova")) if concurso.get("data_prova") else "A definir"
        concurso["salario_max"] = serializar_dados(concurso.get("salario_max"))
        concurso["valor_inscricao_min"] = serializar_dados(concurso.get("valor_inscricao_min"))

        cursor.close()
        conn.close()
        return concurso
    except Exception as e:
        print(f"ERRO NO BACKEND: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))