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
          navigation: { home: 'Início', showcase: 'Vitrine', dashboard: 'Dashboard', inventory: 'Meu Inventário', wishlist: 'Wishlist', trades: 'Minhas Trocas', profile: 'Meu Perfil' },
          language: { label: 'Selecionar idioma' },
          theme: { light: 'Ativar modo claro', dark: 'Ativar modo escuro' },
          auth: {
            logout: 'Sair', loginSignup: 'Entrar / Cadastrar', passwordMismatch: 'As senhas não coincidem.',
            loginTitle: 'Entrar na Plataforma', signupTitle: 'Criar sua conta', fullName: 'Nome Completo',
            email: 'E-mail', password: 'Senha', confirmPassword: 'Confirme a Senha', processing: 'Processando...',
            login: 'Entrar', signup: 'Cadastrar', noAccount: 'Ainda não tem conta? ', hasAccount: 'Já possui uma conta? ',
          },
          home: { title: 'Bem-vindo à Plataforma de Troca de Livros', subtitle: 'Incentivando a leitura através da troca.' },
          accessibility: { bookLogo: 'Logo Livro Aberto', mainNavigation: 'Navegação Principal' },
          common: {
            loadingApp: 'Carregando aplicação...', loadingDashboard: 'Carregando dashboard...', loading: 'Carregando...',
            send: 'Enviar', skip: 'Pular', saving: 'Salvando...', sending: 'Enviando...', back: 'Voltar',
            noPhoto: 'Sem foto', notAvailable: 'N/A', cancel: 'Cancelar', close: 'Fechar', select: 'Selecione...', listSeparator: ' e ',
          },
          footer: { rightsReserved: 'Todos os direitos reservados.', project: 'Projeto Integrador II' },
          clarice: {
            greeting: 'Olá! Sou a Clarice. Quer conversar sobre livros, autores ou descobrir sua próxima leitura?',
            noReply: 'A assistente não retornou uma resposta.', requestError: 'Não foi possível falar com a Clarice. Tente novamente.',
            chatLabel: 'Chat com Clarice', tagline: 'Sua companhia literária', close: 'Fechar conversa',
            aboutBook: 'Conversando sobre {{title}}, de {{author}}', thinking: 'Clarice está pensando...',
            placeholder: 'Converse sobre literatura...', messageLabel: 'Mensagem para Clarice',
            closeChat: 'Fechar chat com Clarice', openChat: 'Abrir chat com Clarice',
          },
          profileSetup: {
            title: 'Complete seu Perfil', description: 'Ajude a comunidade a te conhecer melhor antes de realizar trocas.',
            photoPreview: 'Prévia da foto', choosePhoto: 'Escolher Foto', bio: 'Biografia Curta',
            bioPlaceholder: 'Ex: Estudante de Engenharia, apaixonado por ficção científica e tecnologia.',
            save: 'Salvar Perfil', saveError: 'Não foi possível salvar o perfil: {{message}}',
          },
          profile: {
            loadError: 'Não foi possível carregar seu perfil: {{message}}', imageLimitError: 'Escolha uma imagem de até 5 MB.',
            photoUpdatedDeleteError: 'Perfil atualizado, mas não foi possível apagar a foto anterior: {{message}}',
            updated: 'Perfil atualizado.', updateError: 'Não foi possível atualizar o perfil: {{message}}',
            passwordMismatch: 'As senhas não coincidem.', passwordError: 'Não foi possível alterar a senha: {{message}}',
            passwordUpdated: 'Senha alterada.',
            deleteConfirmation: 'Excluir sua conta permanentemente? Seus dados e livros associados serão removidos. Essa ação não pode ser desfeita.',
            deleteError: 'Não foi possível excluir a conta: {{message}}',
            deleteStorageWarning: 'Sua conta foi excluída, mas alguns arquivos não puderam ser removidos do armazenamento.',
            loading: 'Carregando perfil...', title: 'Meu Perfil', currentPhoto: 'Foto atual do perfil',
            changePhoto: 'Alterar foto', removePhoto: 'Remover foto', imageLimit: 'Imagem até 5 MB',
            bio: 'Biografia', bioPlaceholder: 'Conte um pouco sobre você e suas leituras.', save: 'Salvar perfil',
            changePassword: 'Alterar senha', newPassword: 'Nova senha', confirmPassword: 'Confirmar nova senha',
            changingPassword: 'Alterando...', deleteAccount: 'Excluir conta',
            deleteDescription: 'A exclusão remove seu perfil e os dados associados e não pode ser desfeita.',
            deletingAccount: 'Excluindo conta...', deleteMyAccount: 'Excluir minha conta',
          },
          wishlist: {
            added: 'Adicionado à Wishlist!', addError: 'Erro ao adicionar o livro à lista de desejos.',
            removed: 'Removido da lista.', removeError: 'Erro ao remover.', title: 'Minha Wishlist',
            description: 'Cadastre os livros que você procura. Avisaremos caso alguém adicione um exemplar correspondente à plataforma.',
            addHeading: 'Adicionar Desejo', bookTitleRequired: 'Título do Livro *', bookTitlePlaceholder: 'Ex: O Senhor dos Anéis',
            author: 'Autor', authorPlaceholder: 'Ex: J.R.R. Tolkien', adding: 'Adicionando...', save: 'Salvar na Lista',
            loading: 'Carregando wishlist...', emptyTitle: 'Sua lista de desejos está vazia.',
            emptyDescription: 'Adicione livros para ser notificado de futuros matches.', remove: 'Remover',
          },
          trades: {
            loadError: 'Erro ao carregar propostas', statusUpdated: 'Proposta {{status}} com sucesso!', updateError: 'Erro ao atualizar proposta.',
            proposalId: 'ID: {{id}}...', desiredBookMine: 'Seu Livro (Desejado)', requestedBook: 'Livro Solicitado',
            bookOfferedToYou: 'Livro Oferecido a você', bookOfferedByMe: 'Seu Livro Oferecido', reject: 'Recusar',
            accept: 'Aceitar Proposta', openChat: 'Abrir Chat Logístico', title: 'Central de Trocas',
            description: 'Gerencie suas propostas e combine entregas.', pendingTab: 'Pendentes',
            activeTab: 'Em Andamento (Chat)', historyTab: 'Histórico', loading: 'Carregando propostas...',
            empty: 'Nenhuma proposta encontrada.', logisticsChat: 'Chat Logístico', proposalNumber: 'Proposta #{{id}}',
            complete: 'Confirmar Troca Concluída', emptyChat: 'Nenhuma mensagem ainda. Combine o local de entrega!',
            messagePlaceholder: 'Digite sua mensagem...',
            status: { Pendente: 'Pendente', Aceita: 'Aceita', Concluída: 'Concluída', Recusada: 'Recusada', Cancelada: 'Cancelada' },
          },
          bookDetails: {
            inventoryError: 'Não foi possível carregar seus livros.', selectOffer: 'Selecione um livro do seu inventário para oferecer.',
            proposalSent: 'Proposta enviada com sucesso!', proposalError: 'Erro ao enviar: {{message}}',
            backToShowcase: 'Voltar para a Vitrine', byAuthor: 'por {{author}}', language: 'Idioma', genre: 'Gênero',
            condition: 'Conservação', isbn: 'ISBN', ownerPhoto: 'Dono', offeredBy: 'Oferecido por',
            userFallback: 'Usuário {{id}}', proposeTrade: 'Propor Troca', chooseBook: 'Escolha um livro para oferecer',
            noAvailableBooks: 'Vazio. Vá ao inventário cadastrar um livro disponível.', confirmOffer: 'Confirmar Oferta',
          },
          inventory: {
            loadError: 'Erro ao carregar seu inventário.', searchRequired: 'Informe um ISBN, título ou autor para buscar.',
            invalidIsbn: 'Informe um ISBN-13 válido para cadastrar o livro.', added: 'Adicionado!', saveError: 'Erro: {{message}}',
            title: 'Meu Inventário', add: 'Adicionar', empty: 'Seu inventário está vazio.',
            addFirst: 'Cadastrar meu primeiro exemplar', newCopy: 'Novo Exemplar', saveBook: 'Salvar Livro',
          },
          googleBooks: {
            searchError: 'Erro ao consultar o Google Books.', heading: 'Buscar no Google Books',
            description: 'Informe um ISBN-13 ou pesquise por título e autor. Só exibimos livros com ISBN-13.',
            termLabel: 'ISBN-13 ou título', termPlaceholder: 'Ex: 9788535914849 ou Dom Casmurro',
            authorLabel: 'Autor (opcional)', authorPlaceholder: 'Ex: Machado de Assis', searching: 'Buscando...',
            searchIsbn: 'Buscar ISBN', searchTitleAuthor: 'Buscar título e autor',
            noResults: 'Nenhum resultado com ISBN-13 foi encontrado. Você pode preencher os dados manualmente.',
            chooseBook: 'Escolha o livro correto', matchedBy: 'Busca por {{matches}}',
            match: { ISBN: 'ISBN', Título: 'título', Autor: 'autor' },
          },
          bookForm: {
            isbnRequired: 'ISBN-13 *', isbnPlaceholder: 'Selecione um resultado ou informe 13 dígitos',
            titleRequired: 'Título *', authorRequired: 'Autor *', language: 'Idioma', genreRequired: 'Tema / Gênero *',
            conditionRequired: 'Estado de Conservação *', realPhotoOptional: 'Foto Real (Opcional)',
          },
          book: {
            coverAlt: 'Capa de {{title}}', untitled: 'Título não informado', unknownAuthor: 'Autor não informado',
            languagePortuguese: 'Português',
            status: { Disponível: 'Disponível', 'Em Negociação': 'Em Negociação', Trocado: 'Trocado' },
            genres: { 'Ficção Científica': 'Ficção Científica', Tecnologia: 'Tecnologia', Fantasia: 'Fantasia', Romance: 'Romance', Biografia: 'Biografia' },
            conditions: { Novo: 'Novo', Seminovo: 'Seminovo', 'Marcas de uso': 'Marcas de uso' },
          },
          dashboard: {
            title: 'Vitrine de Trocas', description: 'Explore livros disponibilizados por outros leitores.',
            searchPlaceholder: 'Buscar por Título ou Autor...', searchLabel: 'Buscar por título ou autor',
            allGenres: 'Todos os Gêneros', anyCondition: 'Qualquer Estado', noBooks: 'Nenhum livro encontrado com estes filtros.',
          },
          landing: {
            title: 'Renove sua estante.', highlight: 'Compartilhe conhecimento.',
            description: 'Junte-se à nossa comunidade de leitores. Troque livros físicos que você já leu por novas aventuras literárias de forma simples e segura.',
            cta: 'Começar a Trocar',
          },
        },
      },
      en: {
        translation: {
          navigation: { home: 'Home', showcase: 'Browse', dashboard: 'Dashboard', inventory: 'My Inventory', wishlist: 'Wishlist', trades: 'My Trades', profile: 'My Profile' },
          language: { label: 'Select language' },
          theme: { light: 'Enable light mode', dark: 'Enable dark mode' },
          auth: {
            logout: 'Log out', loginSignup: 'Sign in / Sign up', passwordMismatch: 'Passwords do not match.',
            loginTitle: 'Sign in', signupTitle: 'Create your account', fullName: 'Full name', email: 'Email',
            password: 'Password', confirmPassword: 'Confirm password', processing: 'Processing...',
            login: 'Sign in', signup: 'Sign up', noAccount: "Don't have an account? ", hasAccount: 'Already have an account? ',
          },
          home: { title: 'Welcome to the Book Exchange Platform', subtitle: 'Encouraging reading through exchange.' },
          accessibility: { bookLogo: 'Open Book logo', mainNavigation: 'Main navigation' },
          common: {
            loadingApp: 'Loading application...', loadingDashboard: 'Loading dashboard...', loading: 'Loading...',
            send: 'Send', skip: 'Skip', saving: 'Saving...', sending: 'Sending...', back: 'Back',
            noPhoto: 'No photo', notAvailable: 'N/A', cancel: 'Cancel', close: 'Close', select: 'Select...', listSeparator: ' and ',
          },
          footer: { rightsReserved: 'All rights reserved.', project: 'Integrative Project II' },
          clarice: {
            greeting: "Hello! I'm Clarice. Want to talk about books or authors, or discover your next read?",
            noReply: 'The assistant did not return a response.', requestError: 'Could not reach Clarice. Please try again.',
            chatLabel: 'Chat with Clarice', tagline: 'Your literary companion', close: 'Close conversation',
            aboutBook: 'Talking about {{title}} by {{author}}', thinking: 'Clarice is thinking...',
            placeholder: 'Talk about literature...', messageLabel: 'Message for Clarice',
            closeChat: 'Close chat with Clarice', openChat: 'Open chat with Clarice',
          },
          profileSetup: {
            title: 'Complete your profile', description: 'Help the community get to know you before you make exchanges.',
            photoPreview: 'Photo preview', choosePhoto: 'Choose photo', bio: 'Short bio',
            bioPlaceholder: 'Example: Engineering student who loves science fiction and technology.',
            save: 'Save profile', saveError: 'Could not save profile: {{message}}',
          },
          profile: {
            loadError: 'Could not load your profile: {{message}}', imageLimitError: 'Choose an image up to 5 MB.',
            photoUpdatedDeleteError: 'Profile updated, but the previous photo could not be deleted: {{message}}',
            updated: 'Profile updated.', updateError: 'Could not update profile: {{message}}',
            passwordMismatch: 'Passwords do not match.', passwordError: 'Could not change password: {{message}}',
            passwordUpdated: 'Password changed.',
            deleteConfirmation: 'Permanently delete your account? Your data and associated books will be removed. This action cannot be undone.',
            deleteError: 'Could not delete account: {{message}}',
            deleteStorageWarning: 'Your account was deleted, but some files could not be removed from storage.',
            loading: 'Loading profile...', title: 'My Profile', currentPhoto: 'Current profile photo',
            changePhoto: 'Change photo', removePhoto: 'Remove photo', imageLimit: 'Image up to 5 MB', bio: 'Bio',
            bioPlaceholder: 'Tell us a little about yourself and what you read.', save: 'Save profile',
            changePassword: 'Change password', newPassword: 'New password', confirmPassword: 'Confirm new password',
            changingPassword: 'Changing...', deleteAccount: 'Delete account',
            deleteDescription: 'Deleting your account removes your profile and associated data. This cannot be undone.',
            deletingAccount: 'Deleting account...', deleteMyAccount: 'Delete my account',
          },
          wishlist: {
            added: 'Added to wishlist!', addError: 'Could not add the book to your wishlist.', removed: 'Removed from the list.',
            removeError: 'Could not remove item.', title: 'My Wishlist',
            description: 'Add books you are looking for. We will let you know if someone adds a matching copy to the platform.',
            addHeading: 'Add a book', bookTitleRequired: 'Book title *', bookTitlePlaceholder: 'Example: The Lord of the Rings',
            author: 'Author', authorPlaceholder: 'Example: J.R.R. Tolkien', adding: 'Adding...', save: 'Save to list',
            loading: 'Loading wishlist...', emptyTitle: 'Your wishlist is empty.',
            emptyDescription: 'Add books to be notified about future matches.', remove: 'Remove',
          },
          trades: {
            loadError: 'Could not load proposals.', statusUpdated: 'Proposal {{status}} successfully!', updateError: 'Could not update proposal.',
            proposalId: 'ID: {{id}}...', desiredBookMine: 'Your requested book', requestedBook: 'Requested book',
            bookOfferedToYou: 'Book offered to you', bookOfferedByMe: 'Your offered book', reject: 'Decline',
            accept: 'Accept proposal', openChat: 'Open exchange chat', title: 'Exchange Center',
            description: 'Manage your proposals and arrange delivery.', pendingTab: 'Pending', activeTab: 'In progress (Chat)',
            historyTab: 'History', loading: 'Loading proposals...', empty: 'No proposals found.',
            logisticsChat: 'Exchange chat', proposalNumber: 'Proposal #{{id}}', complete: 'Confirm exchange completion',
            emptyChat: 'No messages yet. Arrange a delivery location!', messagePlaceholder: 'Type your message...',
            status: { Pendente: 'Pending', Aceita: 'Accepted', Concluída: 'Completed', Recusada: 'Declined', Cancelada: 'Cancelled' },
          },
          bookDetails: {
            inventoryError: 'Could not load your books.', selectOffer: 'Select a book from your inventory to offer.',
            proposalSent: 'Proposal sent successfully!', proposalError: 'Could not send proposal: {{message}}',
            backToShowcase: 'Back to browse', byAuthor: 'by {{author}}', language: 'Language', genre: 'Genre',
            condition: 'Condition', isbn: 'ISBN', ownerPhoto: 'Owner', offeredBy: 'Offered by', userFallback: 'User {{id}}',
            proposeTrade: 'Propose exchange', chooseBook: 'Choose a book to offer',
            noAvailableBooks: 'No available books. Add an available book to your inventory first.', confirmOffer: 'Confirm offer',
          },
          inventory: {
            loadError: 'Could not load your inventory.', searchRequired: 'Enter an ISBN, title, or author to search.',
            invalidIsbn: 'Enter a valid ISBN-13 to add this book.', added: 'Added!', saveError: 'Error: {{message}}',
            title: 'My Inventory', add: 'Add', empty: 'Your inventory is empty.', addFirst: 'Add my first book',
            newCopy: 'New copy', saveBook: 'Save book',
          },
          googleBooks: {
            searchError: 'Could not search Google Books.', heading: 'Search Google Books',
            description: 'Enter an ISBN-13 or search by title and author. Only books with an ISBN-13 are shown.',
            termLabel: 'ISBN-13 or title', termPlaceholder: 'Example: 9788535914849 or Dom Casmurro',
            authorLabel: 'Author (optional)', authorPlaceholder: 'Example: Machado de Assis', searching: 'Searching...',
            searchIsbn: 'Search ISBN', searchTitleAuthor: 'Search title and author',
            noResults: 'No results with an ISBN-13 were found. You can enter the details manually.',
            chooseBook: 'Choose the correct book', matchedBy: 'Matched by {{matches}}',
            match: { ISBN: 'ISBN', Título: 'title', Autor: 'author' },
          },
          bookForm: {
            isbnRequired: 'ISBN-13 *', isbnPlaceholder: 'Select a result or enter 13 digits', titleRequired: 'Title *',
            authorRequired: 'Author *', language: 'Language', genreRequired: 'Topic / Genre *', conditionRequired: 'Condition *',
            realPhotoOptional: 'Actual photo (optional)',
          },
          book: {
            coverAlt: 'Cover of {{title}}', untitled: 'Title not provided', unknownAuthor: 'Author not provided', languagePortuguese: 'Portuguese',
            status: { Disponível: 'Available', 'Em Negociação': 'In negotiation', Trocado: 'Exchanged' },
            genres: { 'Ficção Científica': 'Science Fiction', Tecnologia: 'Technology', Fantasia: 'Fantasy', Romance: 'Romance', Biografia: 'Biography' },
            conditions: { Novo: 'New', Seminovo: 'Like new', 'Marcas de uso': 'Signs of use' },
          },
          dashboard: {
            title: 'Book Exchange', description: 'Explore books made available by other readers.',
            searchPlaceholder: 'Search by title or author...', searchLabel: 'Search by title or author',
            allGenres: 'All genres', anyCondition: 'Any condition', noBooks: 'No books match these filters.',
          },
          landing: {
            title: 'Refresh your bookshelf.', highlight: 'Share knowledge.',
            description: 'Join our community of readers. Easily and safely exchange physical books you have already read for new literary adventures.',
            cta: 'Start exchanging',
          },
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