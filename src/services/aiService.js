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
let loadingStage = "idle";
let progressCallback = null;

// Cache e stato generazione
let cachedResult = null;
let isGenerating = false;
let pendingGeneration = null;
let usedFallback = false; // Flag per sapere se abbiamo usato il template

// Crea il worker usando import inline Vite
import AIWorker from "../workers/aiWorker.js?worker";

// Crea il worker
const getWorker = () => {
  if (!worker) {
    worker = new AIWorker();

    worker.onmessage = (e) => {
      const { type, progress, stage, result, error, isReady } = e.data;

      switch (type) {
        case "progress":
          loadingProgress = progress;
          loadingStage = stage || "loading";
          progressCallback?.(progress, stage);
          break;

        case "loaded":
          isModelReady = true;
          isModelLoading = false;
          loadingProgress = 100;
          loadingStage = "ready";
          progressCallback?.(100, "ready");
          console.log("🧠 Modelli AI caricati (generatore + traduttore)!");
          break;

        case "generating":
          // Aggiorna UI con step corrente
          console.log(`🔄 Generazione: ${e.data.step}`);
          break;

        case "generated":
          // Ignora se abbiamo già usato il fallback
          if (usedFallback) {
            console.log("⏩ AI completata ma già mostrato template, ignoro");
            isGenerating = false;
            return;
          }
          cachedResult = result;
          isGenerating = false;
          if (pendingGeneration) {
            pendingGeneration.resolve(result);
            pendingGeneration = null;
          }
          console.log("✨ Contenuto AI generato e tradotto!");
          break;

        case "generate-cancelled":
          console.log("🛑 Generazione AI cancellata");
          isGenerating = false;
          break;

        case "generate-error":
          console.error("Errore generazione AI:", error);
          isGenerating = false;
          if (pendingGeneration) {
            pendingGeneration.reject(new Error(error));
            pendingGeneration = null;
          }
          break;

        case "cancelled":
          console.log("🛑 Operazione AI cancellata");
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
export const getLoadingStage = () => loadingStage;
export const isModelLoadingStatus = () => isModelLoading;
export const isModelReadyStatus = () => isModelReady;
export const getCachedResult = () => cachedResult;
export const isCurrentlyGenerating = () => isGenerating;

export const resetCache = () => {
  cachedResult = null;
  isGenerating = false;
  pendingGeneration = null;
  usedFallback = false;

  // Reset anche il flag isCancelled nel worker
  if (worker) {
    worker.postMessage({ type: "reset" });
  }
};

// Cancella generazione in corso
export const cancelGeneration = () => {
  if (worker) {
    worker.postMessage({ type: "cancel" });
  }
  isGenerating = false;
  pendingGeneration = null;
};

// Avvia il download del modello (chiamare al setup)
export const startModelDownload = () => {
  if (isModelReady || isModelLoading) return;

  isModelLoading = true;
  console.log("🚀 Avvio download modelli AI in background...");

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

  // Se il modello non è pronto, non fare nulla qui
  // Il fallback verrà gestito quando si mostra il risultato
  if (!isModelReady) {
    console.log("📝 Modello non ancora pronto, genererò dopo");
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
  // Se abbiamo già il risultato (AI o fallback), restituiscilo
  if (cachedResult) {
    return cachedResult;
  }

  // Se stiamo già generando, aspetta un po' poi usa fallback
  if (isGenerating) {
    return new Promise((resolve) => {
      // Aspetta max 10 secondi, poi usa template
      const timeout = setTimeout(() => {
        if (!cachedResult) {
          console.log("⏱️ AI non pronta, uso template e cancello generazione");
          usedFallback = true;
          cancelGeneration();
          const fallback = generateFallbackTemplate(
            player1Name,
            player2Name,
            score,
            differentAnswers
          );
          cachedResult = fallback;
          resolve(fallback);
        }
      }, 10000);

      // Ma se l'AI finisce prima, usa quello
      const checkInterval = setInterval(() => {
        if (cachedResult) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve(cachedResult);
        }
      }, 100);
    });
  }

  // Se modello non pronto e non sta generando, usa template subito
  if (!isModelReady) {
    console.log("📝 Modello non pronto, uso template");
    usedFallback = true;
    cancelGeneration();
    const fallback = generateFallbackTemplate(
      player1Name,
      player2Name,
      score,
      differentAnswers
    );
    cachedResult = fallback;
    return fallback;
  }

  // Modello pronto ma non sta generando? Genera ora e aspetta
  if (!isGenerating) {
    // Avvia generazione
    isGenerating = true;
    const w = getWorker();

    const matchContext =
      matchingAnswers
        .map((a) => a.text)
        .slice(0, 3)
        .join(", ") || "molte cose";
    const diffContext =
      differentAnswers.length > 0
        ? differentAnswers
            .map((a) => a.text)
            .slice(0, 2)
            .join(", ")
        : null;

    w.postMessage({
      type: "generate",
      payload: {
        player1Name,
        player2Name,
        score,
        matchContext,
        diffContext,
      },
    });

    // Aspetta risultato con timeout
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!cachedResult) {
          console.log("⏱️ Timeout generazione, uso template");
          usedFallback = true;
          cancelGeneration();
          const fallback = generateFallbackTemplate(
            player1Name,
            player2Name,
            score,
            differentAnswers
          );
          cachedResult = fallback;
          resolve(fallback);
        }
      }, 15000);

      pendingGeneration = {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: () => {
          clearTimeout(timeout);
          const fallback = generateFallbackTemplate(
            player1Name,
            player2Name,
            score,
            differentAnswers
          );
          cachedResult = fallback;
          resolve(fallback);
        },
      };
    });
  }

  // Fallback finale
  return generateFallbackTemplate(
    player1Name,
    player2Name,
    score,
    differentAnswers
  );
};

// Genera template di fallback
const generateFallbackTemplate = (
  player1Name,
  player2Name,
  score,
  differentAnswers
) => {
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
  if (differentAnswers && differentAnswers.length > 0) {
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

  return { loveLetter, advice };
};

// Preload (per compatibilità, ora usa startModelDownload)
export const preloadModel = () => {
  startModelDownload();
};
