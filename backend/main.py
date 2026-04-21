@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        print("BANCA RECEBIDA:", banca)

        if banca:
            banca_limpa = banca.strip().lower()
            parametro = f"%{banca_limpa}%"

            query = """
                SELECT id, banca, enunciado, disciplina
                FROM questoes
                WHERE LOWER(TRIM(banca)) ILIKE %s
            """

            cursor.execute(query, (parametro,))
        else:
            query = """
                SELECT id, banca, enunciado, disciplina
                FROM questoes
                LIMIT 20
            """
            cursor.execute(query)

        dados = cursor.fetchall()

        print("TOTAL:", len(dados))

        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)

        return dados

    except Exception as e:
        print("ERRO:", str(e))
        return {"error": str(e)}

    finally:
        if conn:
            conn.close()