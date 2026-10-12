# TrocaLivros

Plataforma web de compartilhamento e troca de livros, desenvolvida para o Projeto Integrador II da Universidade Virtual do Estado de São Paulo (Univesp). A aplicação aproxima leitores, permite organizar exemplares e acompanhar propostas de troca.

## Funcionalidades

- Cadastro e autenticação de usuários, perfil e gerenciamento da conta.
- Cadastro e consulta de livros, com busca de informações por título ou ISBN usando a Google Books API.
- Lista de livros desejados (wishlist) e envio e acompanhamento de propostas de troca.
- Área administrativa com indicadores do acervo e das trocas.
- Assistente literária Clarice, integrada à API Gemini por uma Supabase Edge Function.
- Tema claro e escuro.

## Tecnologias

- Frontend: React 19, JavaScript, Vite e Tailwind CSS.
- Backend e autenticação: Supabase (PostgreSQL, Auth, Storage e Edge Functions).
- Integrações: Google Books API e Gemini API.
- Testes: Python `unittest`, Playwright e Node.js.

## Estrutura do repositório

- `frontend-leitura/`: aplicação web e funções Supabase.
- `codigos/app_livro/supabase/`: scripts SQL de tabelas, políticas, funções e indicadores analíticos.
- `codigos/app_livro/python/tests/`: testes automatizados da aplicação.
- `codigos/app_livro/python/teste_*.py`: scripts manuais de integração.
- `codigos/app_livro/javascript/`: código JavaScript auxiliar.

## Executar localmente

Requisitos: Node.js, npm e um projeto Supabase configurado com o esquema e as políticas descritos nos scripts SQL em `codigos/app_livro/supabase/`.

No PowerShell:

```powershell
cd frontend-leitura
npm ci
```

Crie `frontend-leitura/.env.local` com as configurações do projeto Supabase:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_KEY=<anon-ou-publishable-key>
```

Use somente a chave pública anon/publishable no frontend. Nunca coloque chaves `service_role`, senhas ou outras credenciais em variáveis `VITE_`, no código-fonte ou no Git. Configure `GEMINI_API_KEY` como segredo da Edge Function `clarice-review` no Supabase; não a armazene no frontend.

Inicie o servidor de desenvolvimento:

```powershell
npm run dev
```

Comandos disponíveis na pasta `frontend-leitura/`:

```powershell
npm run build
npm run lint
```

## Testes automatizados

Na pasta `codigos/app_livro/python/`, instale as dependências e o navegador usado pelo Playwright:

```powershell
python -m pip install -r requirements-test.txt
python -m playwright install chromium
python -m unittest discover -s tests -p "test_*.py" -v
```

Os testes locais não precisam de credenciais Supabase. Os testes de API são opcionais, dependem de configuração de ambiente e ficam desativados por padrão. Os scripts `teste_*.py` fora de `tests/` são testes manuais de integração e podem criar dados no Supabase; revise o script e use um ambiente de teste antes de executá-los.

## Equipe (Grupo 21)

- Adriano de Moraes Oliveira
- Davi Rocha de Lima
- Gustavo Santos Alves
- Kelli dos Santos de Oliveira Costa
- Liliam da Silva Oliveira
- Robert Alves Camargo
- Tabatha de Oliveira Ferreira
- Vinicius Vidal Ramos da Silva

**Orientadora:** Ana Elisa Teixeira da Silva

**Polos:** Mogi das Cruzes, São Bernardo do Campo e Diadema

## Repositório

[pji2-univesp no GitHub](https://github.com/Vinicius-Vidal-Silva/pji2-univesp)
