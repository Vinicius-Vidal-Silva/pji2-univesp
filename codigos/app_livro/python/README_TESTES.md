# Testes do TrocaLivros

Os testes automatizados ficam em `tests/` e usam `unittest`. Os scripts `teste_*.py` que já existiam na pasta continuam sendo fluxos manuais de integração; alguns criam usuários, livros, propostas e mensagens no Supabase.

## Preparação

No PowerShell, a partir desta pasta:

```powershell
python -m pip install -r requirements-test.txt
python -m playwright install chromium
```

O Node.js e as dependências do frontend (`frontend-leitura/node_modules`) também são necessários. Os testes GUI iniciam e encerram o Vite automaticamente.

## Executar testes locais

```powershell
python -m unittest discover -s tests -p "test_*.py" -v
```

Os testes unitários e GUI não precisam de credenciais Supabase. Os testes unitários executam as funções JavaScript usadas pelo formulário de cadastro via Node.js, sem manter uma implementação duplicada em Python.

## Executar testes de API

Os testes de API ficam desativados por padrão e só fazem leituras no Supabase e no Google Books. Configure no ambiente ou em um `.env` valores `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` (ou `SUPABASE_URL` e `SUPABASE_KEY`), depois habilite explicitamente:

```powershell
$env:RUN_API_TESTS = "1"
python -m unittest discover -s tests -p "test_*.py" -v
Remove-Item Env:RUN_API_TESTS
```

Sem as credenciais Supabase, apenas esse teste será ignorado; o teste Google Books continua podendo executar, pois consulta um endpoint público. Nenhum teste automatizado grava ou remove dados do banco.