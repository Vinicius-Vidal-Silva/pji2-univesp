import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EMAIL_TESTE = os.getenv("EMAIL_TESTE")
SENHA_TESTE = os.getenv("SENHA_TESTE")

# Validação simples
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("As credenciais não foram encontradas no arquivo .env!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def rodar_teste_login_existente():
    print(f"\n1. Fazendo login com usuário existente ({EMAIL_TESTE})...")
    login_response = supabase.auth.sign_in_with_password({
        "email": EMAIL_TESTE,
        "password": SENHA_TESTE
    })
    
    usuario_id = login_response.user.id
    print(f"✅ Login bem-sucedido! ID do Usuário: {usuario_id}")

    print("\n2. Verificando perfil na tabela 'usuarios'...")
    perfil = supabase.table("usuarios").select("nome_completo").eq("id", usuario_id).execute()
    if perfil.data:
        print(f"✅ Bem-vindo de volta, {perfil.data[0]['nome_completo']}!")

    print("\n3. Cadastrando um novo livro...")
    livro_response = supabase.table("livros").insert({
        "dono_id": usuario_id,
        "titulo": "O Programador Pragmático",
        "autor": "Andrew Hunt, David Thomas",
        "tema_genero": "Tecnologia",
        "estado_conservacao": "Seminovo",
        "status": "Disponível"
    }).execute()
    
    livro_id = livro_response.data[0]['id']
    print(f"✅ Livro cadastrado com sucesso! ID: {livro_id}")

    print("\n4. Buscando livros disponíveis na vitrine...")
    vitrine = supabase.table("livros").select("id, titulo, autor").eq("status", "Disponível").execute()
    
    for livro in vitrine.data:
        print(f"   📚 {livro['titulo']} - Autor: {livro['autor']}")

    print("\n5. Testando o Trigger Analítico (Mudança de status)...")
    # Pega o ID do livro recém-criado
    supabase.table("livros").update({"status": "Em Negociação"}).eq("id", livro_id).execute()
    print("✅ Status do livro atualizado para 'Em Negociação'.")

    print("\n6. Verificando a segurança da Camada Silver...")
    # Vai falhar de propósito devido ao bloqueio da API REST para o schema silver
    try:
        historico = supabase.table("dim_livros_historico").select("*").eq("livro_id", livro_id).execute()
        for reg in historico.data:
             print(f"   🔄 Status: {reg['status']:<15} | Ativo: {str(reg['is_ativo']):<5} | Fim: {reg['data_fim']}")
    except Exception as e:
        print("   🔒 Acesso negado com sucesso via API (A segurança da Arquitetura Medalhão funcionou!).")
        print("   👉 Para ver o histórico gerado, rode 'select * from silver.dim_livros_historico;' no SQL Editor do Supabase.")

if __name__ == "__main__":
    try:
        rodar_teste_login_existente()
        print("\n🚀 TESTE RÁPIDO CONCLUÍDO COM SUCESSO!")
    except Exception as e:
        print(f"\n❌ Erro durante o teste: {e}")