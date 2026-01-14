// Servizio AI con template romantici pre-scritti
// Veloce, affidabile, sempre in italiano perfetto!

// Template lettere d'amore basate sul punteggio
const loveLetterTemplates = {
  perfect: [
    "Carissimi {p1} e {p2}, siete davvero anime gemelle! 💕 La vostra connessione è qualcosa di raro e prezioso. Continuate a coltivare questo amore straordinario che vi unisce.",
    "{p1} e {p2}, la vostra sintonia è magica! ✨ Pensate allo stesso modo, sognate le stesse cose. Siete la prova che l'amore vero esiste.",
    "Wow, {p1} e {p2}! 💘 Una compatibilità perfetta è rara come un diamante. Custodite questo tesoro che avete trovato l'uno nell'altra.",
  ],
  high: [
    "{p1} e {p2}, avete una bellissima intesa! 💑 Le piccole differenze sono il sale della vita - vi aiuteranno a crescere insieme.",
    "Che bella coppia siete, {p1} e {p2}! 🌹 La vostra connessione è forte e autentica. Continuate a scoprirvi giorno dopo giorno.",
    "{p1} e {p2}, siete sulla strada giusta! 💝 L'amore che condividete è evidente. Le vostre somiglianze vi uniscono, le differenze vi completano.",
  ],
  medium: [
    "{p1} e {p2}, il vostro amore è un'avventura! 🌟 Avete tanto da scoprire l'uno dell'altra - ogni differenza è un'opportunità di crescita.",
    "Carissimi {p1} e {p2}, la diversità arricchisce! 💫 Dove non siete allineati, potete imparare l'uno dall'altra.",
    "{p1} e {p2}, ogni coppia ha il suo percorso unico! 💕 Le vostre differenze sono occasioni per dialogare e comprendervi meglio.",
  ],
  low: [
    "{p1} e {p2}, gli opposti si attraggono! 🔥 Le vostre differenze possono diventare la vostra forza se imparate ad ascoltarvi.",
    "{p1} e {p2}, avete una sfida davanti a voi! 💪 Ma con comunicazione e pazienza, potete costruire qualcosa di speciale.",
    "Cari {p1} e {p2}, la compatibilità si costruisce! 🌱 Parlate apertamente delle vostre differenze - è il primo passo verso una connessione più profonda.",
  ],
};

// Template consigli basati sulle categorie delle differenze
const adviceTemplates = {
  generic: [
    "Dedicate del tempo ogni settimana per parlare apertamente dei vostri desideri e aspettative.",
    "Provate a mettervi nei panni dell'altro quando avete opinioni diverse - l'empatia è la chiave.",
    "Celebrate le vostre differenze! Sono ciò che rende la vostra relazione unica e interessante.",
    "Create dei rituali di coppia che vi appartengano solo a voi due.",
    "Ricordate che non dovete essere d'accordo su tutto - il rispetto è più importante della conformità.",
    "Fate delle attività nuove insieme per scoprire interessi comuni che non sapevate di avere.",
    "Quando discutete, ascoltate per capire, non per rispondere.",
    "Sorprendetevi a vicenda con piccoli gesti d'affetto quotidiani.",
  ],
  lifestyle: [
    "Trovate un compromesso sulle attività del weekend - alternate tra le preferenze di entrambi.",
    "Create una routine che rispetti i tempi e gli spazi di entrambi.",
  ],
  values: [
    "Discutete apertamente dei vostri valori e trovate i punti in comune.",
    "Rispettate le credenze dell'altro anche quando differiscono dalle vostre.",
  ],
  future: [
    "Parlate dei vostri sogni per il futuro e cercate obiettivi condivisi.",
    "Create un 'vision board' di coppia con i vostri progetti insieme.",
  ],
};

// Cache e stato
let cachedResult = null;
let isGenerating = false;

export const getCachedResult = () => cachedResult;
export const isCurrentlyGenerating = () => isGenerating;

export const resetCache = () => {
  cachedResult = null;
  isGenerating = false;
};

// Funzioni placeholder per compatibilità (non servono più con i template)
export const setProgressCallback = () => {};
export const getLoadingProgress = () => 100;
export const isModelLoading = () => false;
export const getLoadError = () => null;
export const preloadModel = () => {};

// Seleziona un template casuale
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Genera contenuti (istantaneo con i template!)
export const generateLoveContent = async (
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

  isGenerating = true;

  // Simula un breve delay per l'effetto "generazione"
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Scegli il template giusto in base al punteggio
  let templateCategory;
  if (score === 100) {
    templateCategory = "perfect";
  } else if (score >= 70) {
    templateCategory = "high";
  } else if (score >= 40) {
    templateCategory = "medium";
  } else {
    templateCategory = "low";
  }

  // Genera la lettera
  const letterTemplate = pickRandom(loveLetterTemplates[templateCategory]);
  const loveLetter = letterTemplate
    .replace(/{p1}/g, player1Name)
    .replace(/{p2}/g, player2Name);

  // Genera i consigli (2 consigli casuali)
  let advice = "";
  if (differentAnswers.length > 0) {
    const tips = [];
    const usedIndexes = new Set();

    while (
      tips.length < 2 &&
      usedIndexes.size < adviceTemplates.generic.length
    ) {
      const idx = Math.floor(Math.random() * adviceTemplates.generic.length);
      if (!usedIndexes.has(idx)) {
        usedIndexes.add(idx);
        tips.push(adviceTemplates.generic[idx]);
      }
    }

    advice = tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n");
  }

  cachedResult = {
    loveLetter,
    advice,
  };

  isGenerating = false;
  return cachedResult;
};

// Pre-genera i contenuti (da chiamare a metà quiz)
export const preGenerateContent = (
  player1Name,
  player2Name,
  currentAnswersP1,
  currentAnswersP2,
  questions
) => {
  // Non pre-generare se stiamo già generando o abbiamo già il risultato
  if (isGenerating || cachedResult) return;

  // Calcola il punteggio parziale
  let matches = 0;
  const answeredCount = Math.min(
    currentAnswersP1.length,
    currentAnswersP2.length
  );

  for (let i = 0; i < answeredCount; i++) {
    if (currentAnswersP1[i] === currentAnswersP2[i]) matches++;
  }

  // Stima il punteggio finale
  const totalQuestions = questions.length;
  const remaining = totalQuestions - answeredCount;
  const estimatedMatches = matches + Math.floor(remaining * 0.5);
  const estimatedScore = Math.round((estimatedMatches / totalQuestions) * 100);

  // Prepara le risposte
  const matchingAnswers = [];
  const differentAnswers = [];

  for (let i = 0; i < answeredCount; i++) {
    if (currentAnswersP1[i] === currentAnswersP2[i]) {
      matchingAnswers.push({ ...questions[i], answer: currentAnswersP1[i] });
    } else {
      differentAnswers.push({
        ...questions[i],
        answerP1: currentAnswersP1[i],
        answerP2: currentAnswersP2[i],
      });
    }
  }

  // Genera in background (istantaneo con i template)
  generateLoveContent(
    player1Name,
    player2Name,
    estimatedScore,
    matchingAnswers,
    differentAnswers
  ).catch(console.error);
};
