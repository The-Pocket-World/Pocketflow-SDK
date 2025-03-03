/**
 * This is an example of what a generated workflow file might look like
 * This would be generated automatically by the CLI based on your workflow schema
 */

import { runWorkflow } from "../src/socket/workflow";
import { Socket } from "socket.io-client";

/**
 * Input interface for the Twitter Search workflow
 */
export interface TwitterSearchWorkflowInput {
  /**
   * Search query for Twitter
   */
  query: string;

  /**
   * Maximum number of results to return
   */
  maxResults: number;

  /**
   * Whether to include retweets
   */
  includeRetweets: boolean;
}

/**
 * Output interface for the Twitter Search workflow
 */
export interface TwitterSearchWorkflowOutput {
  /**
   * Array of tweet results
   */
  tweets: {
    id: string;
    text: string;
    author: string;
    date: string;
    likes: number;
    retweets: number;
  }[];

  /**
   * Whether the search was successful
   */
  success: boolean;

  /**
   * Total number of results found
   */
  totalResults: number;
}

/**
 * Run the "Twitter Search" workflow
 *
 * This workflow searches Twitter for posts matching the given query
 * and returns the results with metadata.
 *
 * @param input The input parameters for the workflow
 * @param socket A socket.io Socket instance
 * @param token Authentication token
 * @returns A promise that resolves with the workflow output
 */
export async function runTwitterSearchWorkflow(
  input: TwitterSearchWorkflowInput,
  socket: Socket,
  token: string
): Promise<TwitterSearchWorkflowOutput> {
  return new Promise((resolve, reject) => {
    try {
      // Setup response handler
      const handleComplete = (data: any) => {
        resolve(data as TwitterSearchWorkflowOutput);
      };

      // Run the workflow
      const cleanup = runWorkflow(socket, "wf_twitter_search", token, input, {
        handlers: {
          run_complete: handleComplete,
          run_error: (error: any) => reject(error),
        },
      });

      // Return cleanup function for caller to use if needed
      return cleanup;
    } catch (error) {
      reject(error);
    }
  });
}
