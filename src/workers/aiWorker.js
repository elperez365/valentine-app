// Web Worker per l'AI - gira in un thread separato
// Due modelli: generazione EN + traduzione IT

import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

let generator = null;
let translator = null;
let isLoading = false;
let loadingStage = "idle";
let isCancelled = false;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === "load") {
    if (generator && translator) {
      self.postMessage({ type: "loaded", isReady: true });
      return;
    }
    if (isLoading) {
      self.postMessage({ type: "already-loading" });
      return;
    }

    isLoading = true;
    isCancelled = false;

    try {
      loadingStage = "generator";
      self.postMessage({ type: "progress", progress: 0, stage: "generator" });

      generator = await pipeline(
        "text2text-generation",
        "Xenova/LaMini-Flan-T5-248M",
        {
          progress_callback: (progress) => {
            if (isCancelled) return;
            if (progress.status === "progress") {
              self.postMessage({
                type: "progress",
                progress: Math.round(progress.progress * 0.5),
                stage: "generator",
              });
            }
          },
        }
      );

      if (isCancelled) {
        isLoading = false;
        return;
      }

      loadingStage = "translator";
      self.postMessage({ type: "progress", progress: 50, stage: "translator" });

      translator = await pipeline("translation", "Xenova/opus-mt-en-it", {
        progress_callback: (progress) => {
          if (isCancelled) return;
          if (progress.status === "progress") {
            self.postMessage({
              type: "progress",
              progress: 50 + Math.round(progress.progress * 0.5),
              stage: "translator",
            });
          }
        },
      });

      if (isCancelled) {
        isLoading = false;
        return;
      }

      isLoading = false;
      loadingStage = "ready";
      self.postMessage({ type: "loaded", isReady: true });
      console.log("Modelli AI caricati: generatore + traduttore!");
    } catch (error) {
      isLoading = false;
      loadingStage = "idle";
      self.postMessage({ type: "error", error: error.message });
    }
  }

  if (type === "cancel") {
    isCancelled = true;
    self.postMessage({ type: "cancelled" });
  }

  if (type === "reset") {
    isCancelled = false;
    self.postMessage({ type: "reset-done" });
  }

  if (type === "generate") {
    if (!generator || !translator) {
      self.postMessage({
        type: "generate-error",
        error: "Modelli non ancora caricati",
      });
      return;
    }

    if (isCancelled) {
      self.postMessage({ type: "generate-cancelled" });
      return;
    }

    try {
      const { player1Name, player2Name, score, matchContext, diffContext } =
        payload;

      self.postMessage({ type: "generating", step: "letter" });

      const letterPrompt =
        "Write a romantic love letter for the couple " +
        player1Name +
        " and " +
        player2Name +
        ". Their compatibility is " +
        score +
        "%. They both love: " +
        matchContext +
        ". Write 3 heartfelt sentences celebrating their love and connection. Be poetic and warm.";

      const letterResult = await generator(letterPrompt, {
        max_new_tokens: 120,
        temperature: 0.8,
        do_sample: true,
        top_p: 0.9,
      });

      if (isCancelled) {
        self.postMessage({ type: "generate-cancelled" });
        return;
      }

      let letterEN = letterResult[0]?.generated_text || "";

      self.postMessage({ type: "generating", step: "translate-letter" });

      let letterIT = letterEN;
      if (letterEN.length > 10) {
        const translatedLetter = await translator(letterEN, {
          max_length: 150,
        });
        letterIT = translatedLetter[0]?.translation_text || letterEN;
      }

      if (isCancelled) {
        self.postMessage({ type: "generate-cancelled" });
        return;
      }

      let adviceIT = "";
      self.postMessage({ type: "generating", step: "advice" });

      let advicePrompt;
      if (diffContext) {
        advicePrompt =
          "Give 2 short romantic tips for a couple who disagree on: " +
          diffContext +
          ". Be positive and encouraging.";
      } else {
        advicePrompt =
          "Give 2 short romantic tips for " +
          player1Name +
          " and " +
          player2Name +
          " who are very compatible. How can they keep their relationship strong and exciting?";
      }

      const adviceResult = await generator(advicePrompt, {
        max_new_tokens: 80,
        temperature: 0.8,
        do_sample: true,
        top_p: 0.9,
      });

      if (isCancelled) {
        self.postMessage({ type: "generate-cancelled" });
        return;
      }

      const adviceEN = adviceResult[0]?.generated_text || "";

      self.postMessage({ type: "generating", step: "translate-advice" });

      if (adviceEN.length > 10) {
        const translatedAdvice = await translator(adviceEN, {
          max_length: 120,
        });
        adviceIT = translatedAdvice[0]?.translation_text || adviceEN;
      }

      if (isCancelled) {
        self.postMessage({ type: "generate-cancelled" });
        return;
      }

      self.postMessage({
        type: "generated",
        result: {
          loveLetter: letterIT,
          advice: adviceIT,
        },
      });
    } catch (error) {
      self.postMessage({ type: "generate-error", error: error.message });
    }
  }

  if (type === "status") {
    self.postMessage({
      type: "status-response",
      isReady: !!(generator && translator),
      isLoading: isLoading,
      stage: loadingStage,
    });
  }
};
