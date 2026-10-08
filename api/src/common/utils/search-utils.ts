/**
 * Normaliza texto para busqueda eliminando acentos/tildes y diacriticos
 */
export function normalizeSearchText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .trim();
}

/**
 * Genera variaciones ortograficas con y sin tildes para busqueda tolerante en PostgreSQL (ILIKE).
 */
export function generateAccentVariations(query?: string | null): string[] {
  if (!query) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const base = trimmed.toLowerCase();
  const unaccented = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const variations = new Set<string>([trimmed, base, unaccented]);

  const map: Record<string, string[]> = {
    a: ['á'],
    e: ['é'],
    i: ['í'],
    o: ['ó'],
    u: ['ú', 'ü'],
    n: ['ñ'],
    á: ['a'],
    é: ['e'],
    í: ['i'],
    ó: ['o'],
    ú: ['u'],
    ü: ['u'],
    ñ: ['n'],
  };

  const commonReplacements: Record<string, string> = {
    frances: 'francés',
    francés: 'frances',
    cafe: 'café',
    café: 'cafe',
    azucar: 'azúcar',
    azúcar: 'azucar',
    platano: 'plátano',
    plátano: 'platano',
    pequeno: 'pequeño',
    pequeño: 'pequeno',
    pequena: 'pequeña',
    pequeña: 'pequena',
  };

  for (const [k, v] of Object.entries(commonReplacements)) {
    if (base.includes(k)) {
      variations.add(base.replace(new RegExp(k, 'g'), v));
    }
  }

  // Permutar vocales si hay 4 o menos en la palabra base
  const vowels: Array<{ idx: number; ch: string }> = [];
  for (let i = 0; i < unaccented.length; i++) {
    const ch = unaccented[i];
    if (['a', 'e', 'i', 'o', 'u', 'n'].includes(ch)) {
      vowels.push({ idx: i, ch });
    }
  }

  if (vowels.length > 0 && vowels.length <= 4) {
    const count = 1 << vowels.length;
    for (let mask = 0; mask < count; mask++) {
      const chars = unaccented.split('');
      for (let bit = 0; bit < vowels.length; bit++) {
        if (mask & (1 << bit)) {
          const v = vowels[bit];
          const acc = map[v.ch]?.[0];
          if (acc) chars[v.idx] = acc;
        }
      }
      variations.add(chars.join(''));
    }
  }

  return Array.from(variations);
}
