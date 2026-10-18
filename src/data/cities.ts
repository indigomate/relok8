export interface CityConfig {
  slug: string;
  name: string;
  enabled: boolean;
  universities: string[];
  transit: string[];
  neighborhoods: string[];
  averageRentPLN: number;
}

export const CITIES_CONFIG: CityConfig[] = [
  {
    slug: 'krakow',
    name: 'Kraków',
    enabled: true,
    universities: [
      'Jagiellonian University (UJ)',
      'AGH University of Science and Technology',
      'Kraków University of Economics (UEK)'
    ],
    transit: [
      'Plac Wolnica tram stop',
      'Teatr Słowackiego tram corridor'
    ],
    neighborhoods: ['Kazimierz', 'Stare Miasto', 'Krowodrza', 'Grzegórzki', 'Podgórze'],
    averageRentPLN: 2100
  },
  {
    slug: 'warsaw',
    name: 'Warsaw',
    enabled: true,
    universities: [
      'University of Warsaw (UW)',
      'Warsaw School of Economics (SGH)',
      'Warsaw University of Technology (PW)',
      'Medical University of Warsaw (WUM)'
    ],
    transit: [
      'Metro line M1 (Pole Mokotowskie / Politechnika)',
      'Metro line M2 (Świętokrzyska / Rondo Daszyńskiego)',
      'Direct tram network to campuses'
    ],
    neighborhoods: ['Mokotów', 'Śródmieście', 'Wola', 'Ochota', 'Żoliborz', 'Praga'],
    averageRentPLN: 2400
  },
  {
    slug: 'wroclaw',
    name: 'Wrocław',
    enabled: true,
    universities: [
      'Wrocław University of Science and Technology (PWr)',
      'University of Wrocław (UWr)',
      'Wrocław Medical University'
    ],
    transit: [
      'Plac Grunwaldzki tram hub',
      'Pomorska high-frequency tram corridor'
    ],
    neighborhoods: ['Nadodrze', 'Śródmieście', 'Stare Miasto', 'Krzyki', 'Grunwald'],
    averageRentPLN: 2000
  },
  {
    slug: 'gdansk',
    name: 'Gdańsk',
    enabled: true,
    universities: [
      'Gdańsk University of Technology (PG)',
      'University of Gdańsk (UG)',
      'Medical University of Gdańsk (GUMed)'
    ],
    transit: [
      'SKM Fast City Train corridor (Wrzeszcz / Oliwa)',
      'Direct tram routes 6 and 12'
    ],
    neighborhoods: ['Wrzeszcz', 'Oliwa', 'Przymorze', 'Główne Miasto', 'Aniołki'],
    averageRentPLN: 2200
  },
  {
    slug: 'lublin',
    name: 'Lublin',
    enabled: true,
    universities: [
      'Medical University of Lublin (UMLub)',
      'Maria Curie-Skłodowska University (UMCS)',
      'John Paul II Catholic University of Lublin (KUL)'
    ],
    transit: [
      'Direct bus routes 26, 31, and 40 to campus',
      'Trolleybus network line 158'
    ],
    neighborhoods: ['Śródmieście', 'Wieniawa', 'Czechów', 'Miasteczko Akademickie'],
    averageRentPLN: 1800
  },
  {
    slug: 'poznan',
    name: 'Poznań',
    enabled: false, // Disabled for now, alerts capture state will trigger if accessed
    universities: [
      'Adam Mickiewicz University (UAM)',
      'Poznań University of Technology (PUT)'
    ],
    transit: [
      'PST Fast Tram route',
      'Rondo Kaponiera transit hub'
    ],
    neighborhoods: ['Jeżyce', 'Stare Miasto', 'Wilda'],
    averageRentPLN: 1950
  }
];

export const ENABLED_CITIES = CITIES_CONFIG.filter((c) => c.enabled);

export function getCityBySlug(slug: string): CityConfig | undefined {
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  return CITIES_CONFIG.find((c) => c.slug === normalized || c.slug.replace(/[^a-z0-9]/g, '') === normalized);
}

export function getCityByName(name: string): CityConfig | undefined {
  return CITIES_CONFIG.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
