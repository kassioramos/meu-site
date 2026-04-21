@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 🔍 DEBUG: ver o que está chegando
        print("PARAM BANCA RECEBIDO:", banca)

        sql_base = """
            SELECT id, banca, enunciado, disciplina
            FROM questoes
        """

        # 📌 Se vier filtro de banca
        if banca:
            banca_limpa = banca.strip().lower()
            print("BANCA LIMPA:", banca_limpa)

            query = f"""
                {sql_base}
                WHERE TRIM(LOWER(banca)) ILIKE %s
            """

            parametro = f"%{banca_limpa}%"
            print("PARAMETRO SQL:", parametro)

            cursor.execute(query, (parametro,))

        else:
            print("SEM FILTRO - BUSCANDO GERAL")
            cursor.execute(f"{sql_base} LIMIT 20")

        dados = cursor.fetchall()

        # 🔍 DEBUG: ver o que veio do banco
        print("RESULTADO DO BANCO:", dados)
        print(f"TOTAL ENCONTRADO: {len(dados)}")

        # 🔄 Serializa dados
        for item in dados:
            for k, v in item.items():
                item[k] = serializar(v)

        return dados

    except Exception as e:
        print("ERRO BACKEND:", str(e))
        return {"error": str(e)}

    finally:
        if conn:
            conn.close()