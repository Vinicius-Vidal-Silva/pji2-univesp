import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

EMAIL_1 = os.getenv("EMAIL_TESTE")
SENHA_1 = os.getenv("SENHA_TESTE")
EMAIL_2 = os.getenv("EMAIL_TESTE_2")
SENHA_2 = os.getenv("SENHA_TESTE_2")

def realizar_teste_de_troca():
    # --- FASE 1: Preparação (Garantir que o Usuário 2 existe) ---
    print("\n[FASE 1] Verificando Usuário 2...")
    try:
        supabase.auth.sign_up({"email": EMAIL_2, "password": SENHA_2})
        print(f"🚨 Confirme o e-mail {EMAIL_2} antes de continuar!")
        input("👉 Pressione [ENTER] após confirmar...")
    except Exception:
        pass # Usuário já existe, segue o jogo

    # --- FASE 2: Usuário 1 cria um livro que será desejado ---
    print(f"\n[FASE 2] Login do Dono do Livro ({EMAIL_1})...")
    user1 = supabase.auth.sign_in_with_password({"email": EMAIL_1, "password": SENHA_1}).user
    
    livro_dono = supabase.table("livros").insert({
        "dono_id": user1.id, "titulo": "A Arte da Guerra", 
        "autor": "Sun Tzu", "tema_genero": "Estratégia", "estado_conservacao": "Novo"
    }).execute().data[0]
    print(f"📖 Livro cadastrado pelo Usuário 1: {livro_dono['titulo']}")

    # --- FASE 3: Usuário 2 loga, cadastra um livro e faz a proposta ---
    print(f"\n[FASE 3] Login do Interessado ({EMAIL_2})...")
    user2 = supabase.auth.sign_in_with_password({"email": EMAIL_2, "password": SENHA_2}).user
    
    # 3.1 Usuário 2 cadastra um livro para usar como moeda de troca
    livro_ofertado = supabase.table("livros").insert({
        "dono_id": user2.id, "titulo": "Dom Casmurro", 
        "autor": "Machado de Assis", "tema_genero": "Romance", "estado_conservacao": "Seminovo"
    }).execute().data[0]
    
    # 3.2 Usuário 2 cria a Proposta de Troca
    print("🤝 Usuário 2 está enviando uma proposta de troca...")
    proposta = supabase.table("propostas_troca").insert({
        "ofertante_id": user2.id,
        "recebedor_id": user1.id,
        "livro_desejado_id": livro_dono['id']
    }).execute().data[0]

    # 3.3 Usuário 2 adiciona seu livro aos 'Itens Ofertados' da proposta
    supabase.table("itens_ofertados").insert({
        "proposta_id": proposta['id'],
        "livro_ofertado_id": livro_ofertado['id']
    }).execute()
    print("✅ Proposta enviada com sucesso! Aguardando aceite.")

    # --- FASE 4: Usuário 1 Loga e Aceita a Proposta ---
    print(f"\n[FASE 4] Usuário 1 ({EMAIL_1}) avalia a proposta...")
    supabase.auth.sign_in_with_password({"email": EMAIL_1, "password": SENHA_1})
    
    # 4.1 Atualiza status da proposta para "Aceita"
    supabase.table("propostas_troca").update({"status_proposta": "Aceita"}).eq("id", proposta['id']).execute()
    
    # 4.2 Muda o status dos dois livros para "Em Negociação" (Isso vai acionar o Trigger da camada Silver!)
    supabase.table("livros").update({"status": "Em Negociação"}).eq("id", livro_dono['id']).execute()
    supabase.table("livros").update({"status": "Em Negociação"}).eq("id", livro_ofertado['id']).execute()
    print("🎉 Proposta Aceita! O status dos livros mudou e o histórico Silver foi atualizado.")

if __name__ == "__main__":
    try:
        realizar_teste_de_troca()
    except Exception as e:
        print(f"\n❌ Erro: {e}")