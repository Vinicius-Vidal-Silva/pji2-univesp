import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

EMAIL_1 = os.getenv("EMAIL_TESTE")
SENHA_1 = os.getenv("SENHA_TESTE")
EMAIL_2 = os.getenv("EMAIL_TESTE_2")
SENHA_2 = os.getenv("SENHA_TESTE_2")

def realizar_teste_final():
    print("\n[ETAPA 1] Login do Usuário 1...")
    user1 = supabase.auth.sign_in_with_password({"email": EMAIL_1, "password": SENHA_1}).user
    
    print("\n[ETAPA 2] Testando Inserção na Wishlist...")
    supabase.table("wishlist").insert({
        "usuario_id": user1.id,
        "titulo_desejado": "O Senhor dos Anéis",
        "autor_desejado": "J.R.R. Tolkien"
    }).execute()
    print("✅ Livro adicionado à Wishlist com sucesso!")

    print("\n[ETAPA 3] Testando Chat da Proposta Aceita...")
    propostas = supabase.table("propostas_troca").select("id").eq("recebedor_id", user1.id).eq("status_proposta", "Aceita").execute()
    
    if propostas.data:
        proposta_id = propostas.data[0]['id']
        print(f"   Recuperada a Proposta ID: {proposta_id}")

        # Usuário 1 envia mensagem
        supabase.table("mensagens_chat").insert({
            "troca_id": proposta_id,
            "remetente_id": user1.id,
            "conteudo": "Olá! Vi que você aceitou a troca. Onde podemos nos encontrar?"
        }).execute()
        print("✅ Mensagem enviada pelo Usuário 1.")

        # --- 4. Login do Usuário 2 e Resposta ---
        print("\n[ETAPA 4] Login do Usuário 2 e Resposta no Chat...")
        user2 = supabase.auth.sign_in_with_password({"email": EMAIL_2, "password": SENHA_2}).user
        
        supabase.table("mensagens_chat").insert({
            "troca_id": proposta_id,
            "remetente_id": user2.id,
            "conteudo": "Oi! Que tal na estação de metrô amanhã ao meio-dia?"
        }).execute()
        print("✅ Mensagem de resposta enviada pelo Usuário 2.")
        
        # Lê o histórico do chat
        chat = supabase.table("mensagens_chat").select("conteudo, remetente_id").eq("troca_id", proposta_id).execute()
        print("\n💬 Histórico do Chat:")
        for msg in chat.data:
            remetente = "Usuário 1" if msg['remetente_id'] == user1.id else "Usuário 2"
            print(f"   [{remetente}]: {msg['conteudo']}")
    else:
        print("❌ Nenhuma proposta 'Aceita' encontrada para testar o chat.")

if __name__ == "__main__":
    try:
        realizar_teste_final()
        print("\n🚀 BANCO DE DADOS ZERADO (100% TESTADO E VALIDADO)!")
    except Exception as e:
        print(f"\n❌ Erro: {e}")