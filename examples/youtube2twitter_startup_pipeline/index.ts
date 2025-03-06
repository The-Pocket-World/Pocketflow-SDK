/**
 * YouTube to Twitter Startup Pipeline Example
 *
 * This example demonstrates how to:
 * 1. Summarize a YouTube video
 * 2. Extract startup ideas from the summary using Anthropic API
 * 3. Search Twitter for relevant startups and founders for each idea
 * 4. Generate an HTML report with all the information
 */

import { runYoutubeSummarizerWorkflow } from "../../src/flows/youtube_summarizer";
import { runTwitterMonitoringPostsWorkflow } from "../../src/flows/twitter";
import * as dotenv from "dotenv";
import { generateHtmlReport, saveHtmlReport } from "./template-utils";
import { extractStartupIdeas } from "./anthropic-utils";

// Load environment variables
dotenv.config();

/**
 * Configuration options for the YouTube to Twitter pipeline
 */
export interface YouTubeToTwitterPipelineOptions {
  /** Authentication token for the PocketFlow API */
  authToken?: string;
  /** Anthropic API key */
  anthropicApiKey?: string;
  /** YouTube video URL */
  videoUrl: string;
  /** Summary length (default: 'medium') */
  summaryLength?: string;
  /** Maximum number of tweets to retrieve per startup idea */
  tweetsPerIdea?: number;
  /** Whether to save the results to an HTML file */
  saveResults?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Startup idea with related tweets
 */
export interface StartupIdeaWithTweets {
  /** The startup idea extracted from the video */
  idea: string;
  /** The tweets related to this startup idea */
  tweets: any[];
}

/**
 * Result of the YouTube to Twitter pipeline
 */
export interface YouTubeToTwitterPipelineResult {
  /** Video metadata */
  videoMetadata: Record<string, any>;
  /** Video summary */
  summary: string;
  /** Key points from the video */
  keyPoints: any[];
  /** Startup ideas extracted from the summary */
  startupIdeas: string[];
  /** Startup ideas with related tweets */
  startupIdeasWithTweets: StartupIdeaWithTweets[];
}

/**
 * Run the YouTube to Twitter pipeline
 *
 * @param options Configuration options
 * @returns A promise that resolves with the pipeline results
 */
export async function runYouTubeToTwitterPipeline(
  options: YouTubeToTwitterPipelineOptions
): Promise<YouTubeToTwitterPipelineResult> {
  // Extract options with defaults
  const authToken = options.authToken || process.env.POCKETFLOW_API_KEY;
  const anthropicApiKey =
    options.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  const saveResults =
    options.saveResults !== undefined ? options.saveResults : true;
  const verbose = options.verbose !== undefined ? options.verbose : false;
  const tweetsPerIdea = options.tweetsPerIdea || 5;
  const summaryLength = options.summaryLength || "medium";

  if (!authToken) {
    throw new Error("POCKETFLOW_API_KEY is required but not provided");
  }

  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is required but not provided");
  }

  if (verbose) {
    console.log(`🔍 Analyzing YouTube video: ${options.videoUrl}`);
  }

  try {
    // Create a shared socket connection for all workflows
    const { connectSocket } = await import("../../src/socket/connect");
    const sharedSocket = await connectSocket(process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai", { token: authToken });
    
    try {
      // Step 1: Summarize the YouTube video
      if (verbose) console.log("📝 Summarizing YouTube video...");
      const summaryResult = await runYoutubeSummarizerWorkflow(
        {
          videoUrl: options.videoUrl,
          summaryLength,
        },
        authToken,
        sharedSocket // Pass the shared socket
      );

      if (verbose) {
        console.log(`✅ Video summarized successfully`);
        console.log(
          `📊 Summary length: ${summaryResult.summary.length} characters`
        );
        console.log(`📊 Key points: ${summaryResult.keyPoints.length}`);
      }

      // Step 2: Extract startup ideas from the summary using Anthropic API
      if (verbose) console.log("💡 Extracting startup ideas from summary...");
      const startupIdeas = await extractStartupIdeas(
        summaryResult.summary,
        anthropicApiKey
      );

      if (verbose) {
        console.log(`✅ Extracted ${startupIdeas.length} startup ideas`);
        startupIdeas.forEach((idea, index) => {
          console.log(`  ${index + 1}. ${idea.substring(0, 80)}...`);
        });
      }

      // Step 3: Search Twitter for each startup idea
      if (verbose) console.log("🔍 Searching Twitter for related content...");

      const startupIdeasWithTweets: StartupIdeaWithTweets[] = [];

      for (const idea of startupIdeas) {
        if (verbose) console.log(`  Searching for: ${idea.substring(0, 40)}...`);

        const twitterResult = await runTwitterMonitoringPostsWorkflow(
          {
            prompt: idea,
            project_description: "Startup idea from YouTube video",
            limit: tweetsPerIdea,
            min_likes: 50,
            min_retweets: 20,
          },
          authToken,
          sharedSocket // Pass the shared socket
        );

      startupIdeasWithTweets.push({
        idea,
        tweets: twitterResult.tweets || [],
      });

      if (verbose) {
        console.log(
          `    Found ${twitterResult.tweets ? twitterResult.tweets.length : 0} tweets`
        );
      }
    }

    // Compile results
    const result: YouTubeToTwitterPipelineResult = {
      videoMetadata: summaryResult.metadata || {},
      summary: summaryResult.summary || "",
      keyPoints: summaryResult.keyPoints || [],
      startupIdeas,
      startupIdeasWithTweets,
    };
    
    // For debugging
    if (verbose) {
      console.log("📊 Result summary:");
      console.log(`  Video: ${result.videoMetadata?.title || "Unknown title"}`);
      console.log(`  Summary: ${result.summary.substring(0, 100)}...`);
      console.log(`  Key points: ${result.keyPoints.length}`);
      console.log(`  Startup ideas: ${result.startupIdeas.length}`);
      console.log(`  Tweets found: ${result.startupIdeasWithTweets.reduce((acc, item) => acc + (item.tweets?.length || 0), 0)}`);
    }

    // Generate HTML report if requested
    if (saveResults) {
      if (verbose) console.log("📄 Generating HTML report...");
      try {
        const htmlContent = generateHtmlReport(result);
        const outputPath = saveHtmlReport(htmlContent);
        if (verbose) console.log(`📊 Report saved to: ${outputPath}`);
      } catch (error) {
        console.error("Error generating HTML report:", error);
        console.error("Continuing without HTML report...");
      }
    }

    return result;
    } finally {
      // Clean up the shared socket connection after all workflows are complete
      if (sharedSocket?.disconnect) {
        if (verbose) console.log("🔌 Disconnecting shared socket connection...");
        sharedSocket.disconnect();
      }
    }
  } catch (error) {
    console.error(
      "❌ Error in YouTube to Twitter pipeline:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}

/**
 * Run the example with command line arguments
 */
async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const videoUrl = args[0]; // Default example video
    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    console.log("🚀 Running YouTube to Twitter Startup Pipeline Example");
    console.log(`🔗 Video URL: ${videoUrl}`);

    const authToken = process.env.POCKETFLOW_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!authToken) {
      throw new Error("POCKETFLOW_API_KEY environment variable is not set");
    }

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }

    const result = await runYouTubeToTwitterPipeline({
      videoUrl,
      authToken,
      anthropicApiKey,
      verbose: true,
    });

    console.log("\n✅ Pipeline completed successfully!");
    console.log(`📊 Summary length: ${result.summary.length} characters`);
    console.log(`💡 Extracted ${result.startupIdeas.length} startup ideas`);
    console.log(
      `🐦 Found tweets for ${result.startupIdeasWithTweets.length} startup ideas`
    );

    return result;
  } catch (error) {
    console.error(
      "\n❌ Error running example:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}

// Export functions for programmatic usage
export { main };
