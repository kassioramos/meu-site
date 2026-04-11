from fastapi import FastAPI, HTTPException, Query # Adicione Query aqui no topo
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector import Error
import uvicorn

# 1. Criamos a instância do FastAPI (Isso resolve o NameError)
app = FastAPI(title="API Concursos Maranhão Pro")

# 2. Configuração de CORS (Essencial para o Front-end conseguir acessar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'pedreiro30', 
    'database': 'concursos_maranhao'
}


# --- ROTA 1: LISTAR COM PAGINAÇÃO E BUSCA ---
@app.get("/concursos")
def get_concursos(
    busca: str = None, 
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1)
):
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # 1. Lógica da Query principal com LIMIT e OFFSET
        if busca:
            query = """SELECT * FROM editais 
                    WHERE orgao LIKE %s OR cargos LIKE %s 
                    ORDER BY id DESC LIMIT %s OFFSET %s"""
            valor = f"%{busca}%"
            cursor.execute(query, (valor, valor, limit, skip))
        else:
            query = "SELECT * FROM editais ORDER BY id DESC LIMIT %s OFFSET %s"
            cursor.execute(query, (limit, skip))
        
        concursos = cursor.fetchall()

        # 2. Query para contar o TOTAL de registros (sem o limite)
        # Isso é vital para o front-end calcular o número de páginas
        if busca:
            cursor.execute("SELECT COUNT(*) as total FROM editais WHERE orgao LIKE %s OR cargos LIKE %s", (valor, valor))
        else:
            cursor.execute("SELECT COUNT(*) as total FROM editais")
        
        total = cursor.fetchone()['total']
            
        # 3. Retornamos um objeto com os itens e o total
        return {
            "items": concursos,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    except Error as e:
        print(f"Erro MySQL: {e}")
        raise HTTPException(status_code=500, detail="Erro ao acessar o banco de dados")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- ROTA 2: BUSCAR POR ID (Para a página de detalhes) ---
@app.get("/concursos/{concurso_id}")
def get_concurso_por_id(concurso_id: int):
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM editais WHERE id = %s"
        cursor.execute(query, (concurso_id,))
        concurso = cursor.fetchone()
        
        if not concurso:
            raise HTTPException(status_code=404, detail="Concurso não encontrado")
        return concurso
    except Error as e:
        print(f"Erro MySQL: {e}")
        raise HTTPException(status_code=500, detail="Erro interno")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)