function getBestResponse(userMsg) {
    userMsg = userMsg.toLowerCase();

    // Emergency check first
    if (
        userMsg.includes("chest pain") ||
        userMsg.includes("emergency") ||
        userMsg.includes("heart") ||
        userMsg.includes("breathing hard") ||
        userMsg.includes("severe pain")
    ) {
        return "This sounds serious. If you're feeling severe or spreading chest pain, shortness of breath, or dizziness, please seek medical help immediately.";
    }

    // Smart similarity matching
    let bestScore = 0;
    let bestResponse = null;

    for (const item of expandedDataset) {
        const keyword = item.user.toLowerCase();

        // Simple similarity scoring
        let score = 0;

        if (userMsg.includes(keyword)) score += 5;
        if (keyword.includes(userMsg)) score += 5;

        // Count overlapping words
        const userWords = userMsg.split(" ");
        const keyWords = keyword.split(" ");
        const overlap = userWords.filter(w => keyWords.includes(w)).length;
        score += overlap;

        // Update best match
        if (score > bestScore) {
            bestScore = score;
            bestResponse = item.bot;
        }
    }

    // If we found a match
    if (bestResponse) return bestResponse;

    // ChatGPT-like fallback
    return (
        "I hear you. " +
        "Tell me a little more so I can understand better. " +
        "What exactly are you feeling right now?"
    );
}
