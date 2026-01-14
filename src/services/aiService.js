// Servizio AI con Web Worker + Template fallback
// L'AI gira in un thread separato, mai blocca la UI!

// ============================================
// TEMPLATE FALLBACK (usati se AI non è pronta)
// ============================================

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

const adviceTemplates = [
  "Dedicate del tempo ogni settimana per parlare apertamente dei vostri desideri e aspettative.",
  "Provate a mettervi nei panni dell'altro quando avete opinioni diverse - l'empatia è la chiave.",
  "Celebrate le vostre differenze! Sono ciò che rende la vostra relazione unica e interessante.",
  "Create dei rituali di coppia che vi appartengano solo a voi due.",
  "Ricordate che non dovete essere d'accordo su tutto - il rispetto è più importante della conformità.",
  "Fate delle attività nuove insieme per scoprire interessi comuni che non sapevate di avere.",
  "Quando discutete, ascoltate per capire, non per rispondere.",
  "Sorprendetevi a vicenda con piccoli gesti d'affetto quotidiani.",
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============================================
// WEB WORKER MANAGEMENT
// ============================================

let worker = null;
let isModelReady = false;
let isModelLoading = false;
let loadingProgress = 0;
let progressCallback = null;

// Cache e stato generazione
let cachedResult = null;
let isGenerating = false;
let pendingGeneration = null;

// Crea il worker
const getWorker = () => {
  if (!worker) {
    worker = new Worker(new URL("../workers/aiWorker.js", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (e) => {
      const { type, progress, result, error, isReady } = e.data;

      switch (type) {
        case "progress":
          loadingProgress = progress;
          progressCallback?.(progress);
          break;

        case "loaded":
          isModelReady = true;
          isModelLoading = false;
          loadingProgress = 100;
          progressCallback?.(100);
          console.log("🧠 Modello AI caricato e pronto!");
          break;

        case "generated":
          cachedResult = result;
          isGenerating = false;
          if (pendingGeneration) {
            pendingGeneration.resolve(result);
            pendingGeneration = null;
          }
          console.log("✨ Contenuto AI generato!");
          break;

        case "generate-error":
          console.error("Errore generazione AI:", error);
          isGenerating = false;
          if (pendingGeneration) {
            pendingGeneration.reject(new Error(error));
            pendingGeneration = null;
          }
          break;

        case "error":
          console.error("Errore caricamento modello:", error);
          isModelLoading = false;
          break;

        case "already-loading":
          // Ignora, già in caricamento
          break;
      }
    };
  }
  return worker;
};

// ============================================
// API PUBBLICA
// ============================================

export const setProgressCallback = (callback) => {
  progressCallback = callback;
};

export const getLoadingProgress = () => loadingProgress;
export const isModelLoadingStatus = () => isModelLoading;
export const isModelReadyStatus = () => isModelReady;
export const getCachedResult = () => cachedResult;
export const isCurrentlyGenerating = () => isGenerating;

export const resetCache = () => {
  cachedResult = null;
  isGenerating = false;
  pendingGeneration = null;
};

// Avvia il download del modello (chiamare al setup)
export const startModelDownload = () => {
  if (isModelReady || isModelLoading) return;

  isModelLoading = true;
  console.log("🚀 Avvio download modello AI in background...");

  const w = getWorker();
  w.postMessage({ type: "load" });
};

// Pre-genera il contenuto (chiamare a metà domande P2)
export const preGenerateContent = (
  player1Name,
  player2Name,
  currentAnswersP1,
  currentAnswersP2,
  questions
) => {
  // Non generare se già in corso o già fatto
  if (isGenerating || cachedResult) return;

  // Se il modello non è pronto, usa i template
  if (!isModelReady) {
    console.log("📝 Modello non pronto, userò i template");
    generateWithTemplates(
      player1Name,
      player2Name,
      currentAnswersP1,
      currentAnswersP2,
      questions
    );
    return;
  }

  console.log("🤖 Inizio generazione AI...");
  isGenerating = true;

  // Calcola contesto
  const answeredCount = Math.min(
    currentAnswersP1.length,
    currentAnswersP2.length
  );
  let matches = 0;
  const matchingTopics = [];
  const differentTopics = [];

  for (let i = 0; i < answeredCount; i++) {
    if (currentAnswersP1[i] === currentAnswersP2[i]) {
      matches++;
      matchingTopics.push(questions[i].text);
    } else {
      differentTopics.push(questions[i].text);
    }
  }

  // Stima punteggio
  const totalQuestions = questions.length;
  const remaining = totalQuestions - answeredCount;
  const estimatedMatches = matches + Math.floor(remaining * 0.5);
  const estimatedScore = Math.round((estimatedMatches / totalQuestions) * 100);

  // Invia al worker
  const w = getWorker();
  w.postMessage({
    type: "generate",
    payload: {
      player1Name,
      player2Name,
      score: estimatedScore,
      matchContext: matchingTopics.slice(0, 3).join(", ") || "molte cose",
      diffContext: differentTopics.slice(0, 2).join(", ") || null,
    },
  });
};

// Genera con template (fallback istantaneo)
const generateWithTemplates = (
  player1Name,
  player2Name,
  currentAnswersP1,
  currentAnswersP2,
  questions
) => {
  isGenerating = true;

  const answeredCount = Math.min(
    currentAnswersP1.length,
    currentAnswersP2.length
  );
  let matches = 0;
  let hasDifferences = false;

  for (let i = 0; i < answeredCount; i++) {
    if (currentAnswersP1[i] === currentAnswersP2[i]) {
      matches++;
    } else {
      hasDifferences = true;
    }
  }

  const totalQuestions = questions.length;
  const remaining = totalQuestions - answeredCount;
  const estimatedMatches = matches + Math.floor(remaining * 0.5);
  const score = Math.round((estimatedMatches / totalQuestions) * 100);

  // Scegli template
  let category;
  if (score === 100) category = "perfect";
  else if (score >= 70) category = "high";
  else if (score >= 40) category = "medium";
  else category = "low";

  const letterTemplate = pickRandom(loveLetterTemplates[category]);
  const loveLetter = letterTemplate
    .replace(/{p1}/g, player1Name)
    .replace(/{p2}/g, player2Name);

  let advice = "";
  if (hasDifferences) {
    const tips = [];
    const usedIndexes = new Set();
    while (tips.length < 2 && usedIndexes.size < adviceTemplates.length) {
      const idx = Math.floor(Math.random() * adviceTemplates.length);
      if (!usedIndexes.has(idx)) {
        usedIndexes.add(idx);
        tips.push(adviceTemplates[idx]);
      }
    }
    advice = tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n");
  }

  cachedResult = { loveLetter, advice };
  isGenerating = false;
};

// Genera contenuto (attende il risultato)
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

  // Se stiamo già generando, aspetta
  if (isGenerating && pendingGeneration) {
    return pendingGeneration.promise;
  }

  // Se non stiamo generando e non c'è cache, genera con template
  if (!isGenerating) {
    // Fallback template istantaneo
    let category;
    if (score === 100) category = "perfect";
    else if (score >= 70) category = "high";
    else if (score >= 40) category = "medium";
    else category = "low";

    const letterTemplate = pickRandom(loveLetterTemplates[category]);
    const loveLetter = letterTemplate
      .replace(/{p1}/g, player1Name)
      .replace(/{p2}/g, player2Name);

    let advice = "";
    if (differentAnswers.length > 0) {
      const tips = [];
      const usedIndexes = new Set();
      while (tips.length < 2 && usedIndexes.size < adviceTemplates.length) {
        const idx = Math.floor(Math.random() * adviceTemplates.length);
        if (!usedIndexes.has(idx)) {
          usedIndexes.add(idx);
          tips.push(adviceTemplates[idx]);
        }
      }
      advice = tips.map((tip, i) => `${i + 1}. ${tip}`).join("\n");
    }

    cachedResult = { loveLetter, advice };
    return cachedResult;
  }

  // Aspetta la generazione in corso
  return new Promise((resolve, reject) => {
    pendingGeneration = { resolve, reject };

    // Timeout: se dopo 10s non abbiamo risposta, usa template
    setTimeout(() => {
      if (pendingGeneration && !cachedResult) {
        console.log("⏱️ Timeout AI, uso template");
        generateWithTemplates(player1Name, player2Name, [], [], []);
        resolve(cachedResult);
        pendingGeneration = null;
      }
    }, 10000);
  });
};

// Preload (per compatibilità, ora usa startModelDownload)
export const preloadModel = () => {
  startModelDownload();
};
