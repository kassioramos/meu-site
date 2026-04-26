from fastapi import FastAPI, Query, HTTPException, Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client, Client

app = FastAPI()

# 🔓 Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 Credenciais do Supabase
# Na Vercel, use a 'service_role key' para o BACKEND para ignorar bloqueios de RLS em deletes/posts
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mczmhvuxujvhrudqmpvg.supabase.co")
SUPABASE_KEY = os.environ.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jem1odnV4dWp2aHJ1ZHFtcHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzgwMDksImV4cCI6MjA5MTUxNDAwOX0.vqNvzVRzpH9Otqb7DISpWXLw4b6eegdwzpaLBRJPwfY") 

if not SUPABASE_KEY:
    print("AVISO: SUPABASE_KEY não encontrada nas variáveis de ambiente!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class ArtigoBase(BaseModel):
    titulo: str
    slug: str
    resumo: str
    conteudo: str
    capa_url: str
    categoria: str

@app.get("/")
def home():
    return {"status": "online", "msg": "API Concursos Maranhão Pro integrada ao Supabase! 🚀"}

# ==========================================
# 📰 BLOCO: BLOG (ARTIGOS)
# ==========================================

@app.get("/artigos")
def listar_artigos():
    try:
        # Busca simples ordenada por data
        response = supabase.table("artigos").select("id, titulo, slug, resumo, capa_url, categoria, created_at").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}

@app.get("/artigos/{slug}")
def obter_artigo_por_slug(slug: str):
    try:
        response = supabase.table("artigos").select("*").eq("slug", slug).maybe_single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Artigo não encontrado")
        return response.data
    except Exception as e:
        return {"error": str(e)}

@app.post("/artigos")
def criar_artigo(artigo: ArtigoBase):
    try:
        response = supabase.table("artigos").insert(artigo.dict()).execute()
        return {"message": "Post criado com sucesso!", "data": response.data}
    except Exception as e:
        return {"error": str(e)}

@app.delete("/artigos/{slug}")
async def deletar_artigo(slug: str):
    try:
        response = supabase.table("artigos").delete().eq("slug", slug).execute()
        return {"message": f"Artigo '{slug}' deletado!", "data": response.data}
    except Exception as e:
        return {"error": str(e)}

# ==========================================
# 📚 BLOCO: QUESTÕES
# ==========================================

@app.get("/questoes")
def listar_questoes(banca: str = Query(None)):
    try:
        query = supabase.table("questoes").select("*")
        if banca:
            query = query.ilike("banca", f"%{banca.strip()}%")
        else:
            query = query.limit(20)
        
        response = query.execute()
        return response.data
    except Exception as e:
        return {"error": str(e)}

# ==========================================
# 📄 BLOCO: CONCURSOS
# ==========================================

@app.get("/concursos")
def listar_concursos():
    try:
        response = supabase.table("concursos").select("*").order("id", desc=True).execute()
        # Mantendo o formato {"items": [...]} para não quebrar seu front-end
        return {"items": response.data}
    except Exception as e:
        return {"error": str(e)}

# ==========================================
# 🗺️ BLOCO: SEO (SITEMAP)
# ==========================================

@app.get("/sitemap.xml")
async def sitemap():
    BASE_URL = "https://meu-site-five-delta.vercel.app"
    try:
        # Busca dados necessários para o sitemap
        concs = supabase.table("concursos").select("id").execute()
        arts = supabase.table("artigos").select("slug").execute()

        xml = '<?xml version="1.0" encoding="UTF-8"?>'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        xml += f'<url><loc>{BASE_URL}/</loc><priority>1.0</priority></url>'
        
        for c in concs.data:
            xml += f'<url><loc>{BASE_URL}/detalhes.html?id={c["id"]}</loc><priority>0.8</priority></url>'
        
        for a in arts.data:
            xml += f'<url><loc>{BASE_URL}/post.html?slug={a["slug"]}</loc><priority>0.7</priority></url>'
            
        xml += '</urlset>'
        return Response(content=xml, media_type="application/xml")
    except Exception as e:
        return Response(content=f"<error>{str(e)}</error>", media_type="application/xml")