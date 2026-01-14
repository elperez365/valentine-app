// Servizio Template - Messaggi statici per i risultati

const loveLetterTemplates = {
  perfect: [
    "Carissimi {p1} e {p2}, siete davvero anime gemelle! 💕 La vostra connessione è qualcosa di raro e prezioso. Continuate a coltivare questo amore straordinario che vi unisce.",
    "{p1} e {p2}, la vostra sintonia è magica! ✨ Pensate allo stesso modo, sognate le stesse cose. Siete la prova che l'amore vero esiste.",
    "Wow, {p1} e {p2}! 💘 Una compatibilità perfetta è rara come un diamante. Custodite questo tesoro che avete trovato l'uno nell'altra.",
    "{p1} e {p2}, siete fatti l'uno per l'altra! 🌟 La vostra intesa è così profonda che sembra magia. L'universo vi ha destinati a stare insieme.",
  ],
  high: [
    "{p1} e {p2}, avete una bellissima intesa! 💑 Le piccole differenze sono il sale della vita - vi aiuteranno a crescere insieme.",
    "Che bella coppia siete, {p1} e {p2}! 🌹 La vostra connessione è forte e autentica. Continuate a scoprirvi giorno dopo giorno.",
    "{p1} e {p2}, siete sulla strada giusta! 💝 L'amore che condividete è evidente. Le vostre somiglianze vi uniscono, le differenze vi completano.",
    "Splendida coppia! {p1} e {p2}, la vostra compatibilità racconta di un legame speciale. 💫 Avete trovato qualcuno che vi capisce davvero.",
  ],
  medium: [
    "{p1} e {p2}, il vostro amore è un'avventura! 🌟 Avete tanto da scoprire l'uno dell'altra - ogni differenza è un'opportunità di crescita.",
    "Carissimi {p1} e {p2}, la diversità arricchisce! 💫 Dove non siete allineati, potete imparare l'uno dall'altra.",
    "{p1} e {p2}, ogni coppia ha il suo percorso unico! 💕 Le vostre differenze sono occasioni per dialogare e comprendervi meglio.",
    "{p1} e {p2}, l'amore si costruisce giorno dopo giorno! 🌈 Le vostre differenze rendono la relazione più interessante e stimolante.",
  ],
  low: [
    "{p1} e {p2}, gli opposti si attraggono! 🔥 Le vostre differenze possono diventare la vostra forza se imparate ad ascoltarvi.",
    "{p1} e {p2}, avete una sfida davanti a voi! 💪 Ma con comunicazione e pazienza, potete costruire qualcosa di speciale.",
    "Cari {p1} e {p2}, la compatibilità si costruisce! 🌱 Parlate apertamente delle vostre differenze - è il primo passo verso una connessione più profonda.",
    "{p1} e {p2}, le differenze non sono ostacoli ma opportunità! 🌻 Ogni coppia deve lavorare sulla propria sintonia, e voi avete tanto potenziale.",
  ],
};

const adviceTemplates = [
  "💬 Dedicate del tempo ogni settimana per parlare apertamente dei vostri desideri e aspettative.",
  "👟 Provate a mettervi nei panni dell'altro quando avete opinioni diverse - l'empatia è la chiave.",
  "🎨 Celebrate le vostre differenze! Sono ciò che rende la vostra relazione unica e interessante.",
  "✨ Create dei rituali di coppia che vi appartengano solo a voi due.",
  "🤝 Ricordate che non dovete essere d'accordo su tutto - il rispetto è più importante della conformità.",
  "🎯 Fate delle attività nuove insieme per scoprire interessi comuni che non sapevate di avere.",
  "👂 Quando discutete, ascoltate per capire, non per rispondere.",
  "💝 Sorprendetevi a vicenda con piccoli gesti d'affetto quotidiani.",
  "🗓️ Pianificate regolarmente momenti speciali solo per voi due.",
  "😊 Non dimenticate mai di ridere insieme - l'umorismo è un collante potente.",
  "🌟 Esprimete gratitudine per le piccole cose che fate l'uno per l'altra.",
  "🏠 Create uno spazio sicuro dove potete essere vulnerabili senza giudizio.",
];

const compatibleAdviceTemplates = [
  "🎉 Continuate a coltivare questa sintonia speciale che avete!",
  "🚀 Non date per scontata la vostra compatibilità - continuate a investire nella relazione.",
  "💫 Esplorate nuovi orizzonti insieme - avete le basi per grandi avventure!",
  "🌈 La vostra intesa è rara - festeggiatela ogni giorno con piccoli gesti.",
  "❤️ Siete fortunati ad avervi trovati - non smettete mai di sorprendervi a vicenda.",
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Cache per evitare rigenerazione
let cachedResult = null;

export const resetCache = () => {
  cachedResult = null;
};

export const getCachedResult = () => cachedResult;

// Genera contenuto con template
export const generateLoveContent = (
  player1Name,
  player2Name,
  score,
  matchingAnswers,
  differentAnswers
) => {
  // Se abbiamo già il risultato, restituiscilo
  if (cachedResult) {
    return cachedResult;
  }

  // Scegli categoria in base al punteggio
  let category;
  if (score === 100) category = "perfect";
  else if (score >= 70) category = "high";
  else if (score >= 40) category = "medium";
  else category = "low";

  // Genera lettera d'amore
  const letterTemplate = pickRandom(loveLetterTemplates[category]);
  const loveLetter = letterTemplate
    .replace(/{p1}/g, player1Name)
    .replace(/{p2}/g, player2Name);

  // Genera consigli
  let advice = "";
  if (differentAnswers && differentAnswers.length > 0) {
    // Se ci sono differenze, dai consigli specifici
    const tips = [];
    const usedIndexes = new Set();
    while (tips.length < 2 && usedIndexes.size < adviceTemplates.length) {
      const idx = Math.floor(Math.random() * adviceTemplates.length);
      if (!usedIndexes.has(idx)) {
        usedIndexes.add(idx);
        tips.push(adviceTemplates[idx]);
      }
    }
    advice = tips.join("\n\n");
  } else {
    // Se sono molto compatibili, dai consigli per mantenere la relazione
    advice = pickRandom(compatibleAdviceTemplates);
  }

  cachedResult = { loveLetter, advice };
  return cachedResult;
};

// Funzioni vuote per compatibilità (non fanno nulla)
export const startModelDownload = () => {};
export const preGenerateContent = () => {};
export const cancelGeneration = () => {};
export const isModelReadyStatus = () => true;
export const isCurrentlyGenerating = () => false;
export const getLoadingProgress = () => 100;
