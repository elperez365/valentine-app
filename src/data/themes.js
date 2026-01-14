export const themes = [
  {
    id: "romantic",
    name: "💕 Romantico",
    gradient: "from-pink-500 to-red-600",
    accent: "pink",
  },
  {
    id: "sunset",
    name: "🌅 Tramonto",
    gradient: "from-orange-400 to-pink-500",
    accent: "orange",
  },
  {
    id: "ocean",
    name: "🌊 Oceano",
    gradient: "from-cyan-500 to-blue-600",
    accent: "cyan",
  },
  {
    id: "forest",
    name: "🌲 Foresta",
    gradient: "from-green-500 to-emerald-700",
    accent: "green",
  },
  {
    id: "night",
    name: "🌙 Notte",
    gradient: "from-purple-600 to-indigo-900",
    accent: "purple",
  },
  {
    id: "gold",
    name: "✨ Oro",
    gradient: "from-yellow-400 to-amber-600",
    accent: "yellow",
  },
];

export function getThemeById(id) {
  return themes.find((t) => t.id === id) || themes[0];
}
