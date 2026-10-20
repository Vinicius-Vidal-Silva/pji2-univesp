import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe, Moon, Sun } from 'lucide-react';
import { isIsbn13, normalizeIsbn, searchGoogleBooks } from './googleBooks.js';

const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'));

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const PROFILE_AVATAR_BUCKET = 'fotos-perfil';

function getProfileAvatarPath(publicUrl) {
  if (!publicUrl) return null;

  try {
    const marker = `/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/`;
    const pathname = new URL(publicUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex < 0 ? null : decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [user, setUser] = useState(null);
  const isAdmin = user?.app_metadata?.role === 'admin';
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">{t('common.loadingApp')}</div>;
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'} flex flex-col font-sans`}>
        <header className={`${isDarkMode ? 'bg-slate-900 border-b border-slate-700' : 'bg-white shadow-sm border-b border-gray-200'} py-3 px-4 sm:py-4 sm:px-6 md:px-12 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center z-10 relative`}>
          <div className="flex items-center gap-2">
            <span role="img" aria-label={t('accessibility.bookLogo')} className="text-2xl">📖</span>
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>TrocaLivros</h1>
          </div>

          <nav className="w-full sm:w-auto" aria-label={t('accessibility.mainNavigation')}>
            <ul className="flex flex-wrap items-center justify-center sm:justify-end gap-1 sm:gap-2 md:gap-4">
              {user && (
                <>
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('dashboard'); setSelectedBookForDetails(null); }} 
                      className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'dashboard' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      {t('navigation.showcase')}
                    </button>
                  </li>
                  {isAdmin && (
                    <li>
                      <button
                        onClick={() => { setCurrentScreen('admin_dashboard'); setSelectedBookForDetails(null); }}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'admin_dashboard' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                      >
                        {t('navigation.dashboard')}
                      </button>
                    </li>
                  )}
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('inventory'); setSelectedBookForDetails(null); }}
                      className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'inventory' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      {t('navigation.inventory')}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('wishlist'); setSelectedBookForDetails(null); }}
                      className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'wishlist' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      {t('navigation.wishlist')}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => { setCurrentScreen('trades'); setSelectedBookForDetails(null); }}
                      className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'trades' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      {t('navigation.trades')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setCurrentScreen('profile'); setSelectedBookForDetails(null); }}
                      className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentScreen === 'profile' ? (isDarkMode ? 'text-blue-300 bg-blue-950/60' : 'text-blue-700 bg-blue-50') : (isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-600')}`}
                    >
                      {t('navigation.profile')}
                    </button>
                  </li>
                </>
              )}
              
              {!user && (
                <li>
                  <button onClick={() => setCurrentScreen('landing')} className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'text-slate-300 hover:text-blue-300' : 'text-gray-600 hover:text-blue-700'}`}>
                    {t('navigation.home')}
                  </button>
                </li>
              )}

              <li>
                <label className={`relative inline-flex items-center gap-1.5 rounded-md px-2 py-2 transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${isDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                  <Globe size={16} aria-hidden="true" />
                  <select
                    value={i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'pt'}
                    onChange={(event) => i18n.changeLanguage(event.target.value)}
                    aria-label={t('language.label')}
                    className="appearance-none bg-transparent pr-3 text-xs font-semibold focus:outline-none"
                  >
                    <option value="pt">PT</option>
                    <option value="en">EN</option>
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-1" aria-hidden="true" />
                </label>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => setIsDarkMode((prev) => !prev)}
                  className={`rounded-md p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-amber-300' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-700'}`}
                  aria-label={isDarkMode ? t('theme.light') : t('theme.dark')}
                  title={isDarkMode ? t('theme.light') : t('theme.dark')}
                >
                  {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                </button>
              </li>
              
              <li>
                {user ? (
                  <button onClick={handleLogout} className="px-3 sm:px-4 py-2 border border-red-200 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md transition-all">
                    {t('auth.logout')}
                  </button>
                ) : (
                  <button onClick={() => setCurrentScreen('auth')} className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm">
                    {t('auth.loginSignup')}
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </header>

        <main className={`flex-grow flex flex-col items-center p-3 sm:p-4 md:p-8 ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
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
          {currentScreen === 'admin_dashboard' && user && isAdmin && (
            <Suspense fallback={<p className="py-12 text-center text-slate-500" role="status">{t('common.loadingDashboard')}</p>}>
              <AdminDashboard supabase={supabase} />
            </Suspense>
          )}
          {currentScreen === 'inventory' && user && <InventoryPage user={user} />}
          {currentScreen === 'wishlist' && user && <WishlistPage user={user} />}
          {currentScreen === 'trades' && user && <TradesCenterPage user={user} />}
          {currentScreen === 'profile' && user && (
            <ProfileSettingsPage
              user={user}
              onAccountDeleted={() => { setUser(null); setCurrentScreen('landing'); }}
            />
          )}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="text-sm">
            &copy; {new Date().getFullYear()} TrocaLivros. {t('footer.rightsReserved')}
          </div>
          <div className="text-sm font-medium flex items-center gap-2">
            <span>{t('footer.project')}</span>
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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('clarice.greeting') },
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
      if (!reply) throw new Error(t('clarice.noReply'));
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (error) {
      let message = error.message || t('clarice.requestError');
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
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <section className={`flex h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border shadow-2xl ${panelColors}`} aria-label={t('clarice.chatLabel')}>
          <header className={`flex items-center justify-between border-b px-4 py-3 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
            <div>
              <h2 className="font-semibold">Clarice</h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('clarice.tagline')}</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded p-2 text-xl leading-none hover:bg-black/5" aria-label={t('clarice.close')}>×</button>
          </header>

          {book && (
            <div className={`border-b px-4 py-2 text-xs ${isDarkMode ? 'border-slate-700 text-slate-300' : 'border-gray-200 text-gray-600'}`}>
              {t('clarice.aboutBook', { title: book.titulo, author: book.autor })}
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-blue-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-gray-100 text-gray-800'}`}>
                {message.content}
              </div>
            ))}
            {isSending && <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} role="status">{t('clarice.thinking')}</p>}
            {errorMessage && <p className="text-sm text-red-600" role="alert">{errorMessage}</p>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={`flex gap-2 border-t p-3 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('clarice.placeholder')}
              maxLength={2000}
              aria-label={t('clarice.messageLabel')}
              className={`min-w-0 flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'border-slate-600 bg-slate-800 placeholder:text-slate-400' : 'border-gray-300 bg-white'}`}
            />
            <button type="submit" disabled={isSending || !input.trim()} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label={t('common.send')}>{t('common.send')}</button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen((open) => !open)} className="flex h-12 items-center gap-2 rounded-full bg-blue-700 px-4 font-semibold text-white shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-expanded={isOpen} aria-label={isOpen ? t('clarice.closeChat') : t('clarice.openChat')}>
        <span aria-hidden="true">✦</span>
        <span>Clarice</span>
      </button>
    </div>
  );
}

function ProfileSetupModal({ user, onComplete }) {
  const { t } = useTranslation();
  const [bio, setBio] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      let avatarUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || imageFile.type.split('/').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        });
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
      setErrorMessage(t('profileSetup.saveError', { message: err.message }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profileSetup.title')}</h2>
        <p className="text-gray-600 text-sm mb-6">{t('profileSetup.description')}</p>
        {errorMessage && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{errorMessage}</p>}
        
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
              {previewImage ? (
                <img src={previewImage} alt={t('profileSetup.photoPreview')} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-gray-400">👤</span>
              )}
            </div>
            <label className="cursor-pointer px-4 py-2 bg-gray-100 text-sm font-semibold rounded-md hover:bg-gray-200 transition">
              {t('profileSetup.choosePhoto')}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profileSetup.bio')}</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder={t('profileSetup.bioPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={onComplete} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-md hover:bg-gray-200">
              {t('common.skip')}
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isSaving ? t('common.saving') : t('profileSetup.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileSettingsPage({ user, onAccountDeleted }) {
  const { t } = useTranslation();
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      const { data, error } = await supabase
        .from('usuarios')
        .select('bio, foto_perfil_url')
        .eq('id', user.id)
        .single();

      if (!isCurrent) return;
      if (error) {
        setFeedback({ type: 'error', message: t('profile.loadError', { message: error.message }) });
      } else {
        setBio(data.bio || '');
        setPhotoUrl(data.foto_perfil_url);
        setPreviewUrl(data.foto_perfil_url);
      }
      setIsLoading(false);
    }

    loadProfile();
    return () => { isCurrent = false; };
  }, [user.id]);

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: t('profile.imageLimitError') });
      event.target.value = '';
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemovePhoto(false);
    setFeedback(null);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setFeedback(null);

    let uploadedPath = null;
    let nextPhotoUrl = photoUrl;
    const previousPath = getProfileAvatarPath(photoUrl);

    try {
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop() || imageFile.type.split('/').pop() || 'jpg';
        const uniqueFileName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.${fileExtension}`;
        uploadedPath = `${user.id}/${uniqueFileName}`;
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .upload(uploadedPath, imageFile, { contentType: imageFile.type, upsert: false });
        if (uploadError) throw uploadError;
        nextPhotoUrl = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
      } else if (removePhoto) {
        nextPhotoUrl = null;
      }

      const { error } = await supabase.from('usuarios').update({
        bio: bio.trim() || null,
        foto_perfil_url: nextPhotoUrl,
      }).eq('id', user.id);
      if (error) throw error;

      setPhotoUrl(nextPhotoUrl);
      setPreviewUrl(nextPhotoUrl);
      setImageFile(null);
      setRemovePhoto(false);

      if (previousPath && previousPath !== uploadedPath && (imageFile || removePhoto)) {
        const { error: removeError } = await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([previousPath]);
        if (removeError) {
          setFeedback({ type: 'error', message: t('profile.photoUpdatedDeleteError', { message: removeError.message }) });
          return;
        }
      }

      setFeedback({ type: 'success', message: t('profile.updated') });
    } catch (error) {
      if (uploadedPath) await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([uploadedPath]);
      setFeedback({ type: 'error', message: t('profile.updateError', { message: error.message }) });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: t('profile.passwordMismatch') });
      return;
    }

    setIsSavingPassword(true);
    setFeedback(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSavingPassword(false);
    if (error) {
      setFeedback({ type: 'error', message: t('profile.passwordError', { message: error.message }) });
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setFeedback({ type: 'success', message: t('profile.passwordUpdated') });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t('profile.deleteConfirmation'));
    if (!confirmed) return;

    setIsDeletingAccount(true);
    setFeedback(null);
    const { data, error } = await supabase.functions.invoke('delete-account');
    if (error) {
      setIsDeletingAccount(false);
      setFeedback({ type: 'error', message: t('profile.deleteError', { message: error.message }) });
      return;
    }

    if (data?.storageCleanupWarning) {
      window.alert(t('profile.deleteStorageWarning'));
    }
    await supabase.auth.signOut({ scope: 'local' });
    onAccountDeleted();
  };

  if (isLoading) return <p className="py-12 text-center text-gray-600" role="status">{t('profile.loading')}</p>;

  return (
    <section className="w-full max-w-3xl space-y-8" aria-labelledby="profile-heading">
      <header className="border-b border-gray-200 pb-5 dark:border-slate-700">
        <h2 id="profile-heading" className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('profile.title')}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{user.email}</p>
      </header>

      {feedback && (
        <p className={`rounded-md border p-3 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.message}
        </p>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-slate-600 dark:bg-slate-800">
            {previewUrl && !removePhoto ? <img src={previewUrl} alt={t('profile.currentPhoto')} className="h-full w-full object-cover" /> : <span className="text-3xl" aria-hidden="true">👤</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800">
              {t('profile.changePhoto')}
              <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
            </label>
            {(photoUrl || imageFile) && !removePhoto && (
              <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(null); setRemovePhoto(true); }} className="px-2 py-2 text-sm font-medium text-red-700 hover:underline dark:text-red-300">
                {t('profile.removePhoto')}
              </button>
            )}
            <span className="w-full text-xs text-gray-500 dark:text-slate-400">{t('profile.imageLimit')}</span>
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="mb-1 block text-sm font-semibold text-gray-800 dark:text-slate-200">{t('profile.bio')}</label>
          <textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} rows={4} placeholder={t('profile.bioPlaceholder')} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        </div>

        <button type="submit" disabled={isSavingProfile} className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
          {isSavingProfile ? t('common.saving') : t('profile.save')}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="space-y-4 border-t border-gray-200 pt-6 dark:border-slate-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('profile.changePassword')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-semibold text-gray-800 dark:text-slate-200">{t('profile.newPassword')}</label>
            <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label htmlFor="confirm-new-password" className="mb-1 block text-sm font-semibold text-gray-800 dark:text-slate-200">{t('profile.confirmPassword')}</label>
            <input id="confirm-new-password" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          </div>
        </div>
        <button type="submit" disabled={isSavingPassword} className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800">
          {isSavingPassword ? t('profile.changingPassword') : t('profile.changePassword')}
        </button>
      </form>

      <div className="border-t border-red-200 pt-6 dark:border-red-900">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-300">{t('profile.deleteAccount')}</h3>
        <p className="mt-1 mb-4 text-sm text-gray-600 dark:text-slate-300">{t('profile.deleteDescription')}</p>
        <button type="button" onClick={handleDeleteAccount} disabled={isDeletingAccount} className="rounded-md border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40">
          {isDeletingAccount ? t('profile.deletingAccount') : t('profile.deleteMyAccount')}
        </button>
      </div>
    </section>
  );
}

function WishlistPage({ user }) {
  const { t } = useTranslation();
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
      showFeedback(t('wishlist.added'), "success");
      setNewWish({ titulo: '', autor: '' });
      fetchWishlist();
    } catch (err) {
      showFeedback(t('wishlist.addError'), "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveWish = async (id) => {
    try {
      const { error } = await supabase.from('wishlist').delete().eq('id', id);
      if (error) throw error;
      setWishlist(wishlist.filter(w => w.id !== id));
      showFeedback(t('wishlist.removed'), "success");
    } catch (err) {
      showFeedback(t('wishlist.removeError'), "error");
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
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('wishlist.title')}</h2>
        <p className="text-gray-600 mt-1">{t('wishlist.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm self-start">
          <h3 className="font-bold text-lg mb-4">{t('wishlist.addHeading')}</h3>
          <form onSubmit={handleAddWish} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('wishlist.bookTitleRequired')}</label>
              <input type="text" required value={newWish.titulo} onChange={(e) => setNewWish({...newWish, titulo: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder={t('wishlist.bookTitlePlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('wishlist.author')}</label>
              <input type="text" value={newWish.autor} onChange={(e) => setNewWish({...newWish, autor: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder={t('wishlist.authorPlaceholder')} />
            </div>
            <button type="submit" disabled={isAdding} className="w-full py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isAdding ? t('wishlist.adding') : t('wishlist.save')}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <p className="text-gray-500">{t('wishlist.loading')}</p>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 border-dashed">
              <span className="text-4xl block mb-4">⭐</span>
              <p className="text-gray-500 font-medium">{t('wishlist.emptyTitle')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('wishlist.emptyDescription')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlist.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{item.titulo_desejado}</h4>
                    <p className="text-sm text-gray-500">{item.autor_desejado}</p>
                  </div>
                  <button onClick={() => handleRemoveWish(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" aria-label={t('wishlist.remove')}>
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
  const { t } = useTranslation();
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
      showFeedback(t('trades.loadError'), "error");
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

      showFeedback(t('trades.statusUpdated', { status: t(`trades.status.${newStatus}`, { defaultValue: newStatus }) }));
      fetchProposals();
    } catch (err) {
      showFeedback(t('trades.updateError'), "error");
    }
  };

  const renderProposalCard = (prop) => {
    const isReceiver = prop.recebedor_id === user.id;
    const livroOfertadoData = prop.itens_ofertados?.[0]?.livro_ofertado || null;

    return (
      <div key={prop.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mb-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <span className="text-sm font-semibold text-gray-500">{t('trades.proposalId', { id: prop.id.substring(0, 8) })}</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${prop.status_proposta === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : prop.status_proposta === 'Aceita' ? 'bg-blue-100 text-blue-800' : prop.status_proposta === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {t(`trades.status.${prop.status_proposta}`, { defaultValue: prop.status_proposta })}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-md">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-2">{isReceiver ? t('trades.desiredBookMine') : t('trades.requestedBook')}</p>
            <div className="h-24 w-16 mx-auto bg-gray-200 rounded overflow-hidden mb-2">
              {prop.livro_desejado?.foto_capa_url ? <img src={prop.livro_desejado.foto_capa_url} className="w-full h-full object-cover" alt="" /> : <div className="h-full flex items-center justify-center">📖</div>}
            </div>
            <p className="text-sm font-bold text-gray-800 truncate">{prop.livro_desejado?.titulo}</p>
          </div>
          
          <div className="text-2xl text-gray-400 rotate-90 sm:rotate-0" aria-hidden="true">⇆</div>

          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-2">{isReceiver ? t('trades.bookOfferedToYou') : t('trades.bookOfferedByMe')}</p>
            <div className="h-24 w-16 mx-auto bg-gray-200 rounded overflow-hidden mb-2">
              {livroOfertadoData?.foto_capa_url ? <img src={livroOfertadoData.foto_capa_url} className="w-full h-full object-cover" alt="" /> : <div className="h-full flex items-center justify-center">📖</div>}
            </div>
            <p className="text-sm font-bold text-gray-800 truncate">{livroOfertadoData?.titulo}</p>
          </div>
        </div>

        {prop.status_proposta === 'Pendente' && isReceiver && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button onClick={() => handleUpdateStatus(prop.id, 'Recusada')} className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded hover:bg-red-100 transition-colors">{t('trades.reject')}</button>
            <button onClick={() => handleUpdateStatus(prop.id, 'Aceita', prop.livro_desejado.id, livroOfertadoData?.id)} className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors">{t('trades.accept')}</button>
          </div>
        )}

        {prop.status_proposta === 'Aceita' && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button onClick={() => setActiveChat({ ...prop, livro_ofertado: livroOfertadoData })} className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors">{t('trades.openChat')}</button>
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
            <h2 className="text-3xl font-bold text-gray-900">{t('trades.title')}</h2>
            <p className="text-gray-600 mt-1">{t('trades.description')}</p>
          </div>

          <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('pendentes')} className={`shrink-0 pb-3 px-3 sm:px-4 font-medium text-sm transition-colors ${activeTab === 'pendentes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('trades.pendingTab')}</button>
            <button onClick={() => setActiveTab('aceitas')} className={`shrink-0 pb-3 px-3 sm:px-4 font-medium text-sm transition-colors ${activeTab === 'aceitas' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('trades.activeTab')}</button>
            <button onClick={() => setActiveTab('concluidas')} className={`shrink-0 pb-3 px-3 sm:px-4 font-medium text-sm transition-colors ${activeTab === 'concluidas' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{t('trades.historyTab')}</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <p className="text-gray-500">{t('trades.loading')}</p>
            ) : proposals.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 font-medium">{t('trades.empty')}</p>
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
  const { t } = useTranslation();
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[min(600px,calc(100dvh-9rem))] min-h-80">
      <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center bg-gray-50 rounded-t-xl">
        <div>
          <h3 className="font-bold text-gray-900">{t('trades.logisticsChat')}</h3>
          <p className="text-xs text-gray-500">{t('trades.proposalNumber', { id: proposal.id.substring(0, 8) })}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={onComplete} className="px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700">{t('trades.complete')}</button>
          <button onClick={onClose} className="px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-100">{t('common.back')}</button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 text-sm">{t('trades.emptyChat')}</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`max-w-[90%] sm:max-w-[70%] break-words p-3 rounded-lg text-sm ${msg.remetente_id === user.id ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'}`}>
              {msg.conteudo}
            </div>
          ))
        )}
      </div>
      
      <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-xl flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('trades.messagePlaceholder')} className="min-w-0 flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="shrink-0 px-4 sm:px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700">{t('common.send')}</button>
      </form>
    </div>
  );
}

function BookDetailsPage({ user, book, onBack }) {
  const { t } = useTranslation();
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
      setFeedbackMsg({ msg: t('bookDetails.inventoryError'), type: "error" });
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
      showFeedback(t('bookDetails.selectOffer'), "error");
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

      showFeedback(t('bookDetails.proposalSent'), "success");
      setTimeout(() => {
        setIsProposing(false);
        onBack();
      }, 2000);
    } catch (err) {
      console.error(err);
      showFeedback(t('bookDetails.proposalError', { message: err.message }), "error");
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
        <span aria-hidden="true" className="mr-2">←</span> {t('bookDetails.backToShowcase')}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          
          <div className="md:w-1/3 bg-gray-50 flex items-center justify-center p-5 sm:p-8 border-b md:border-b-0 md:border-r border-gray-100">
             {book.foto_capa_url ? (
                <img src={book.foto_capa_url} alt={t('book.coverAlt', { title: book.titulo })} className="w-full max-w-xs h-auto object-cover shadow-md rounded" />
              ) : (
                <div className="text-center p-12 bg-white rounded shadow-sm border border-gray-200">
                  <span className="text-6xl block mb-4" aria-hidden="true">📖</span>
                  <p className="text-gray-500 font-medium">{t('common.noPhoto')}</p>
                </div>
              )}
          </div>

          <div className="md:w-2/3 p-4 sm:p-6 md:p-10 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{book.titulo}</h2>
                <p className="text-lg sm:text-xl text-gray-600 mb-6">{t('bookDetails.byAuthor', { author: book.autor })}</p>
              </div>
              <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                {t(`book.status.${book.status}`, { defaultValue: book.status })}
              </span>
            </div>

            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-y-4 gap-x-4 sm:gap-x-8 mb-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('bookDetails.language')}</h3>
                <p className="text-gray-900 font-medium">{book.idioma || t('common.notAvailable')}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('bookDetails.genre')}</h3>
                <p className="text-gray-900 font-medium">{book.tema_genero ? t(`book.genres.${book.tema_genero}`, { defaultValue: book.tema_genero }) : t('common.notAvailable')}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('bookDetails.condition')}</h3>
                <p className="text-gray-900 font-medium">{book.estado_conservacao ? t(`book.conditions.${book.estado_conservacao}`, { defaultValue: book.estado_conservacao }) : t('common.notAvailable')}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('bookDetails.isbn')}</h3>
                <p className="text-gray-900 font-medium">{book.isbn || t('common.notAvailable')}</p>
              </div>
            </div>

            <div className="mb-8 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3 sm:gap-4">
               <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                 {ownerProfile?.foto_perfil_url ? (
                    <img src={ownerProfile.foto_perfil_url} alt={t('bookDetails.ownerPhoto')} className="w-full h-full object-cover" />
                 ) : (
                    <span className="text-xl">👤</span>
                 )}
               </div>
               <div>
                 <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('bookDetails.offeredBy')}</p>
                 <p className="text-gray-900 font-bold">{ownerProfile?.nome_completo || t('bookDetails.userFallback', { id: book.dono_id.substring(0, 6) })}</p>
                 {ownerProfile?.bio && <p className="text-xs text-gray-600 line-clamp-1 mt-1">{ownerProfile.bio}</p>}
               </div>
            </div>

            <div className="mt-auto border-t border-gray-100 pt-6">
              {!isProposing ? (
                <button 
                  onClick={handleProposeTradeClick}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-md text-lg"
                >
                  {t('bookDetails.proposeTrade')}
                </button>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 animate-fade-in">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">{t('bookDetails.chooseBook')}</h3>
                  
                  {isLoadingInventory ? (
                     <div className="text-center py-4 text-blue-600">{t('common.loading')}</div>
                  ) : myInventory.length === 0 ? (
                     <div className="bg-white p-4 rounded border border-blue-200 text-center text-gray-600">
                       {t('bookDetails.noAvailableBooks')}
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
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                         <button onClick={() => setIsProposing(false)} className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 font-medium rounded hover:bg-gray-50">{t('common.cancel')}</button>
                         <button onClick={handleSendProposal} disabled={isSendingProposal || !selectedBookToOffer} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center">
                           {isSendingProposal ? t('common.sending') : t('bookDetails.confirmOffer')}
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
  const { t } = useTranslation();
  const [myBooks, setMyBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [googleBooksResults, setGoogleBooksResults] = useState([]);
  const [selectedGoogleBook, setSelectedGoogleBook] = useState(null);
  const [hasSearchedGoogleBooks, setHasSearchedGoogleBooks] = useState(false);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const initialFormState = {
    isbn: '', titulo: '', subtitulo: '', autor: '', coautor: '', volume_edicao: '',
    idioma: t('book.languagePortuguese'), tema_genero: '', estado_conservacao: '', foto_capa_url: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchMyBooks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('livros').select('*').eq('dono_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setMyBooks(data || []);
    } catch (err) {
      showFeedback(t('inventory.loadError'), "error");
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

  const handleSearchBooks = async () => {
    if (!searchTerm.trim() && !searchAuthor.trim()) {
      showFeedback(t('inventory.searchRequired'), "error");
      return;
    }

    setIsSearchingBooks(true);
    setHasSearchedGoogleBooks(true);
    setGoogleBooksResults([]);
    setSelectedGoogleBook(null);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
      const results = await searchGoogleBooks(
        { searchTerm, author: searchAuthor },
        apiKey,
      );
      setGoogleBooksResults(results);
    } catch (err) {
      showFeedback(err.message || t('googleBooks.searchError'), "error");
    } finally {
      setIsSearchingBooks(false);
    }
  };

  const handleSelectGoogleBook = (book) => {
    setSelectedGoogleBook(book);
    setFormData((prev) => ({
      ...prev,
      isbn: book.isbn,
      titulo: book.titulo || prev.titulo,
      autor: book.autor || prev.autor,
      idioma: book.idioma,
      foto_capa_url: book.foto_capa_url || prev.foto_capa_url,
    }));
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    if (!isIsbn13(formData.isbn)) {
      showFeedback(t('inventory.invalidIsbn'), "error");
      return;
    }
    const isbn = normalizeIsbn(formData.isbn);
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
        dono_id: user.id, isbn, titulo: formData.titulo, autor: formData.autor,
        idioma: formData.idioma, tema_genero: formData.tema_genero, estado_conservacao: formData.estado_conservacao,
        foto_capa_url: finalCoverUrl || null, status: 'Disponível'
      }]);

      if (error) throw error;
      showFeedback(t('inventory.added'), "success");
      setIsModalOpen(false);
      setFormData(initialFormState);
      setImageFile(null); setPreviewImage(null); 
      fetchMyBooks(); 
    } catch (err) {
      showFeedback(t('inventory.saveError', { message: err.message }), "error");
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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold">{t('inventory.title')}</h2>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
          ➕ {t('inventory.add')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : myBooks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-100 flex flex-col items-center">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-gray-500 font-medium">{t('inventory.empty')}</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-4 text-blue-600 font-bold hover:underline">{t('inventory.addFirst')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {myBooks.map((book) => (
            <article key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="relative aspect-[2/3] bg-gray-100 flex items-center justify-center border-b border-gray-100">
                {book.foto_capa_url ? (
                  <img src={book.foto_capa_url} alt={t('book.coverAlt', { title: book.titulo })} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-4xl" aria-hidden="true">📖</span>
                )}
                <div className="absolute top-2 right-2"><span className="text-xs font-bold px-2 py-1 rounded bg-white shadow-sm">{t(`book.status.${book.status}`, { defaultValue: book.status })}</span></div>
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
              <h3 className="text-xl font-bold text-gray-900">{t('inventory.newCopy')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label={t('common.close')}>✖</button>
            </div>
            
            <form onSubmit={handleSaveBook} className="p-6 space-y-6">
              <section className="space-y-4 rounded-lg bg-blue-50 p-4 dark:bg-slate-800" aria-labelledby="google-books-search-heading">
                <div>
                  <h4 id="google-books-search-heading" className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('googleBooks.heading')}</h4>
                  <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">{t('googleBooks.description')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="google-books-title-or-isbn" className="mb-1 block text-sm font-medium text-gray-800 dark:text-slate-200">{t('googleBooks.termLabel')}</label>
                    <input
                      id="google-books-title-or-isbn"
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-blue-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      placeholder={t('googleBooks.termPlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="google-books-author" className="mb-1 block text-sm font-medium text-gray-800 dark:text-slate-200">{t('googleBooks.authorLabel')}</label>
                    <input
                      id="google-books-author"
                      type="search"
                      value={searchAuthor}
                      onChange={(event) => setSearchAuthor(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-blue-200 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      placeholder={t('googleBooks.authorPlaceholder')}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSearchBooks}
                  disabled={isSearchingBooks}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                >
                  {isSearchingBooks ? t('googleBooks.searching') : isIsbn13(searchTerm) ? t('googleBooks.searchIsbn') : t('googleBooks.searchTitleAuthor')}
                </button>

                {hasSearchedGoogleBooks && !isSearchingBooks && googleBooksResults.length === 0 && (
                  <p className="text-sm text-gray-700 dark:text-slate-200" role="status">{t('googleBooks.noResults')}</p>
                )}

                {googleBooksResults.length > 0 && (
                  <div className="space-y-3" aria-live="polite">
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('googleBooks.chooseBook')}</h5>
                    <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                      {googleBooksResults.map((book) => (
                        <button
                          key={book.isbn}
                          type="button"
                          aria-pressed={selectedGoogleBook?.isbn === book.isbn}
                          onClick={() => handleSelectGoogleBook(book)}
                          className={`flex min-w-0 items-center gap-3 rounded-md border p-3 text-left transition ${selectedGoogleBook?.isbn === book.isbn ? 'border-blue-600 bg-white ring-2 ring-blue-500 dark:bg-slate-900' : 'border-blue-200 bg-white hover:border-blue-400 dark:border-slate-600 dark:bg-slate-900'}`}
                        >
                          {book.foto_capa_url ? (
                            <img src={book.foto_capa_url} alt="" className="h-20 w-14 shrink-0 rounded object-cover" />
                          ) : (
                            <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-2xl dark:bg-slate-800" aria-hidden="true">📖</span>
                          )}
                          <span className="min-w-0">
                            <span className="block line-clamp-2 text-sm font-semibold text-gray-900 dark:text-slate-100">{book.titulo || t('book.untitled')}</span>
                            <span className="mt-1 block truncate text-xs text-gray-600 dark:text-slate-300">{book.autor || t('book.unknownAuthor')}</span>
                            <span className="mt-1 block break-all text-xs text-gray-500 dark:text-slate-400">ISBN-13: {book.isbn}</span>
                            <span className="mt-1 block text-xs text-blue-700 dark:text-blue-300">{t('googleBooks.matchedBy', { matches: book.matches.map((match) => t(`googleBooks.match.${match}`, { defaultValue: match })).join(t('common.listSeparator')) })}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full"><label htmlFor="book-isbn" className="block text-sm font-medium mb-1">{t('bookForm.isbnRequired')}</label><input id="book-isbn" type="text" inputMode="numeric" autoComplete="off" name="isbn" value={formData.isbn} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md" placeholder={t('bookForm.isbnPlaceholder')} /></div>
                <div className="col-span-full"><label className="block text-sm font-medium mb-1">{t('bookForm.titleRequired')}</label><input type="text" name="titulo" value={formData.titulo} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md" /></div>
                <div><label className="block text-sm font-medium mb-1">{t('bookForm.authorRequired')}</label><input type="text" name="autor" value={formData.autor} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md" /></div>
                <div><label className="block text-sm font-medium mb-1">{t('bookForm.language')}</label><input type="text" name="idioma" value={formData.idioma} onChange={handleFormChange} className="w-full px-3 py-2 border rounded-md" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('bookForm.genreRequired')}</label>
                  <select name="tema_genero" value={formData.tema_genero} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md"><option value="">{t('common.select')}</option><option value="Ficção Científica">{t('book.genres.Ficção Científica')}</option><option value="Tecnologia">{t('book.genres.Tecnologia')}</option><option value="Fantasia">{t('book.genres.Fantasia')}</option><option value="Romance">{t('book.genres.Romance')}</option><option value="Biografia">{t('book.genres.Biografia')}</option></select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('bookForm.conditionRequired')}</label>
                  <select name="estado_conservacao" value={formData.estado_conservacao} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded-md"><option value="">{t('common.select')}</option><option value="Novo">{t('book.conditions.Novo')}</option><option value="Seminovo">{t('book.conditions.Seminovo')}</option><option value="Marcas de uso">{t('book.conditions.Marcas de uso')}</option></select>
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1">{t('bookForm.realPhotoOptional')}</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
              </div>

              {(previewImage || formData.foto_capa_url) && (
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded border"><img src={previewImage || formData.foto_capa_url} alt={t('book.coverAlt', { title: formData.titulo })} className="h-24 object-cover rounded shadow-sm" /></div>
              )}

              <div className="pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border text-gray-700 rounded-md font-medium hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700">{isSaving ? t('common.saving') : t('inventory.saveBook')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardPage({ user, onBookSelect }) {
  const { t } = useTranslation();
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
        <h2 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h2>
        <p className="text-gray-600 mt-1">{t('dashboard.description')}</p>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 sm:gap-4 mb-8">
        <input type="search" placeholder={t('dashboard.searchPlaceholder')} aria-label={t('dashboard.searchLabel')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="min-w-0 flex-grow px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
        
        <div className="flex flex-col min-[420px]:flex-row gap-3 sm:gap-4">
          <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="min-w-0 w-full md:w-48 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">{t('dashboard.allGenres')}</option>
            {availableGenres.map(g => <option key={g} value={g}>{t(`book.genres.${g}`, { defaultValue: g })}</option>)}
          </select>
          
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="min-w-0 w-full md:w-48 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">{t('dashboard.anyCondition')}</option>
            {availableStates.map(e => <option key={e} value={e}>{t(`book.conditions.${e}`, { defaultValue: e })}</option>)}
          </select>
        </div>
      </div>

      <section>
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-100">
             <span className="text-4xl block mb-4">🔍</span>
             <p className="text-gray-500 font-medium">{t('dashboard.noBooks')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <article key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all flex flex-col h-full hover:border-blue-300" onClick={() => onBookSelect(book)}>
                <div className="relative aspect-[2/3] bg-gray-100 flex items-center justify-center border-b">
                  {book.foto_capa_url ? (
                    <img src={book.foto_capa_url} alt={t('book.coverAlt', { title: book.titulo })} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-4xl" aria-hidden="true">📖</span>
                  )}
                  <div className="absolute top-2 left-2"><span className="text-[10px] font-bold px-2 py-1 rounded bg-black bg-opacity-70 text-white shadow-sm">{t(`book.conditions.${book.estado_conservacao}`, { defaultValue: book.estado_conservacao })}</span></div>
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
  const { t } = useTranslation();
  return (
    <section className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 mt-8 sm:mt-12 md:mt-24 animate-fade-in" aria-labelledby="hero-heading">
      <h2 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{t('landing.title')} <br className="hidden md:block" /><span className="text-blue-600">{t('landing.highlight')}</span></h2>
      <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">{t('landing.description')}</p>
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <button onClick={() => onNavigate('auth')} className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 shadow-md transform hover:-translate-y-1 transition-all">{t('landing.cta')}</button>
      </div>
    </section>
  );
}

function AuthPage({ onSignupSuccess }) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg('');
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch')); 
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
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-5 sm:p-8 border border-gray-100 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">{isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}</h2>
      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded border border-red-200">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && <div><label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullName')}</label><input id="fullName" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
        <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label><input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        <div><label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label><input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        {!isLogin && <div><label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')}</label><input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-md mt-2 hover:bg-blue-700 transition-colors shadow-sm">{isLoading ? t('auth.processing') : (isLogin ? t('auth.login') : t('auth.signup'))}</button>
      </form>
      <div className="mt-6 text-center border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-600">{isLogin ? t('auth.noAccount') : t('auth.hasAccount')}</span>
        <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-blue-600 font-bold hover:underline">{isLogin ? t('auth.signup') : t('auth.login')}</button>
      </div>
    </div>
  );
}
