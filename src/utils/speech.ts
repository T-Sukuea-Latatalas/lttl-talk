/**
 * Text-to-speech helper for Ratatara language phonetic pronunciation
 */
export function speakRatatara(text: string) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  // Pronounce with neutral rhythmic pace
  utterance.rate = 0.85;
  utterance.pitch = 1.05;
  // Try to use a clear voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) => v.lang.startsWith('en') || v.lang.startsWith('ja') || v.name.includes('Natural')
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}
