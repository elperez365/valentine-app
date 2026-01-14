// Web Worker per l'AI - gira in un thread separato
// Non blocca MAI la UI principale

import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

let generator = null;
let isLoading = false;

// Gestione messaggi dal main thread
self.onmessage = async (e) => {
  const { type, payload } = e.data;

  // Carica il modello
  if (type === "load") {
    if (generator || isLoading) {
      self.postMessage({ type: "already-loading" });
      return;
    }

    isLoading = true;

    try {
      self.postMessage({ type: "progress", progress: 0 });

      generator = await pipeline(
        "text2text-generation",
        "Xenova/LaMini-Flan-T5-248M",
        {
          progress_callback: (progress) => {
            if (progress.status === "progress") {
              self.postMessage({
                type: "progress",
                progress: Math.round(progress.progress),
              });
            }
          },
        }
      );

      isLoading = false;
      self.postMessage({ type: "loaded" });
    } catch (error) {
      isLoading = false;
      self.postMessage({ type: "error", error: error.message });
    }
  }

  // Genera contenuto
  if (type === "generate") {
    if (!generator) {
      self.postMessage({
        type: "generate-error",
        error: "Modello non ancora caricato",
      });
      return;
    }

    try {
      const { player1Name, player2Name, score, matchContext, diffContext } =
        payload;

      // Prompt in italiano
      const letterPrompt = `Scrivi un breve messaggio romantico in italiano per ${player1Name} e ${player2Name} che hanno ${score}% di compatibilità. Menziona che sono d'accordo su: ${matchContext}. Massimo 2 frasi dolci.`;

      const result = await generator(letterPrompt, {
        max_new_tokens: 80,
        temperature: 0.7,
        do_sample: true,
      });

      let advice = "";
      if (diffContext) {
        const advicePrompt = `Dai un breve consiglio romantico in italiano per una coppia che non è d'accordo su: ${diffContext}. Una frase positiva.`;

        const adviceResult = await generator(advicePrompt, {
          max_new_tokens: 50,
          temperature: 0.7,
          do_sample: true,
        });
        advice = adviceResult[0]?.generated_text || "";
      }

      self.postMessage({
        type: "generated",
        result: {
          loveLetter: result[0]?.generated_text || "",
          advice: advice,
        },
      });
    } catch (error) {
      self.postMessage({ type: "generate-error", error: error.message });
    }
  }

  // Controlla stato
  if (type === "status") {
    self.postMessage({
      type: "status-response",
      isReady: !!generator,
      isLoading: isLoading,
    });
  }
};
