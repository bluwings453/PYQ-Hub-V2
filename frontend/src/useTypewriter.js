import { useEffect, useState } from "react";

// Types out each word, pauses, backspaces it, pauses, then moves to the next
// word - loops forever. Used as an animated placeholder, e.g. "IIT Bombay" ->
// backspace -> "NIT Warangal" -> backspace -> "NIT Patna" -> ...
export function useTypewriter(words, options = {}) {
  const { typingSpeed = 90, deletingSpeed = 45, pauseAfterTyped = 1200, pauseAfterDeleted = 300 } = options;
  const [text, setText] = useState("");

  useEffect(() => {
    if (!words || words.length === 0) return undefined;

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId;

    const tick = () => {
      const currentWord = words[wordIndex];

      if (!deleting) {
        charIndex += 1;
        setText(currentWord.slice(0, charIndex));
        if (charIndex >= currentWord.length) {
          deleting = true;
          timeoutId = setTimeout(tick, pauseAfterTyped);
          return;
        }
        timeoutId = setTimeout(tick, typingSpeed);
      } else {
        charIndex -= 1;
        setText(currentWord.slice(0, charIndex));
        if (charIndex <= 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          timeoutId = setTimeout(tick, pauseAfterDeleted);
          return;
        }
        timeoutId = setTimeout(tick, deletingSpeed);
      }
    };

    timeoutId = setTimeout(tick, typingSpeed);
    return () => clearTimeout(timeoutId);
  }, [words, typingSpeed, deletingSpeed, pauseAfterTyped, pauseAfterDeleted]);

  return text;
}
