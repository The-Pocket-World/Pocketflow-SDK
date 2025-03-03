import * as fs from "fs";
import * as path from "path";

/**
 * Interface for Twitter search result data
 */
export interface TwitterSearchResult {
  prompt: string;
  project_description: string;
  limit: number;
  query: string;
  tweets: Array<{
    title: string;
    content: string;
    url: string;
    score: number;
    reason: string;
    metadata: {
      created_at: string;
      author: string;
      retweet_count: number;
      favorite_count: number;
    };
  }>;
  success: boolean;
}

/**
 * Generates an HTML report from Twitter search results using templates
 * @param result The Twitter search results
 * @returns HTML content as a string
 */
export function generateHtmlReport(result: TwitterSearchResult): string {
  // Load the HTML templates
  const templatePath = path.join(__dirname, "template.html");
  const tweetTemplatePath = path.join(__dirname, "tweet-template.html");

  let mainTemplate = fs.readFileSync(templatePath, "utf8");
  const tweetTemplate = fs.readFileSync(tweetTemplatePath, "utf8");

  // Generate the tweet list HTML
  const tweetListHtml = result.tweets
    .map((tweet) => {
      let tweetHtml = tweetTemplate;

      // Replace placeholders with actual data
      tweetHtml = tweetHtml.replace("{{title}}", tweet.title);
      tweetHtml = tweetHtml.replace("{{content}}", tweet.content);
      tweetHtml = tweetHtml.replace("{{author}}", tweet.metadata.author);
      tweetHtml = tweetHtml.replace(
        "{{created_at}}",
        tweet.metadata.created_at
      );
      tweetHtml = tweetHtml.replace(
        "{{retweet_count}}",
        tweet.metadata.retweet_count.toString()
      );
      tweetHtml = tweetHtml.replace(
        "{{favorite_count}}",
        tweet.metadata.favorite_count.toString()
      );
      tweetHtml = tweetHtml.replace("{{score}}", tweet.score.toString());
      tweetHtml = tweetHtml.replace("{{reason}}", tweet.reason);
      tweetHtml = tweetHtml.replace("{{url}}", tweet.url);

      return tweetHtml;
    })
    .join("");

  // Replace placeholders in the main template
  mainTemplate = mainTemplate.replace("{{prompt}}", result.prompt);
  mainTemplate = mainTemplate.replace(
    "{{project_description}}",
    result.project_description
  );
  mainTemplate = mainTemplate.replace(
    "{{tweet_count}}",
    result.tweets.length.toString()
  );
  mainTemplate = mainTemplate.replace("{{tweet_list}}", tweetListHtml);

  return mainTemplate;
}

/**
 * Saves the HTML report to a file
 * @param htmlContent The HTML content to save
 * @param outputPath Optional custom output path
 * @returns The path to the saved file
 */
export function saveHtmlReport(
  htmlContent: string,
  outputPath?: string
): string {
  const filePath =
    outputPath || path.join(process.cwd(), "twitter-analysis.html");
  fs.writeFileSync(filePath, htmlContent);
  return filePath;
}
