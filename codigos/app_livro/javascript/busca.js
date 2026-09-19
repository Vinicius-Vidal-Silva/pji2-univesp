/**
 * Busca informações do livro na Google Books API usando o ISBN.
 * @param {string} isbn - O código ISBN do livro.
 * @returns {Promise<Object|null>}
 */
async function buscarLivroPorISBN(isbn) {
  const isbnLimpo = isbn.replace(/\D/g, '');

  if (isbnLimpo.length !== 10 && isbnLimpo.length !== 13) {
    console.error('ISBN inválido. Deve conter 10 ou 13 dígitos.');
    return null;
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  if (!apiKey) {
    console.error('ERRO: Chave da API não encontrada. Verifique o arquivo .env');
    return null;
  }

  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnLimpo}&key=${apiKey}`;

  try {
    const resposta = await fetch(url);
    
    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (dados.totalItems === 0 || !dados.items) {
       console.log('Livro não encontrado na base do Google Books.');
       return null;
    }

    const livroInfo = dados.items[0].volumeInfo;

    const livroExtraido = {
      titulo: livroInfo.title || '',
      subtitulo: livroInfo.subtitle || '',
      autor: livroInfo.authors ? livroInfo.authors[0] : 'Autor Desconhecido',
      coautor: livroInfo.authors && livroInfo.authors.length > 1 ? livroInfo.authors.slice(1).join(', ') : '',
      idioma: livroInfo.language === 'pt' || livroInfo.language === 'pt-BR' ? 'Português' : livroInfo.language,
      foto_capa_url: livroInfo.imageLinks && livroInfo.imageLinks.thumbnail 
          ? livroInfo.imageLinks.thumbnail.replace('http:', 'https:') 
          : null,
      sinopse: livroInfo.description || 'Sem descrição disponível.',
      texto_alternativo_capa: `Capa do livro ${livroInfo.title}`
    };

    return livroExtraido;

  } catch (erro) {
    console.error('Falha ao consultar a API do Google Books:', erro);
    return null;
  }
}

// Chamada de teste direta no final do arquivo
buscarLivroPorISBN('9788547000249').then(dados => console.log(dados));