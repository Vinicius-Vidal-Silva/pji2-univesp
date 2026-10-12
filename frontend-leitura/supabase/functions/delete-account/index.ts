import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function removeUserFiles(adminClient: ReturnType<typeof createClient>, bucket: string, userId: string) {
  const paths: string[] = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const { data, error } = await adminClient.storage.from(bucket).list(userId, {
      limit: pageSize,
      offset,
    });
    if (error) throw error;

    paths.push(...(data || [])
      .filter((file) => file.id)
      .map((file) => `${userId}/${file.name}`));

    if (!data || data.length < pageSize) break;
    offset += pageSize;
  }

  if (paths.length > 0) {
    const { error } = await adminClient.storage.from(bucket).remove(paths);
    if (error) throw error;
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405);

  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: 'Autenticação necessária.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'A função não está configurada no Supabase.' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) return jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Falha ao excluir conta:', deleteError.message);
    return jsonResponse({ error: 'Não foi possível excluir a conta.' }, 500);
  }

  let storageCleanupWarning = false;
  for (const bucket of ['fotos-perfil', 'fotos-capas']) {
    try {
      await removeUserFiles(adminClient, bucket, user.id);
    } catch (error) {
      storageCleanupWarning = true;
      console.error(`Falha ao limpar arquivos de ${bucket}:`, error);
    }
  }

  return jsonResponse({ deleted: true, storageCleanupWarning });
});
