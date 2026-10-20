import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const savedLanguage = typeof window !== 'undefined'
  ? window.localStorage.getItem('trocalivros-language')
  : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: {
          navigation: {
            home: 'Início',
            showcase: 'Vitrine',
            dashboard: 'Dashboard',
            inventory: 'Meu Inventário',
            wishlist: 'Wishlist',
            trades: 'Minhas Trocas',
            profile: 'Meu Perfil',
          },
          language: { label: 'Selecionar idioma' },
          theme: { light: 'Ativar modo claro', dark: 'Ativar modo escuro' },
          auth: { logout: 'Sair', loginSignup: 'Entrar / Cadastrar' },
        },
      },
      en: {
        translation: {
          navigation: {
            home: 'Home',
            showcase: 'Browse',
            dashboard: 'Dashboard',
            inventory: 'My Inventory',
            wishlist: 'Wishlist',
            trades: 'My Trades',
            profile: 'My Profile',
          },
          language: { label: 'Select language' },
          theme: { light: 'Enable light mode', dark: 'Enable dark mode' },
          auth: { logout: 'Log out', loginSignup: 'Sign in / Sign up' },
        },
      },
    },
    lng: savedLanguage === 'en' ? 'en' : 'pt',
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('trocalivros-language', language);
  }
});

export default i18n;