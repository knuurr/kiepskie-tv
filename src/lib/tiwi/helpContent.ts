export const HELP_CONTENT = {
  CRT_EFFECTS: {
    title: "Efekty CRT",
    description: `Efekty CRT pozwalają na symulację wyglądu starego telewizora kineskopowego.

• Efekt CRT - dodaje charakterystyczne zniekształcenie obrazu typowe dla telewizorów CRT
• Poświata - tworzy delikatną poświatę wokół obrazu, typową dla kineskopów
• Przeplot - symuluje efekt przeplotu linii, charakterystyczny dla starych telewizorów`,
    imagePath: "/tiwi/images/help/crt-effects.webp"
  },
  BOCZEK_FILL: {
    title: "Tryb dopasowania Boczka",
    description: `Tryb dopasowania określa, w jaki sposób reakcja Boczka będzie wyświetlana na ekranie:

• Rozciągnij - wypełnia cały ekran, może zniekształcić obraz
• Zachowaj proporcje z rozmyciem - zachowuje proporcje obrazu, wypełniając boki rozmytym tłem
• Zachowaj proporcje z czarnym tłem - zachowuje proporcje obrazu z czarnymi paskami`,
    imagePath: "/tiwi/images/help/boczek-fill.webp"
  },
  VIDEO_SCALE: {
    title: "Skalowanie wideo",
    description: `Skalowanie określa, jak duże będzie Twoje wideo w oknie telewizora:

• Brak skalowania - wideo wypełnia całe okno
• Delikatne skalowanie - tworzy delikatną ramkę wokół wideo
• Mocne skalowanie - tworzy wyraźną ramkę wokół wideo, podkreślając efekt starego telewizora`,
    imagePath: "/tiwi/images/help/video-scale.webp"
  },
  GREENSCREEN_FILL: {
    title: "Tryb dopasowania do tła",
    description: `Tryb dopasowania określa, jak Twoje wideo będzie wyświetlane w oknie telewizora:

• Zachowaj proporcje z czarnym tłem - zachowuje oryginalne proporcje wideo, dodając czarne paski
• Rozciągnij - wypełnia całe okno telewizora, może zniekształcić obraz
• Zachowaj proporcje z rozmyciem - zachowuje proporcje wideo, wypełniając pozostałą przestrzeń rozmytym tłem`,
    imagePath: "/tiwi/images/help/greenscreen-fill.webp"
  }
} as const; 