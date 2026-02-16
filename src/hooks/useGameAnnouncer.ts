
export function useGameAnnouncer() {
    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        
        // Cancel previous
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.2; // Slightly higher pitch for fun
        utterance.volume = 0.8;
        
        // Try to select a "fun" voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    };

    return { speak };
}
