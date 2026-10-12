export function normalizeIsbn(isbn) {
  return String(isbn ?? '').replace(/\D/g, '');
}

export function isIsbn13(value) {
  const input = String(value ?? '');
  return !/\p{L}/u.test(input) && /^\d{13}$/.test(normalizeIsbn(input));
}

export function buildGoogleBooksUrl(query, apiKey = '') {
  const params = new URLSearchParams({ q: query });
  if (apiKey) params.set('key', apiKey);
  return `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
}

export function mapGoogleBooksVolume(volume = {}) {
  const imageUrl = volume.imageLinks?.smallThumbnail || volume.imageLinks?.thumbnail || '';
  const isbn13 = volume.industryIdentifiers?.find(
    (identifier) => identifier.type === 'ISBN_13' && isIsbn13(identifier.identifier),
  );

  return {
    isbn: isbn13 ? normalizeIsbn(isbn13.identifier) : '',
    titulo: volume.title || '',
    autor: Array.isArray(volume.authors) ? volume.authors.join(', ') : '',
    idioma: volume.language === 'pt' ? 'Português' : volume.language || 'Português',
    foto_capa_url: imageUrl.startsWith('http:') ? imageUrl.replace('http:', 'https:') : imageUrl,
  };
}

export function buildGoogleBooksQueries({ searchTerm = '', author = '' } = {}) {
  if (isIsbn13(searchTerm)) {
    return [{ type: 'ISBN', query: `isbn:${normalizeIsbn(searchTerm)}` }];
  }

  const queries = [];
  if (searchTerm.trim()) queries.push({ type: 'Título', query: `intitle:${searchTerm.trim()}` });
  if (author.trim()) queries.push({ type: 'Autor', query: `inauthor:${author.trim()}` });
  return queries;
}

export async function searchGoogleBooks(search, apiKey = '', fetchImpl = fetch) {
  const queries = buildGoogleBooksQueries(search);
  if (queries.length === 0) return [];

  const responses = await Promise.allSettled(
    queries.map(async ({ query, type }) => {
      const response = await fetchImpl(buildGoogleBooksUrl(query, apiKey));
      if (!response.ok) throw new Error(`Google Books respondeu HTTP ${response.status}.`);
      return { type, data: await response.json() };
    }),
  );
  const successfulResponses = responses.filter((result) => result.status === 'fulfilled');
  if (successfulResponses.length === 0) throw responses[0].reason;

  const booksByIsbn = new Map();
  for (const response of successfulResponses) {
    for (const item of response.value.data.items || []) {
      const book = mapGoogleBooksVolume(item.volumeInfo);
      if (!book.isbn) continue;

      const existingBook = booksByIsbn.get(book.isbn);
      if (existingBook) {
        if (!existingBook.matches.includes(response.value.type)) {
          existingBook.matches.push(response.value.type);
        }
      } else {
        booksByIsbn.set(book.isbn, { ...book, matches: [response.value.type] });
      }
    }
  }

  return [...booksByIsbn.values()];
}