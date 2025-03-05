import axios from "axios";

/**
 * Extract startup ideas from a video summary using Anthropic's Claude API
 * @param summary The video summary text
 * @param apiKey Anthropic API key
 * @returns Array of startup ideas as strings
 */
export async function extractStartupIdeas(
  summary: string,
  apiKey: string
): Promise<string[]> {
  try {
    // Make request to Anthropic API
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are an expert startup advisor and venture capitalist. Below is a summary of a video. 
Please extract 3-5 specific startup ideas mentioned or implied in the content.

For each startup idea:
1. Focus on concrete, actionable business ideas
2. Be specific about the product/service and target market
3. Format each idea as a short paragraph (3-5 sentences)
4. Only include ideas that have real business potential

Here is the video summary:
${summary}

Respond ONLY with the startup ideas as a numbered list, with no introduction or additional commentary.`,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    // Extract ideas from the response
    const content = response.data.content || [];
    if (!content.length || !content[0].text) {
      return ["No startup ideas were identified in the video summary."];
    }

    // Parse the response to extract the numbered list of ideas
    const ideasText = content[0].text;

    // Split by numbered items (1., 2., etc.)
    const ideasRegex = /\d+\.\s+([\s\S]+?)(?=\n\d+\.|\n*$)/g;
    const matches = [...ideasText.matchAll(ideasRegex)];

    // Extract the ideas
    const ideas = matches.map((match) => match[1].trim());

    // If no ideas were extracted using the regex, fallback to simple newline splitting
    if (ideas.length === 0) {
      return ideasText
        .split("\n")
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, "").trim());
    }

    return ideas;
  } catch (error) {
    console.error("Error extracting startup ideas:", error);
    if (axios.isAxiosError(error)) {
      console.error("API response:", error.response?.data);
    }
    throw new Error(
      `Failed to extract startup ideas: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
