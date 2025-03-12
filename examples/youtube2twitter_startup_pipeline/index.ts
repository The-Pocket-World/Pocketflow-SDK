/**
 * YouTube to Twitter Startup Pipeline Example
 *
 * This example demonstrates how to:
 * 1. Summarize a YouTube video
 * 2. Extract startup ideas from the summary using Anthropic API
 * 3. Search Twitter for relevant startups and founders for each idea
 * 4. Generate an HTML report with all the information
 */

import * as dotenv from "dotenv";
import { runTwitterMonitoringPostsWorkflow } from "../../src/flows/twitter";
import { runYoutubeSummarizerWorkflow } from "../../src/flows/youtube_summarizer";
import { extractStartupIdeas } from "./anthropic-utils";
import { generateHtmlReport, saveHtmlReport } from "./template-utils";

// Custom wrapper for YouTube summarizer workflow to handle consolidated events
async function runYoutubeSummarizerWithFallback(
  input: {
    videoUrl: string;
    summaryLength: string;
  },
  authToken: string,
  socket: any
): Promise<{
  summary: string;
  keyPoints: any[];
  metadata: Record<string, any>;
}> {
  // Store data from stream events
  let lastKnownSummary: string | undefined;
  let lastKnownKeyPoints: any[] = [];
  let lastKnownMetadata: Record<string, any> = {};
  let completionPromise: Promise<any>;

  // Create a promise to handle the workflow result
  const runCompletePromise = new Promise((resolve, reject) => {
    // Add our own event handlers on top of the socket
    const originalOn = socket.on.bind(socket);
    socket.on = function (
      eventName: string,
      callback: (...args: any[]) => void
    ) {
      if (eventName === "stream_output") {
        originalOn(eventName, (data: any) => {
          // Track summary and key points from stream events
          if (data.type === "node_update" && data.state) {
            if (data.state.summary) {
              console.log("Found summary in stream_output event");
              lastKnownSummary = data.state.summary;
            }
            if (data.state.keyPoints) {
              console.log("Found keyPoints in stream_output event");
              lastKnownKeyPoints = data.state.keyPoints;
            }
            if (data.state.metadata) {
              console.log("Found metadata in stream_output event");
              lastKnownMetadata = data.state.metadata;
            }
          }
          callback(data);
        });
      } else if (eventName === "run_complete") {
        originalOn(eventName, (data: any) => {
          console.log(
            "Received run_complete event. Data has output:",
            !!data.output
          );

          // Check if output field exists in run_complete event
          if (data.output) {
            if (data.output.summary) {
              console.log("Found summary in run_complete output");
              lastKnownSummary = data.output.summary;
            }
            if (data.output.keyPoints) {
              console.log("Found keyPoints in run_complete output");
              lastKnownKeyPoints = data.output.keyPoints;
            }
            if (data.output.metadata) {
              console.log("Found metadata in run_complete output");
              lastKnownMetadata = data.output.metadata;
            }
          }

          callback(data);

          // Resolve with whatever data we have at this point
          resolve({
            summary: lastKnownSummary || "",
            keyPoints: lastKnownKeyPoints,
            metadata: lastKnownMetadata,
          });
        });
      } else if (eventName === "run_error") {
        originalOn(eventName, (data: any) => {
          callback(data);
          reject(new Error(data.message || "Workflow execution failed"));
        });
      } else {
        originalOn(eventName, callback);
      }
      return this;
    };
  });

  // Call the original function and wait for the run_complete event
  const runPromise = runYoutubeSummarizerWorkflow(input, authToken, socket);

  try {
    // Wait for either the workflow result or our own run_complete handler
    const result = (await Promise.race([runPromise, runCompletePromise])) as {
      summary?: string;
      keyPoints?: any[];
      metadata?: Record<string, any>;
    };

    // Build the final result with fallbacks
    return {
      summary: result.summary || lastKnownSummary || "",
      keyPoints: result.keyPoints || lastKnownKeyPoints || [],
      metadata: result.metadata || lastKnownMetadata || {},
    };
  } catch (error) {
    console.error("Error in YouTube summarizer workflow:", error);

    // If we have any data from stream events, return that instead of failing
    if (
      lastKnownSummary ||
      lastKnownKeyPoints.length > 0 ||
      Object.keys(lastKnownMetadata).length > 0
    ) {
      console.log(
        "Using captured data from stream events despite workflow error"
      );
      return {
        summary: lastKnownSummary || "",
        keyPoints: lastKnownKeyPoints || [],
        metadata: lastKnownMetadata || {},
      };
    }

    throw error;
  }
}

// Custom wrapper for Twitter monitoring workflow to handle consolidated events
async function runTwitterMonitoringWithFallback(
  input: any,
  authToken: string,
  socket: any
): Promise<{ tweets: any[] }> {
  // Store tweets from stream events
  let lastKnownTweets: any[] = [];

  // Create a promise to handle the workflow result
  const runCompletePromise = new Promise<{ tweets: any[] }>(
    (resolve, reject) => {
      // Add our own event handlers on top of the socket
      const originalOn = socket.on.bind(socket);
      socket.on = function (
        eventName: string,
        callback: (...args: any[]) => void
      ) {
        if (eventName === "stream_output") {
          originalOn(eventName, (data: any) => {
            // Track tweets from stream events
            if (
              data.type === "node_update" &&
              data.state &&
              data.state.tweets &&
              Array.isArray(data.state.tweets)
            ) {
              console.log(
                `Found ${data.state.tweets.length} tweets in stream_output event`
              );
              lastKnownTweets = data.state.tweets;
            }
            callback(data);
          });
        } else if (eventName === "run_complete") {
          originalOn(eventName, (data: any) => {
            console.log(
              "Received run_complete event. Data has output:",
              !!data.output
            );

            // Check if output field exists in run_complete event
            if (
              data.output &&
              data.output.tweets &&
              Array.isArray(data.output.tweets)
            ) {
              console.log(
                `Found ${data.output.tweets.length} tweets in run_complete output`
              );
              lastKnownTweets = data.output.tweets;
            }

            callback(data);

            // Resolve with whatever data we have at this point
            resolve({
              tweets: lastKnownTweets || [],
            });
          });
        } else if (eventName === "run_error") {
          originalOn(eventName, (data: any) => {
            callback(data);
            reject(new Error(data.message || "Workflow execution failed"));
          });
        } else {
          originalOn(eventName, callback);
        }
        return this;
      };
    }
  );

  // Call the original function and wait for the run_complete event
  const runPromise = runTwitterMonitoringPostsWorkflow(
    input,
    authToken,
    socket
  );

  try {
    // Wait for either the workflow result or our own run_complete handler
    const result = (await Promise.race([runPromise, runCompletePromise])) as {
      tweets?: any[];
    };

    // Build the final result with fallbacks
    return {
      tweets: result.tweets || lastKnownTweets || [],
    };
  } catch (error) {
    console.error("Error in Twitter monitoring workflow:", error);

    // If we have any data from stream events, return that instead of failing
    if (lastKnownTweets.length > 0) {
      console.log(
        `Using ${lastKnownTweets.length} tweets from stream events despite workflow error`
      );
      return {
        tweets: lastKnownTweets,
      };
    }

    throw error;
  }
}

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
  /** Minimum number of likes for a tweet to be included */
  minLikes?: number;
  /** Minimum number of retweets for a tweet to be included */
  minRetweets?: number;
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
 * Create a new socket connection
 *
 * @param authToken Authentication token for the PocketFlow API
 * @param verbose Enable verbose logging
 * @returns A promise that resolves with the socket connection
 */
async function createSocketConnection(
  authToken: string,
  verbose: boolean = false
) {
  const { connectSocket } = await import("../../src/socket/connect");
  if (verbose) console.log("🔌 Creating new socket connection...");
  return connectSocket(
    process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai",
    { token: authToken }
  );
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
  const minLikes = options.minLikes !== undefined ? options.minLikes : 0;
  const minRetweets =
    options.minRetweets !== undefined ? options.minRetweets : 0;
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
    // Step 1: Summarize the YouTube video
    if (verbose) console.log("📝 Summarizing YouTube video...");

    // Create a dedicated socket for YouTube workflow
    const youtubeSocket = await createSocketConnection(authToken, verbose);
    if (verbose)
      console.log("🔌 Created dedicated socket for YouTube workflow");

    let summaryResult;
    try {
      summaryResult = await runYoutubeSummarizerWithFallback(
        {
          videoUrl: options.videoUrl,
          summaryLength,
        },
        authToken,
        youtubeSocket // Use dedicated YouTube socket
      );
    } finally {
      // Clean up YouTube socket
      if (youtubeSocket?.disconnect) {
        if (verbose)
          console.log("🔌 Disconnecting YouTube socket connection...");
        youtubeSocket.disconnect();
      }
    }

    console.log("SUMMARY RESULT RECEIVED:");
    console.log(
      JSON.stringify(
        {
          summaryExists: typeof summaryResult.summary === "string",
          summaryLength:
            typeof summaryResult.summary === "string"
              ? summaryResult.summary.length
              : 0,
          keyPointsLength: Array.isArray(summaryResult.keyPoints)
            ? summaryResult.keyPoints.length
            : "not an array",
          metadataExists: !!summaryResult.metadata,
        },
        null,
        2
      )
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

    // Add safety check for summary
    if (!summaryResult.summary || summaryResult.summary.length === 0) {
      console.log(
        "⚠️ WARNING: No summary content available. Cannot extract startup ideas."
      );
      console.log("Summary result:", summaryResult);
      throw new Error(
        "Failed to extract summary from video. The summary is empty or undefined."
      );
    }

    const startupIdeas = await extractStartupIdeas(
      summaryResult.summary,
      anthropicApiKey
    );

    console.log("STARTUP IDEAS EXTRACTION RESULT:");
    console.log(`Number of ideas extracted: ${startupIdeas.length}`);
    if (startupIdeas.length > 0) {
      console.log(
        "First idea preview:",
        startupIdeas[0].substring(0, 100) + "..."
      );
    }

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
      if (verbose)
        console.log(
          `\nSearching for tweets related to: ${idea.substring(0, 50)}...`
        );

      try {
        // Set up query for Twitter search
        const twitterQuery = idea.split(" ").slice(0, 5).join(" ");

        // Create a dedicated socket for each Twitter search
        const twitterSocket = await createSocketConnection(authToken, verbose);
        if (verbose)
          console.log("🔌 Created dedicated socket for Twitter workflow");

        let twitterResult;
        try {
          // Run the Twitter search workflow with dedicated socket
          twitterResult = await runTwitterMonitoringWithFallback(
            {
              prompt: twitterQuery,
              project_description: "Startup idea from YouTube video",
              limit: tweetsPerIdea,
              min_likes: minLikes,
              min_retweets: minRetweets,
            },
            authToken,
            twitterSocket
          );
        } finally {
          // Clean up Twitter socket
          if (twitterSocket?.disconnect) {
            if (verbose)
              console.log("🔌 Disconnecting Twitter socket connection...");
            twitterSocket.disconnect();
          }
        }

        // Add the idea with tweets to the result array
        startupIdeasWithTweets.push({
          idea,
          tweets: twitterResult.tweets || [],
        });

        if (verbose) {
          console.log(`  ✅ Found ${twitterResult.tweets?.length || 0} tweets`);
        }
      } catch (error) {
        console.error(`Error searching for tweets related to: ${idea}:`, error);
        console.error("Continuing without this idea...");
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
      console.log(
        `  Tweets found: ${result.startupIdeasWithTweets.reduce(
          (acc, item) => acc + (item.tweets?.length || 0),
          0
        )}`
      );
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
