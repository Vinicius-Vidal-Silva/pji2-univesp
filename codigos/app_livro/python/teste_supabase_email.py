import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EMAIL_TESTE = os.getenv("EMAIL_TESTE")
SENHA_TESTE = os.getenv("SENHA_TESTE")

# Validação simples para evitar erros de esquecimento
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("As credenciais não foram encontradas no arquivo .env!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def rodar_teste_com_env():
    print(f"\n1. Cadastrando usuário no Auth ({EMAIL_TESTE})...")
    supabase.auth.sign_up({
        "email": EMAIL_TESTE,
        "password": SENHA_TESTE
    })
    
    print("\n🚨 AÇÃO NECESSÁRIA 🚨")
    print(f"Um e-mail de confirmação foi enviado para: {EMAIL_TESTE}")
    print("Vá até a sua caixa de entrada e clique no link de confirmação.")
    input("👉 Pressione [ENTER] aqui no terminal APÓS ter clicado no link...")

    print("\n2. Fazendo login para obter a sessão ativa...")
    login_response = supabase.auth.sign_in_with_password({
        "email": EMAIL_TESTE,
        "password": SENHA_TESTE
    })
    
    usuario_id = login_response.user.id
    print(f"✅ Login bem-sucedido! ID do Usuário: {usuario_id}")

    print("\n3. Criando perfil na tabela 'usuarios'...")
    supabase.table("usuarios").insert({
        "id": usuario_id,
        "nome_completo": "Testador .env",
        "email": EMAIL_TESTE,
        "bio": "Validando o fluxo com variáveis de ambiente."
    }).execute()
    print("✅ Perfil público criado com sucesso!")

    print("\n4. Cadastrando um novo livro...")
    livro_response = supabase.table("livros").insert({
        "dono_id": usuario_id,
        "titulo": "Clean Code: Habilidades Práticas do Agile Software",
        "autor": "Robert C. Martin",
        "tema_genero": "Tecnologia",
        "estado_conservacao": "Novo",
        "status": "Disponível"
    }).execute()
    
    print(f"✅ Livro cadastrado com sucesso!")

    print("\n5. Buscando livros disponíveis na vitrine...")
    vitrine = supabase.table("livros").select("*").eq("status", "Disponível").execute()
    
    for livro in vitrine.data:
        print(f"   📚 {livro['titulo']} - Autor: {livro['autor']}")

if __name__ == "__main__":
    try:
        rodar_teste_com_env()
        print("\n🚀 TESTE CONCLUÍDO COM SUCESSO usando o .env!")
    except Exception as e:
        print(f"\n❌ Erro durante o teste: {e}")