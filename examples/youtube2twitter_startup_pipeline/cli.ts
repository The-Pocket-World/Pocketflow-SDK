#!/usr/bin/env node

/**
 * CLI for YouTube to Twitter Startup Pipeline Example
 *
 * This CLI tool allows users to easily run the YouTube to Twitter pipeline
 * from the command line with various options.
 */

import { program } from "commander";
import * as dotenv from "dotenv";
import { runYouTubeToTwitterPipeline } from "./index";

// Load environment variables
dotenv.config();

// Set up the command line interface
program
  .name("youtube2twitter")
  .description(
    "Extracts startup ideas from YouTube videos and finds relevant Twitter content"
  )
  .version("1.0.0");

program
  .argument("<videoUrl>", "URL of the YouTube video to analyze")
  .option(
    "-s, --summary-length <length>",
    "Length of the summary (short, medium, long)",
    "medium"
  )
  .option(
    "-t, --tweets-per-idea <number>",
    "Number of tweets to retrieve per startup idea",
    "5"
  )
  .option(
    "--min-likes <number>",
    "Minimum number of likes for a tweet to be included",
    "0"
  )
  .option(
    "--min-retweets <number>",
    "Minimum number of retweets for a tweet to be included",
    "0"
  )
  .option("-o, --output <path>", "Path to save the HTML report")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("--no-save", "Do not save the HTML report")
  .action(async (videoUrl, options) => {
    try {
      // Get auth tokens from environment variables
      const authToken = process.env.POCKETFLOW_API_KEY;
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

      if (!authToken) {
        console.error(
          "❌ Error: POCKETFLOW_API_KEY environment variable is not set"
        );
        console.error(
          "Please set it in your .env file or as an environment variable"
        );
        process.exit(1);
      }

      if (!anthropicApiKey) {
        console.error(
          "❌ Error: ANTHROPIC_API_KEY environment variable is not set"
        );
        console.error(
          "Please set it in your .env file or as an environment variable"
        );
        process.exit(1);
      }

      // Log configuration if verbose
      if (options.verbose) {
        console.log("\n📋 Configuration:");
        console.log(`  Video URL: ${videoUrl}`);
        console.log(`  Summary length: ${options.summaryLength}`);
        console.log(`  Tweets per idea: ${options.tweetsPerIdea}`);
        console.log(`  Min likes: ${options.minLikes}`);
        console.log(`  Min retweets: ${options.minRetweets}`);
        console.log(`  Save report: ${options.save ? "Yes" : "No"}`);
        if (options.output) {
          console.log(`  Output path: ${options.output}`);
        }
      }

      console.log("🚀 Running YouTube to Twitter Startup Pipeline...");

      // Run the pipeline
      const result = await runYouTubeToTwitterPipeline({
        videoUrl,
        authToken,
        anthropicApiKey,
        summaryLength: options.summaryLength,
        tweetsPerIdea: parseInt(options.tweetsPerIdea, 10),
        minLikes: parseInt(options.minLikes, 10),
        minRetweets: parseInt(options.minRetweets, 10),
        saveResults: options.save,
        verbose: options.verbose,
      });

      console.log("\n✅ YouTube to Twitter pipeline completed successfully!");
      console.log(
        `📊 Video: ${result.videoMetadata?.title || "Unknown title"}`
      );
      console.log(`📊 Summary length: ${result.summary.length} characters`);
      console.log(`💡 Extracted ${result.startupIdeas.length} startup ideas`);

      if (!options.verbose) {
        // Show startup ideas in non-verbose mode (they're already shown in verbose mode)
        console.log("\n💡 Startup Ideas:");
        result.startupIdeas.forEach((idea, index) => {
          console.log(`  ${index + 1}. ${idea.substring(0, 100)}...`);
        });
      }

      console.log(
        `\n🔍 Found tweets for ${result.startupIdeasWithTweets.length} startup ideas`
      );
      console.log(
        `📊 Total tweets: ${result.startupIdeasWithTweets.reduce((acc, idea) => acc + idea.tweets.length, 0)}`
      );
    } catch (error) {
      console.error(
        "\n❌ Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
