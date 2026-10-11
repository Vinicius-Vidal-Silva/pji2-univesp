import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('trocalivros-theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem('trocalivros-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (!supabase) {
      setIsInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setCurrentScreen('dashboard'); // Se tem sessão no boot, vai pro dashboard
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      if (event === 'SIGNED_IN') {
        setCurrentScreen('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setCurrentScreen('landing');
        setSelectedBookForDetails(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };
  
  const navigateToBookDetails = (book) => {
    setSelectedBookForDetails(book);
    setCurrentScreen('book_details');
  };

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Carregando aplicação...</div>;
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'} flex flex-col font-sans`}>
        <header className={`${isDarkMode ? 'bg-slate-900 border-b border-slate-700' : 'bg-white shadow-sm border-b border-gray-200'} py-4 px-6 md:px-12 flex justify-between items-center z-10 relative`}>
          <div className="flex items-center gap-2">
            <span role="img" aria-label="Logo Livro Aberto" className="text-2xl">📖</span>
            <h1 className={`text-xl font-bold hidden sm:block ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>TrocaLivros</h1>
          </div>

          <nav aria-label="Navegação Principal">
            <ul className="flex items-center gap-2 md:gap-4">
              {user && (
                <>
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('dashboard'); setSelectedBookForDetails(null); }} 
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'dashboard' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      Vitrine
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('inventory'); setSelectedBookForDetails(null); }}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'inventory' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      Meu Inventário
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('wishlist'); setSelectedBookForDetails(null); }}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'wishlist' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      Wishlist
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('trades'); setSelectedBookForDetails(null); }}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'trades' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      Minhas Trocas
                    </button>
                  </li>
                </>
              )}
              
              {!user && (
                <li>
                  <button onClick={() => setCurrentScreen('landing')} className={`px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-700'}`}>
                    Início
                  </button>
                </li>
              )}

              <li>
                <button
                  type="button"
                  onClick={() => setIsDarkMode((prev) => !prev)}
                  className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
                >
                  {isDarkMode ? '☀️ Claro' : '🌙 Escuro'}
                </button>
              </li>
              
              <li>
                {user ? (
                  <button onClick={handleLogout} className="px-4 py-2 ml-2 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md transition-all">
                    Sair
                  </button>
                ) : (
                  <button onClick={() => setCurrentScreen('auth')} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm">
                    Entrar / Cadastrar
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </header>

        <main className={`flex-grow flex flex-col items-center p-4 md:p-8 ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
          <div className="w-full max-w-6xl">
          {currentScreen === 'landing' && !user && <LandingPage onNavigate={setCurrentScreen} />}
          {currentScreen === 'auth' && !user && (
            <div className="flex justify-center mt-10">
              <AuthPage onSignupSuccess={() => setNeedsProfileSetup(true)} />
            </div>
          )}
          
          {user && needsProfileSetup && (
            <ProfileSetupModal user={user} onComplete={() => setNeedsProfileSetup(false)} />
          )}

          {currentScreen === 'dashboard' && user && <DashboardPage user={user} onBookSelect={navigateToBookDetails} />}
          {currentScreen === 'inventory' && user && <InventoryPage user={user} />}
          {currentScreen === 'wishlist' && user && <WishlistPage user={user} />}
          {currentScreen === 'trades' && user && <TradesCenterPage user={user} />}
          {currentScreen === 'book_details' && user && selectedBookForDetails && (
             <BookDetailsPage 
               user={user} 
               book={selectedBookForDetails} 
               onBack={() => setCurrentScreen('dashboard')} 
             />
          )}
        </div>
      </main>

      {user && (
        <ClariceChat
          isDarkMode={isDarkMode}
          book={currentScreen === 'book_details' ? selectedBookForDetails : null}
        />
      )}
      
      <footer className="bg-gray-800 text-gray-300 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            &copy; {new Date().getFullYear()} TrocaLivros. Todos os direitos reservados.
          </div>
          <div className="text-sm font-medium flex items-center gap-2">
            <span>Projeto Integrador II</span>
            <span className="hidden md:inline">•</span>
            <span>Univesp</span>
          </div>
        </div>
      </footer>
    </div>
    </div>
  );
}

function ClariceChat({ isDarkMode, book }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou a Clarice. Quer conversar sobre livros, autores ou descobrir sua próxima leitura?' },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending || !supabase) return;

    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setErrorMessage('');
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('clarice-review', {
        body: {
          messages: nextMessages.slice(-12).map(({ role, content: messageContent }) => ({ role, content: messageContent })),
          ...(book ? { titulo: book.titulo, autor: book.autor } : {}),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const reply = data?.reply || data?.review;
      if (!reply) throw new Error('A assistente não retornou uma resposta.');
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (error) {
      let message = error.message || 'Não foi possível falar com a Clarice. Tente novamente.';
      if (error.context instanceof Response) {
        try {
          const responseBody = await error.context.clone().json();
          message = responseBody.error || responseBody.message || message;
        } catch {
          message = `${message} (${error.context.status})`;
        }
      }
      setErrorMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const panelColors = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-gray-200 text-gray-900';

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section className={`flex h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border shadow-2xl ${panelColors}`} aria-label="Chat com Clarice">
          <header className={`flex items-center justify-between border-b px-4 py-3 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
            <div>
              <h2 className="font-semibold">Clarice</h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Sua companhia literária</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded p-2 text-xl leading-none hover:bg-black/5" aria-label="Fechar conversa">×</button>
          </header>

          {book && (
            <div className={`border-b px-4 py-2 text-xs ${isDarkMode ? 'border-slate-700 text-slate-300' : 'border-gray-200 text-gray-600'}`}>
              Conversando sobre <strong>{book.titulo}</strong>, de {book.autor}
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-blue-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-gray-100 text-gray-800'}`}>
                {message.content}
              </div>
            ))}
            {isSending && <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} role="status">Clarice está pensando...</p>}
            {errorMessage && <p className="text-sm text-red-600" role="alert">{errorMessage}</p>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={`flex gap-2 border-t p-3 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Converse sobre literatura..."
              maxLength={2000}
              aria-label="Mensagem para Clarice"
              className={`min-w-0 flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'border-slate-600 bg-slate-800 placeholder:text-slate-400' : 'border-gray-300 bg-white'}`}
            />
            <button type="submit" disabled={isSending || !input.trim()} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Enviar mensagem">Enviar</button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen((open) => !open)} className="flex h-12 items-center gap-2 rounded-full bg-blue-700 px-4 font-semibold text-white shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-expanded={isOpen} aria-label={isOpen ? 'Fechar chat com Clarice' : 'Abrir chat com Clarice'}>
        <span aria-hidden="true">✦</span>
        <span>Clarice</span>
      </button>
    </div>
  );
}

function ProfileSetupModal({ user, onComplete }) {
  const [bio, setBio] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let avatarUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('fotos-perfil').getPublicUrl(filePath);
        avatarUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('usuarios').update({
        bio: bio,
        foto_perfil_url: avatarUrl
      }).eq('id', user.id);

      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Houve um erro ao salvar seu perfil. Você pode tentar novamente mais tarde.");
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete seu Perfil</h2>
        <p className="text-gray-600 text-sm mb-6">Ajude a comunidade a te conhecer melhor antes de realizar trocas.</p>
        
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-gray-400">👤</span>
              )}
            </div>
            <label className="cursor-pointer px-4 py-2 bg-gray-100 text-sm font-semibold rounded-md hover:bg-gray-200 transition">
              Escolher Foto
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Biografia Curta</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Ex: Estudante de Engenharia, apaixonado por ficção científica e tecnologia."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onComplete} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-md hover:bg-gray-200">
              Pular
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isSaving ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WishlistPage({ user }) {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  
  const [newWish, setNewWish] = useState({ titulo: '', autor: '' });

  const showFeedback = (msg, type = "success") => {
    setFeedbackMsg({ msg, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setWishlist(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user.id]);

  const handleAddWish = async (e) => {
    e.preventDefault();
    if (!newWish.titulo) return;
    
    setIsAdding(true);
    try {
      const { error } = await supabase.from('wishlist').insert([{
        usuario_id: user.id,
        titulo_desejado: newWish.titulo,
        autor_desejado: newWish.autor || 'Desconhecido'
      }]);

      if (error) throw error;
      showFeedback("Adicionado à Wishlist!", "success");
      setNewWish({ titulo: '', autor: '' });
      fetchWishlist();
    } catch (err) {
      showFeedback("Erro ao adicionar o livro à lista de desejos.", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveWish = async (id) => {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('id', id);
      if (error) throw error;
      setWishlist(wishlist.filter(w => w.id !== id));
      showFeedback("Removido da lista.", "success");
    } catch (err) {
      showFeedback("Erro ao remover.", "error");
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in relative">
      {feedbackMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-medium text-white transition-all ${feedbackMsg.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {feedbackMsg.msg}
        </div>
      )}

      <div className="flex flex-col mb-8 border-b pb-6">
        <h2 className="text-3xl font-bold text-gray-900">Minha Wishlist</h2>
        <p className="text-gray-600 mt-1">Cadastre os livros que você procura. Avisaremos caso alguém adicione um exemplar correspondente à plataforma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm self-start">
          <h3 className="font-bold text-lg mb-4">Adicionar Desejo</h3>
          <form onSubmit={handleAddWish} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Livro *</label>
              <input type="text" required value={newWish.titulo} onChange={(e) => setNewWish({...newWish, titulo: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="Ex: O Senhor dos Anéis" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
              <input type="text" value={newWish.autor} onChange={(e) => setNewWish({...newWish, autor: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="Ex: J.R.R. Tolkien" />
            </div>
            <button type="submit" disabled={isAdding} className="w-full py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isAdding ? 'Adicionando...' : 'Salvar na Lista'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <p className="text-gray-500">Carregando wishlist...</p>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 border-dashed">
              <span className="text-4xl block mb-4">⭐</span>
              <p className="text-gray-500 font-medium">Sua lista de desejos está vazia.</p>
              <p className="text-sm text-gray-400 mt-1">Adicione livros para ser notificado de futuros matches.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlist.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{item.titulo_desejado}</h4>
                    <p className="text-sm text-gray-500">{item.autor_desejado}</p>
                  </div>
                  <button onClick={() => handleRemoveWish(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" aria-label="Remover">
                    ✖
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TradesCenterPage({ user }) {
  const [activeTab, setActiveTab] = useState('pendentes');
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [activeChat, setActiveChat] = useState(null);

  const showFeedback = (msg, type = "success") => {
    setFeedbackMsg({ msg, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('propostas_troca')
        .select(`
          id, status_proposta, ofertante_id, recebedor_id,
          livro_desejado:livros!livro_desejado_id(id, titulo, foto_capa_url),
          itens_ofertados(
            livro_ofertado:livros!livro_ofertado_id(id, titulo, foto_capa_url)
          )
        `)
        .or(`ofertante_id.eq.${user.id},recebedor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (err) {
      console.error(err);
      showFeedback("Erro ao carregar propostas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [user.id]);

  const handleUpdateStatus = async (proposalId, newStatus, livroDesejadoId, livroOfertadoId) => {
    try {
      const { error } = await supabase
        .from('propostas_troca')
        .update({ status_proposta: newStatus })
        .eq('id', proposalId);

      if (error) throw error;

      if (newStatus === 'Aceita') {
        await supabase.from('livros').update({ status: 'Em Negociação' }).in('id', [livroDesejadoId, livroOfertadoId]);
      } else if (newStatus === 'Concluída') {
        await supabase.from('livros').update({ status: 'Trocado' }).in('id', [livroDesejadoId, livroOfertadoId]);
        setActiveChat(null);
      }

      showFeedback(`Proposta ${newStatus.toLowerCase()} com sucesso!`);
      fetchProposals();
    } catch (err) {
      showFeedback("Erro ao atualizar proposta.", "error");
    }
  };

  const renderProposalCard = (prop) => {
    const isReceiver = prop.recebedor_id === user.id;
    const livroOfertadoData = prop.itens_ofertados?.[0]?.livro_ofertado || null;

    return (
      <div key={prop.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-gray-500">ID: {prop.id.substring(0, 8)}...</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${prop.status_proposta === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : prop.status_proposta === 'Aceita' ? 'bg-blue-100 text-blue-800' : prop.status_proposta === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {prop.status_proposta}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-md">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-2">{isReceiver ? 'Seu Livro (Desejado)' : 'Livro Solicitado'}</p>
            <div className="h-24 w-16 mx-auto bg-gray-200 rounded overflow-hidden mb-2">
              {prop.livro_desejado?.foto_capa_url ? <img src={prop.livro_desejado.foto_capa_url} className="w-full h-full object-cover" alt="" /> : <div className="h-full flex items-center justify-center">📖</div>}
            </div>
            <p className="text-sm font-bold text-gray-800 truncate">{prop.livro_desejado?.titulo}</p>
          </div>
          
          <div className="text-2xl text-gray-400">⇆</div>

          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-2">{isReceiver ? 'Livro Oferecido a você' : 'Seu Livro Oferecido'}</p>
            <div className="h-24 w-16 mx-auto bg-gray-200 rounded overflow-hidden mb-2">
              {livroOfertadoData?.foto_capa_url ? <img src={livroOfertadoData.foto_capa_url} className="w-full h-full object-cover" alt="" /> : <div className="h-full flex items-center justify-center">📖</div>}
            </div>
            <p className="text-sm font-bold text-gray-800 truncate">{livroOfertadoData?.titulo}</p>
          </div>
        </div>

        {prop.status_proposta === 'Pendente' && isReceiver && (
          <div className="mt-4 flex gap-3">
            <button onClick={() => handleUpdateStatus(prop.id, 'Recusada')} className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded hover:bg-red-100 transition-colors">Recusar</button>
            <button onClick={() => handleUpdateStatus(prop.id, 'Aceita', prop.livro_desejado.id, livroOfertadoData?.id)} className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors">Aceitar Proposta</button>
          </div>
        )}

        {prop.status_proposta === 'Aceita' && (
          <div className="mt-4 flex gap-3">
            <button onClick={() => setActiveChat({ ...prop, livro_ofertado: livroOfertadoData })} className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors">Abrir Chat Logístico</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 animate-fade-in relative">
      {feedbackMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-medium text-white transition-all ${feedbackMsg.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`} role="alert">
          {feedbackMsg.msg}
        </div>
      )}

      {activeChat ? (
        <ChatInterface user={user} proposal={activeChat} onClose={() => setActiveChat(null)} onComplete={() => handleUpdateStatus(activeChat.id, 'Concluída', activeChat.livro_desejado.id, activeChat.livro_ofertado.id)} />
      ) : (
        <>
          <div className="flex flex-col mb-8 border-b pb-6">
            <h2 className="text-3xl font-bold text-gray-900">Central de Trocas</h2>
            <p className="text-gray-600 mt-1">Gerencie suas propostas e combine entregas.</p>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('pendentes')} className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'pendentes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Pendentes</button>
            <button onClick={() => setActiveTab('aceitas')} className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'aceitas' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Em Andamento (Chat)</button>
            <button onClick={() => setActiveTab('concluidas')} className={`pb-3 px-4 font-medium text-sm transition-colors ${activeTab === 'concluidas' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Histórico</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <p className="text-gray-500">Carregando propostas...</p>
            ) : proposals.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 font-medium">Nenhuma proposta encontrada.</p>
              </div>
            ) : (
              proposals
                .filter(p => {
                  if (activeTab === 'pendentes') return p.status_proposta === 'Pendente';
                  if (activeTab === 'aceitas') return p.status_proposta === 'Aceita';
                  return p.status_proposta === 'Concluída' || p.status_proposta === 'Recusada' || p.status_proposta === 'Cancelada';
                })
                .map(renderProposalCard)
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ChatInterface({ user, proposal, onClose, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('mensagens_chat')
        .select('*')
        .eq('troca_id', proposal.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    
    fetchMessages();
    
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens_chat', filter: `troca_id=eq.${proposal.id}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [proposal.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await supabase.from('mensagens_chat').insert([{
      troca_id: proposal.id,
      remetente_id: user.id,
      conteudo: newMessage
    }]);
    
    setNewMessage("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          <h3 className="font-bold text-gray-900">Chat Logístico</h3>
          <p className="text-xs text-gray-500">Proposta #{proposal.id.substring(0,8)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onComplete} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700">Confirmar Troca Concluída</button>
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-100">Voltar</button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 text-sm">Nenhuma mensagem ainda. Combine o local de entrega!</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`max-w-[70%] p-3 rounded-lg text-sm ${msg.remetente_id === user.id ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'}`}>
              {msg.conteudo}
            </div>
          ))
        )}
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-xl flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700">Enviar</button>
      </form>
    </div>
  );
}

function BookDetailsPage({ user, book, onBack }) {
  const [isProposing, setIsProposing] = useState(false);
  const [myInventory, setMyInventory] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [selectedBookToOffer, setSelectedBookToOffer] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState(null);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('nome_completo, foto_perfil_url, bio')
          .eq('id', book.dono_id)
          .single();
        if (data) setOwnerProfile(data);
      } catch (e) {
        console.error("Dono não possui perfil na tabela usuarios.");
      }
    };
    fetchOwner();
  }, [book.dono_id]);

  const fetchMyAvailableBooks = async () => {
    setIsLoadingInventory(true);
    try {
      const { data, error } = await supabase.from('livros').select('*').eq('dono_id', user.id).eq('status', 'Disponível');
      if (error) throw error;
      setMyInventory(data || []);
    } catch (err) {
      setFeedbackMsg({ msg: "Não foi possível carregar seus livros.", type: "error" });
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const showFeedback = (msg, type = "success") => {
    setFeedbackMsg({ msg, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleProposeTradeClick = () => {
    setIsProposing(true);
    fetchMyAvailableBooks();
  };

  const handleSendProposal = async () => {
    if (!selectedBookToOffer) {
      showFeedback("Selecione um livro do seu inventário para oferecer.", "error");
      return;
    }

    setIsSendingProposal(true);
    try {
      const { data: novaProposta, error: erroProposta } = await supabase
        .from('propostas_troca')
        .insert([{
          ofertante_id: user.id,
          recebedor_id: book.dono_id,
          livro_desejado_id: book.id,
          status_proposta: 'Pendente'
        }])
        .select()
        .single();
      
      if (erroProposta) throw erroProposta;

      const { error: erroItem } = await supabase
        .from('itens_ofertados')
        .insert([{
          proposta_id: novaProposta.id,
          livro_ofertado_id: selectedBookToOffer.id
        }]);

      if (erroItem) throw erroItem;

      showFeedback("Proposta enviada com sucesso!", "success");
      setTimeout(() => {
        setIsProposing(false);
        onBack();
      }, 2000);
    } catch (err) {
      console.error(err);
      showFeedback(`Erro ao enviar: ${err.message}`, "error");
    } finally {
      setIsSendingProposal(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {feedbackMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-medium text-white transition-all ${feedbackMsg.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`} role="alert">
          {feedbackMsg.msg}
        </div>
      )}

      <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline mb-4">
        <span aria-hidden="true" className="mr-2">←</span> Voltar para a Vitrine
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          
          <div className="md:w-1/3 bg-gray-50 flex items-center justify-center p-8 border-r border-gray-100">
             {book.foto_capa_url ? (
                <img src={book.foto_capa_url} alt={`Capa de ${book.titulo}`} className="w-full max-w-xs h-auto object-cover shadow-md rounded" />
              ) : (
                <div className="text-center p-12 bg-white rounded shadow-sm border border-gray-200">
                  <span className="text-6xl block mb-4" aria-hidden="true">📖</span>
                  <p className="text-gray-500 font-medium">Sem foto</p>
                </div>
              )}
          </div>

          <div className="md:w-2/3 p-6 md:p-10 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{book.titulo}</h2>
                <p className="text-xl text-gray-600 mb-6">por {book.autor}</p>
              </div>
              <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                {book.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Idioma</h3>
                <p className="text-gray-900 font-medium">{book.idioma || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gênero</h3>
                <p className="text-gray-900 font-medium">{book.tema_genero || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Conservação</h3>
                <p className="text-gray-900 font-medium">{book.estado_conservacao}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ISBN</h3>
                <p className="text-gray-900 font-medium">{book.isbn || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-4">
               <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                 {ownerProfile?.foto_perfil_url ? (
                    <img src={ownerProfile.foto_perfil_url} alt="Dono" className="w-full h-full object-cover" />
                 ) : (
                    <span className="text-xl">👤</span>
                 )}
               </div>
               <div>
                 <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Oferecido por</p>
                 <p className="text-gray-900 font-bold">{ownerProfile?.nome_completo || `Usuário ${book.dono_id.substring(0,6)}`}</p>
                 {ownerProfile?.bio && <p className="text-xs text-gray-600 line-clamp-1 mt-1">{ownerProfile.bio}</p>}
               </div>
            </div>

            <div className="mt-auto border-t border-gray-100 pt-6">
              {!isProposing ? (
                <button 
                  onClick={handleProposeTradeClick}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-md text-lg"
                >
                  Propor Troca
                </button>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 animate-fade-in">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Escolha um livro para oferecer</h3>
                  
                  {isLoadingInventory ? (
                     <div className="text-center py-4 text-blue-600">Carregando...</div>
                  ) : myInventory.length === 0 ? (
                     <div className="bg-white p-4 rounded border border-blue-200 text-center text-gray-600">
                       Vazio. Vá ao inventário cadastrar um livro disponível.
                     </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-64 overflow-y-auto p-1">
                        {myInventory.map(myBook => (
                          <div 
                            key={myBook.id} 
                            onClick={() => setSelectedBookToOffer(myBook)}
                            className={`cursor-pointer border-2 rounded-md p-3 flex gap-3 items-center transition-all ${selectedBookToOffer?.id === myBook.id ? 'border-blue-600 bg-white shadow-sm ring-1 ring-blue-600' : 'border-transparent bg-white hover:border-blue-300'}`}
                          >
                            <div className="w-12 h-16 bg-gray-100 flex-shrink-0 rounded overflow-hidden">
                               {myBook.foto_capa_url ? <img src={myBook.foto_capa_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs">📖</div>}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-gray-900 truncate">{myBook.titulo}</p>
                              <p className="text-xs text-gray-500 truncate">{myBook.autor}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-3">
                         <button onClick={() => setIsProposing(false)} className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 font-medium rounded hover:bg-gray-50">Cancelar</button>
                         <button onClick={handleSendProposal} disabled={isSendingProposal || !selectedBookToOffer} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center">
                           {isSendingProposal ? 'Enviando...' : 'Confirmar Oferta'}
                         </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryPage({ user }) {
  const [myBooks, setMyBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const [isSearchingISBN, setIsSearchingISBN] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const initialFormState = {
    isbn: '', titulo: '', subtitulo: '', autor: '', coautor: '', volume_edicao: '',
    idioma: 'Português', tema_genero: '', estado_conservacao: '', foto_capa_url: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchMyBooks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('livros').select('*').eq('dono_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setMyBooks(data || []);
    } catch (err) {
      showFeedback("Erro ao carregar seu inventário.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, [user.id]);

  const showFeedback = (msg, type = "success") => {
    setFeedbackMsg({ msg, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSearchISBN = async () => {
    if (!formData.isbn) {
      showFeedback("Digite um ISBN.", "error");
      return;
    }
    
    setIsSearchingISBN(true);
    try {
      const cleanIsbn = formData.isbn.replace(/[- ]/g, '').trim();
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
      const authQuery = apiKey ? `&key=${apiKey}` : ''; 
      
      let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}${authQuery}`);
      let data = await res.json();

      if (!data.items || data.items.length === 0) {
        res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${cleanIsbn}${authQuery}`);
        data = await res.json();
      }

      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        let capaUrl = info.imageLinks?.smallThumbnail || info.imageLinks?.thumbnail || '';
        if (capaUrl.startsWith('http:')) capaUrl = capaUrl.replace('http:', 'https:');

        setFormData(prev => ({
          ...prev,
          titulo: info.title || prev.titulo,
          autor: info.authors ? info.authors.join(', ') : prev.autor,
          idioma: info.language === 'pt' ? 'Português' : info.language || 'Português',
          foto_capa_url: capaUrl || prev.foto_capa_url
        }));
        showFeedback("Encontrado!", "success");
      } else {
        showFeedback("Não encontrado no Google.", "error");
      }
    } catch (err) {
      showFeedback("Erro de conexão. Preencha manualmente.", "error");
    } finally {
      setIsSearchingISBN(false);
    }
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    if (!user || !user.id) {
      setIsSaving(false);
      return;
    }
    try {
      let finalCoverUrl = formData.foto_capa_url;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`; 
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('fotos-capas').upload(filePath, imageFile);
        if (uploadError) throw new Error(uploadError.message);
        const { data: publicUrlData } = supabase.storage.from('fotos-capas').getPublicUrl(filePath);
        finalCoverUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('livros').insert([{
        dono_id: user.id, isbn: formData.isbn || null, titulo: formData.titulo, autor: formData.autor,
        idioma: formData.idioma, tema_genero: formData.tema_genero, estado_conservacao: formData.estado_conservacao,
        foto_capa_url: finalCoverUrl || null, status: 'Disponível'
      }]);

      if (error) throw error;
      showFeedback("Adicionado!", "success");
      setIsModalOpen(false);
      setFormData(initialFormState);
      setImageFile(null); setPreviewImage(null); 
      fetchMyBooks(); 
    } catch (err) {
      showFeedback(`Erro: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {feedbackMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-medium text-white transition-all ${feedbackMsg.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {feedbackMsg.msg}
        </div>
      )}

      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold">Meu Inventário</h2>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
          ➕ Adicionar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : myBooks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-100 flex flex-col items-center">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-gray-500 font-medium">Seu inventário está vazio.</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-4 text-blue-600 font-bold hover:underline">Cadastrar meu primeiro exemplar</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {myBooks.map((book) => (
            <article key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="relative aspect-[2/3] bg-gray-100 flex items-center justify-center border-b border-gray-100">
                {book.foto_capa_url ? (
                  <img src={book.foto_capa_url} alt={`Capa de ${book.titulo}`} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-4xl" aria-hidden="true">📖</span>
                )}
                <div className="absolute top-2 right-2"><span className="text-xs font-bold px-2 py-1 rounded bg-white shadow-sm">{book.status}</span></div>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold line-clamp-2">{book.titulo}</h3>
                <p className="text-sm text-gray-600 line-clamp-1">{book.autor}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Novo Exemplar</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✖</button>
            </div>
            
            <form onSubmit={handleSaveBook} className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold mb-2">Autopreenchimento ISBN</label>
                <div className="flex gap-2">
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleFormChange} className="flex-grow px-3 py-2 border border-blue-200 rounded-md focus:ring-blue-500" placeholder="Ex: 9788535914849" />
                  <button type="button" onClick={handleSearchISBN} disabled={isSearchingISBN} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    {isSearchingISBN ? '...' : 'Buscar'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Título *</label><input type="text" name="titulo" value={formData.titulo} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md" /></div>
                <div><label className="block text-sm font-medium mb-1">Autor *</label><input type="text" name="autor" value={formData.autor} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md" /></div>
                <div><label className="block text-sm font-medium mb-1">Idioma</label><input type="text" name="idioma" value={formData.idioma} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tema / Gênero *</label>
                  <select name="tema_genero" value={formData.tema_genero} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md"><option value="">Sel...</option><option value="Ficção Científica">Ficção Científica</option><option value="Tecnologia">Tecnologia</option><option value="Fantasia">Fantasia</option><option value="Romance">Romance</option><option value="Biografia">Biografia</option></select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado de Conservação *</label>
                  <select name="estado_conservacao" value={formData.estado_conservacao} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md"><option value="">Sel...</option><option value="Novo">Novo</option><option value="Seminovo">Seminovo</option><option value="Marcas de uso">Marcas de uso</option></select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Foto Real (Opcional)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
              </div>

              {(previewImage || formData.foto_capa_url) && (
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded border"><img src={previewImage || formData.foto_capa_url} alt="Capa" className="h-24 object-cover rounded shadow-sm" /></div>
              )}

              <div className="pt-6 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border text-gray-700 rounded-md font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700">{isSaving ? 'Salvando...' : 'Salvar Livro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardPage({ user, onBookSelect }) {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const availableGenres = [...new Set(books.map(b => b.tema_genero).filter(Boolean))];
  const availableStates = [...new Set(books.map(b => b.estado_conservacao).filter(Boolean))];

  useEffect(() => {
    async function fetchLivros() {
      setIsLoading(true);
      try {
        const { data } = await supabase.from('livros').select('*').eq('status', 'Disponível').neq('dono_id', user.id).order('created_at', { ascending: false });
        setBooks(data || []);
      } catch (err) {} finally {
        setIsLoading(false);
      }
    }
    fetchLivros();
  }, [user.id]);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || book.autor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = filterGenre === '' || book.tema_genero === filterGenre;
    const matchesEstado = filterEstado === '' || book.estado_conservacao === filterEstado;
    return matchesSearch && matchesGenre && matchesEstado;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex flex-col mb-8 border-b pb-6">
        <h2 className="text-3xl font-bold text-gray-900">Vitrine de Trocas</h2>
        <p className="text-gray-600 mt-1">Explore livros disponibilizados por outros leitores.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
        <input type="search" placeholder="Buscar por Título ou Autor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
        
        <div className="flex gap-4">
          <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="w-full md:w-48 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Todos os Gêneros</option>
            {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="w-full md:w-48 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Qualquer Estado</option>
            {availableStates.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <section>
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-100">
             <span className="text-4xl block mb-4">🔍</span>
             <p className="text-gray-500 font-medium">Nenhum livro encontrado com estes filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <article key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all flex flex-col h-full hover:border-blue-300" onClick={() => onBookSelect(book)}>
                <div className="relative aspect-[2/3] bg-gray-100 flex items-center justify-center border-b">
                  {book.foto_capa_url ? (
                    <img src={book.foto_capa_url} alt={`Capa de ${book.titulo}`} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-4xl" aria-hidden="true">📖</span>
                  )}
                  <div className="absolute top-2 left-2"><span className="text-[10px] font-bold px-2 py-1 rounded bg-black bg-opacity-70 text-white shadow-sm">{book.estado_conservacao}</span></div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold line-clamp-2 text-gray-900">{book.titulo}</h3>
                  <p className="text-sm text-gray-600 line-clamp-1">{book.autor}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LandingPage({ onNavigate }) {
  return (
    <section className="max-w-4xl mx-auto text-center space-y-8 mt-12 md:mt-24 animate-fade-in" aria-labelledby="hero-heading">
      <h2 id="hero-heading" className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Renove sua estante. <br className="hidden md:block" /><span className="text-blue-600">Compartilhe conhecimento.</span></h2>
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Junte-se à nossa comunidade de leitores. Troque livros físicos que você já leu por novas aventuras literárias de forma simples e segura.</p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <button onClick={() => onNavigate('auth')} className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 shadow-md transform hover:-translate-y-1 transition-all">Começar a Trocar</button>
      </div>
    </section>
  );
}

function AuthPage({ onSignupSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg('');
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setErrorMsg('Senhas não coincidem.'); 
      setIsLoading(false); 
      return;
    }
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email: formData.email, 
          password: formData.password, 
          options: { data: { full_name: formData.fullName } } 
        });
        if (error) throw error;
        
        if (data.user && onSignupSuccess) {
           onSignupSuccess(); 
        }
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">{isLogin ? 'Entrar na Plataforma' : 'Criar sua conta'}</h2>
      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded border border-red-200">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Senha</label><input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        {!isLogin && <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirme a Senha</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-md mt-2 hover:bg-blue-700 transition-colors shadow-sm">{isLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}</button>
      </form>
      <div className="mt-6 text-center border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-600">{isLogin ? 'Ainda não tem conta? ' : 'Já possui uma conta? '}</span>
        <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-blue-600 font-bold hover:underline">{isLogin ? 'Cadastre-se' : 'Faça login'}</button>
      </div>
    </div>
  );
}
