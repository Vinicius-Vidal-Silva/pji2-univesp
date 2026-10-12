import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

const PAGE_SIZE = 1000;
const BOOK_STATUSES = ['Disponível', 'Em Negociação', 'Trocado'];
const PROPOSAL_STATUSES = ['Pendente', 'Aceita', 'Recusada', 'Cancelada'];
const STATUS_COLORS = {
  Disponível: '#16877a',
  'Em Negociação': '#df7546',
  Trocado: '#596b86',
  Pendente: '#d0a23b',
  Aceita: '#16877a',
  Recusada: '#bd4e51',
  Cancelada: '#758195',
};

async function fetchGoldRows(supabase, view, columns, orderBy) {
  const rows = [];
  let offset = 0;

  while (true) {
    const query = supabase.schema('gold').from(view)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    const { data, error } = await query;
    if (error) throw error;

    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
    offset += PAGE_SIZE;
  }
}

function isWithinRange(value, startDate, endDate) {
  if (!value) return false;
  const dateValue = typeof value === 'string' ? value.slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return false;
  if (startDate && dateValue < startDate) return false;
  if (endDate && dateValue > endDate) return false;
  return true;
}

function monthKey(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 7);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function median(values) {
  const sorted = values.filter((value) => value !== null && value !== undefined && value !== '').map(Number).filter(Number.isFinite).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function Panel({ title, note, children, className = '' }) {
  return (
    <section className={`min-w-0 border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {note && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, detail, accent = '#16877a' }) {
  return (
    <article className="min-w-0 border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 h-1 w-9" style={{ backgroundColor: accent }} />
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100" title={String(value)}>{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>}
    </article>
  );
}

function EmptyChart({ children = 'Sem dados para os filtros selecionados.' }) {
  return <div className="flex h-64 items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-400">{children}</div>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-800">
      {label && <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-slate-600 dark:text-slate-300">
          <span className="mr-1 inline-block h-2 w-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: {Number(entry.value).toLocaleString('pt-BR')}{String(entry.dataKey).includes('taxa') ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard({ supabase }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [bookStatusFilter, setBookStatusFilter] = useState('');
  const [proposalStatusFilter, setProposalStatusFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadIssues, setLoadIssues] = useState([]);
  const [loadedAt, setLoadedAt] = useState(null);
  const [dashboardData, setDashboardData] = useState({ users: [], books: [], proposals: [], demand: [], timeToTrade: [] });

  useEffect(() => {
    let isCurrent = true;

    async function loadSection(view, columns, orderBy) {
      try {
        return { data: await fetchGoldRows(supabase, view, columns, orderBy), error: null };
      } catch (error) {
        return { data: [], error: `${view}: ${error.message}` };
      }
    }

    async function loadDashboard() {
      const [users, books, proposals, demand, timeToTrade] = await Promise.all([
        loadSection('vw_fato_usuarios', 'data_referencia, total_usuarios', 'data_referencia'),
        loadSection('vw_fato_acervo_livros', 'livro_id, data_referencia, status, tema_genero, estado_conservacao, data_cadastro_bronze, data_inicio_status_silver, status_silver_e_snapshot_base', 'data_referencia'),
        loadSection('vw_fato_propostas', 'proposta_id, data_referencia, data_criacao_bronze, data_atualizacao_bronze, status_proposta', 'data_referencia'),
        loadSection('vw_fato_demanda_genero', 'tema_genero, data_referencia, total_livros_cadastrados, total_livros_em_negociacao_ou_trocados, total_livros_trocados, taxa_conversao_percentual, taxa_troca_concluida_percentual', 'data_referencia'),
        loadSection('vw_fato_tempo_troca', 'livro_id, titulo, tema_genero, data_referencia, data_criacao_bronze, data_cadastro, data_troca, data_inicio_disponivel_silver, data_inicio_negociacao_silver, dias_para_troca', 'data_referencia'),
      ]);

      if (!isCurrent) return;
      setDashboardData({ users: users.data, books: books.data, proposals: proposals.data, demand: demand.data, timeToTrade: timeToTrade.data });
      setLoadIssues([users, books, proposals, demand, timeToTrade].map((section) => section.error).filter(Boolean));
      setLoadedAt(new Date());
      setIsLoading(false);
    }

    loadDashboard();
    return () => { isCurrent = false; };
  }, [supabase, refreshKey]);

  const books = dashboardData.books.filter((book) =>
    isWithinRange(book.data_referencia, startDate, endDate)
    && (!genreFilter || book.tema_genero === genreFilter)
    && (!bookStatusFilter || book.status === bookStatusFilter));
  const users = dashboardData.users.filter((user) => isWithinRange(user.data_referencia, startDate, endDate));
  const proposals = dashboardData.proposals.filter((proposal) =>
    isWithinRange(proposal.data_referencia, startDate, endDate)
    && (!proposalStatusFilter || proposal.status_proposta === proposalStatusFilter));
  const demandRows = dashboardData.demand.filter((row) =>
    isWithinRange(row.data_referencia, startDate, endDate)
    && (!genreFilter || row.tema_genero === genreFilter));
  const timeToTrade = dashboardData.timeToTrade.filter((row) =>
    isWithinRange(row.data_referencia, startDate, endDate)
    && (!genreFilter || row.tema_genero === genreFilter));

  const demandByGenre = new Map();
  for (const row of demandRows) {
    const aggregate = demandByGenre.get(row.tema_genero) || {
      tema_genero: row.tema_genero,
      total_livros_cadastrados: 0,
      total_livros_em_negociacao_ou_trocados: 0,
      total_livros_trocados: 0,
    };
    aggregate.total_livros_cadastrados += Number(row.total_livros_cadastrados || 0);
    aggregate.total_livros_em_negociacao_ou_trocados += Number(row.total_livros_em_negociacao_ou_trocados || 0);
    aggregate.total_livros_trocados += Number(row.total_livros_trocados || 0);
    demandByGenre.set(row.tema_genero, aggregate);
  }
  const demand = [...demandByGenre.values()].map((row) => ({
    ...row,
    taxa_conversao_percentual: row.total_livros_cadastrados ? row.total_livros_em_negociacao_ou_trocados / row.total_livros_cadastrados * 100 : 0,
    taxa_troca_concluida_percentual: row.total_livros_cadastrados ? row.total_livros_trocados / row.total_livros_cadastrados * 100 : 0,
  }));

  const availableBooks = books.filter((book) => book.status === 'Disponível').length;
  const totalUsers = users.reduce((total, row) => total + Number(row.total_usuarios || 0), 0);
  const acceptedProposals = proposals.filter((proposal) => proposal.status_proposta === 'Aceita').length;
  const acceptanceRate = proposals.length ? (acceptedProposals / proposals.length) * 100 : 0;
  const medianDays = median(timeToTrade.map((row) => row.dias_para_troca));

  const monthMap = new Map();
  for (const user of users) {
    const key = monthKey(user.data_referencia);
    if (key) monthMap.set(key, { month: key, users: (monthMap.get(key)?.users || 0) + Number(user.total_usuarios || 0), proposals: monthMap.get(key)?.proposals || 0 });
  }
  for (const proposal of proposals) {
    const key = monthKey(proposal.data_referencia);
    if (key) monthMap.set(key, { month: key, users: monthMap.get(key)?.users || 0, proposals: (monthMap.get(key)?.proposals || 0) + 1 });
  }
  const monthlyActivity = [...monthMap.values()].sort((left, right) => left.month.localeCompare(right.month)).map((row) => ({ ...row, monthLabel: monthLabel(row.month) }));

  const bookStatusData = BOOK_STATUSES.map((status) => ({ name: status, livros: books.filter((book) => book.status === status).length }));
  const proposalsByMonth = new Map();
  for (const proposal of proposals) {
    const key = monthKey(proposal.data_referencia);
    if (!key) continue;
    const entry = proposalsByMonth.get(key) || { month: key, ...Object.fromEntries(PROPOSAL_STATUSES.map((status) => [status, 0])) };
    entry[proposal.status_proposta] = (entry[proposal.status_proposta] || 0) + 1;
    proposalsByMonth.set(key, entry);
  }
  const proposalTrend = [...proposalsByMonth.values()].sort((left, right) => left.month.localeCompare(right.month)).map((row) => ({ ...row, monthLabel: monthLabel(row.month) }));

  const pendingProposals = proposals.filter((proposal) => proposal.status_proposta === 'Pendente');
  const now = loadedAt?.getTime() ?? 0;
  const agingData = [
    { name: 'Até 2 dias', propostas: 0 },
    { name: '3–7 dias', propostas: 0 },
    { name: 'Mais de 7 dias', propostas: 0 },
  ];
  for (const proposal of pendingProposals) {
    const ageDays = Math.max(0, (now - new Date(proposal.data_criacao_bronze).getTime()) / 86400000);
    if (ageDays <= 2) agingData[0].propostas += 1;
    else if (ageDays <= 7) agingData[1].propostas += 1;
    else agingData[2].propostas += 1;
  }

  const genres = [...new Set([
    ...dashboardData.books.map((book) => book.tema_genero),
    ...dashboardData.demand.map((row) => row.tema_genero),
    ...dashboardData.timeToTrade.map((row) => row.tema_genero),
  ].filter(Boolean))].sort((left, right) => left.localeCompare(right, 'pt-BR'));
  const slowestTrades = [...timeToTrade].sort((left, right) => Number(right.dias_para_troca) - Number(left.dias_para_troca)).slice(0, 8);
  const filterClass = 'min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadIssues([]);
    setRefreshKey((current) => current + 1);
  };

  return (
    <section className="w-full space-y-5 pb-8" aria-labelledby="admin-dashboard-heading">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-700">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">TrocaLivros · Administração</p>
          <h2 id="admin-dashboard-heading" className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">Dashboard gerencial</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Indicadores de comunidade, acervo e operação de trocas.</p>
        </div>
        <button type="button" onClick={handleRefresh} disabled={isLoading} className="self-start rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50 sm:self-auto dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800">
          {isLoading ? 'Atualizando…' : 'Atualizar dados'}
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-700" aria-label="Filtros globais">
        <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">De
          <input className={filterClass} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Até
          <input className={filterClass} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Gênero
          <select className={filterClass} value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
            <option value="">Todos</option>{genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Status do livro
          <select className={filterClass} value={bookStatusFilter} onChange={(event) => setBookStatusFilter(event.target.value)}>
            <option value="">Todos</option>{BOOK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Status da proposta
          <select className={filterClass} value={proposalStatusFilter} onChange={(event) => setProposalStatusFilter(event.target.value)}>
            <option value="">Todos</option>{PROPOSAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </section>

      {loadIssues.length > 0 && (
        <div className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="status">
          <p className="font-bold">Parte dos dados não pôde ser carregada.</p>
          <p className="mt-1">Verifique as permissões das tabelas e se o schema `gold` está exposto na API do Supabase.</p>
          <ul className="mt-2 list-inside list-disc text-xs">{loadIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
        </div>
      )}

      <nav className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700" aria-label="Seções do dashboard">
        {[
          ['overview', 'Visão geral'],
          ['inventory', 'Acervo e gêneros'],
          ['trades', 'Performance de trocas'],
        ].map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined} className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-teal-700 text-teal-800 dark:border-teal-300 dark:text-teal-200' : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}>
            {label}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-500" role="status">Carregando indicadores…</div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
                <Kpi label="Novos usuários" value={totalUsers.toLocaleString('pt-BR')} detail="No período selecionado" accent="#596b86" />
                <Kpi label="Livros cadastrados" value={books.length.toLocaleString('pt-BR')} detail={`${availableBooks.toLocaleString('pt-BR')} disponíveis`} accent="#16877a" />
                <Kpi label="Propostas criadas" value={proposals.length.toLocaleString('pt-BR')} detail={`${acceptedProposals.toLocaleString('pt-BR')} aceitas atualmente`} accent="#df7546" />
                <Kpi label="Taxa de aceite" value={`${acceptanceRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} detail="Aceitas ÷ propostas no período" accent="#d0a23b" />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Panel title="Cadastros e propostas ao longo do tempo" note="Série mensal conforme as datas de criação; não representa a data de mudança de status.">
                  {monthlyActivity.length ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyActivity} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="users" name="Novos usuários" stroke="#596b86" strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="proposals" name="Propostas criadas" stroke="#16877a" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyChart />}
                </Panel>

                <Panel title="Situação atual do acervo" note="Contagem de livros conforme o status atual na tabela Bronze.">
                  {books.length ? (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bookStatusData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="livros" name="Livros" radius={[2, 2, 0, 0]}>
                            {bookStatusData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyChart />}
                </Panel>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Panel title="Oferta e conversão aparente por gênero" note="Fonte Gold: livros em negociação ou trocados são contados como conversão na view atual.">
                  {demand.length ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={demand} margin={{ top: 8, right: 4, bottom: 42, left: -14 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <XAxis dataKey="tema_genero" angle={-28} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="books" allowDecimals={false} tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="rate" orientation="right" unit="%" tick={{ fontSize: 10 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend verticalAlign="top" />
                          <Bar yAxisId="books" dataKey="total_livros_cadastrados" name="Livros cadastrados" fill="#16877a" radius={[2, 2, 0, 0]} />
                          <Line yAxisId="rate" type="monotone" dataKey="taxa_conversao_percentual" name="Conversão aparente" stroke="#df7546" strokeWidth={2.5} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyChart>View Gold indisponível ou sem dados. Confira o schema e os grants no Supabase.</EmptyChart>}
                </Panel>

                <Panel title="Oferta versus conversão" note="Cada ponto representa um gênero; procura por gêneros com baixa oferta e alta conversão aparente.">
                  {demand.length ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 12, right: 20, bottom: 22, left: 2 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <XAxis type="number" dataKey="total_livros_cadastrados" name="Livros cadastrados" tick={{ fontSize: 10 }} label={{ value: 'Livros cadastrados', position: 'insideBottom', offset: -12, fontSize: 11 }} />
                          <YAxis type="number" dataKey="taxa_conversao_percentual" name="Conversão aparente" unit="%" tick={{ fontSize: 10 }} />
                          <ZAxis type="category" dataKey="tema_genero" name="Gênero" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                          <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="4 4" />
                          <Scatter name="Gêneros" data={demand} fill="#df7546" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyChart>View Gold indisponível ou sem dados. Confira o schema e os grants no Supabase.</EmptyChart>}
                </Panel>
              </div>

              <Panel title="Livros por gênero e situação" note="Origem Bronze; permite observar onde o acervo permanece disponível ou avança para negociação/troca.">
                {books.length ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={genres.map((genre) => ({
                        genero: genre,
                        ...Object.fromEntries(BOOK_STATUSES.map((status) => [status, books.filter((book) => book.tema_genero === genre && book.status === status).length])),
                      })).filter((row) => BOOK_STATUSES.some((status) => row[status] > 0))} margin={{ top: 8, right: 12, bottom: 42, left: -18 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="genero" angle={-28} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend verticalAlign="top" />
                        {BOOK_STATUSES.map((status) => <Bar key={status} dataKey={status} stackId="books" fill={STATUS_COLORS[status]} />)}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <EmptyChart />}
              </Panel>
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Kpi label="Propostas pendentes" value={pendingProposals.length.toLocaleString('pt-BR')} detail="Estado atual" accent="#d0a23b" />
                <Kpi label="Mediana até negociação" value={medianDays === null ? '—' : `${medianDays.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`} detail="View Gold; marco atual é Em Negociação" accent="#16877a" />
                <Kpi label="Livros com negociação" value={timeToTrade.length.toLocaleString('pt-BR')} detail="Registros retornados pela view Gold" accent="#596b86" />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Panel title="Propostas criadas por mês e status atual" note="O status é o estado atual; o modelo não registra quando a proposta mudou de status.">
                  {proposalTrend.length ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={proposalTrend} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend />
                          {PROPOSAL_STATUSES.map((status) => <Bar key={status} dataKey={status} stackId="proposals" fill={STATUS_COLORS[status]} />)}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyChart />}
                </Panel>

                <Panel title="Envelhecimento das propostas pendentes" note="Faixas calculadas pela diferença entre agora e `created_at`.">
                  {pendingProposals.length ? (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="propostas" name="Propostas pendentes" fill="#d0a23b" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyChart>Não há propostas pendentes no período selecionado.</EmptyChart>}
                </Panel>
              </div>

              <Panel title="Livros que levaram mais tempo até iniciar negociação" note="O cálculo da view usa a primeira disponibilidade e a entrada em Em Negociação; não significa troca concluída.">
                {slowestTrades.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                      <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400"><th className="py-2 pr-4">Livro</th><th className="py-2 pr-4">Gênero</th><th className="py-2 pr-4">Cadastro</th><th className="py-2 pr-4">Negociação</th><th className="py-2 text-right">Dias</th></tr></thead>
                      <tbody>{slowestTrades.map((row) => (
                        <tr key={row.livro_id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                          <td className="max-w-64 truncate py-3 pr-4 font-semibold text-slate-800 dark:text-slate-100" title={row.titulo}>{row.titulo}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.tema_genero || '—'}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.data_cadastro ? new Date(row.data_cadastro).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.data_troca ? new Date(row.data_troca).toLocaleDateString('pt-BR') : '—'}</td>
                          <td className="py-3 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">{Number(row.dias_para_troca).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <EmptyChart>View Gold indisponível ou ainda sem livros negociados.</EmptyChart>}
              </Panel>
            </div>
          )}
        </>
      )}

    </section>
  );
}
