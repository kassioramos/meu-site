@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql_base = '''
            SELECT id, banca, enunciado, disciplina, opcoes, alternativa_correta
            FROM questoes
        '''

        if banca:
            banca_limpa = banca.strip()
            print(f"--- DEBUG: Buscando por: '{banca_limpa}' ---")

            query = f"""
                {sql_base}
                WHERE LOWER(banca) ILIKE LOWER(%s)
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