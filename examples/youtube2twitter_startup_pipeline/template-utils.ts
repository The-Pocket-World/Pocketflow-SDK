import * as fs from "fs";
import * as path from "path";
import { YouTubeToTwitterPipelineResult } from "./index";

/**
 * Generates an HTML report from the pipeline results
 * @param result The pipeline results
 * @returns HTML content as a string
 */
export function generateHtmlReport(
  result: YouTubeToTwitterPipelineResult
): string {
  try {
    // HTML template string (inline for simplicity)
    const mainTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube to Twitter Startup Pipeline Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      background-color: #4285f4;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin-bottom: 20px;
    }
    .video-info {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .video-thumbnail {
      flex: 0 0 320px;
    }
    .video-thumbnail img {
      width: 100%;
      border-radius: 8px;
    }
    .video-details {
      flex: 1;
    }
    .summary-section, .ideas-section {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .startup-idea {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .idea-header {
      background-color: #34a853;
      color: white;
      padding: 15px;
      margin: -20px -20px 20px -20px;
      border-radius: 8px 8px 0 0;
    }
    .tweet {
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      background-color: #fff;
    }
    .tweet-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .tweet-author {
      font-weight: bold;
      margin-right: 10px;
    }
    .tweet-date {
      color: #657786;
      font-size: 0.9em;
    }
    .tweet-content {
      margin-bottom: 10px;
    }
    .tweet-meta {
      display: flex;
      font-size: 0.9em;
      color: #657786;
    }
    .tweet-meta div {
      margin-right: 20px;
    }
    .key-points {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .key-point {
      margin-bottom: 10px;
      padding: 10px;
      background-color: #e8f4f8;
      border-radius: 4px;
    }
    .score {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: bold;
      background-color: #f2f2f2;
      margin-left: 10px;
    }
    a {
      color: #1da1f2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>YouTube to Twitter Startup Pipeline Report</h1>
    <p>Generated on {{date}}</p>
  </div>

  <div class="video-info">
    <div class="video-thumbnail">
      <img src="{{thumbnailUrl}}" alt="Video thumbnail">
    </div>
    <div class="video-details">
      <h2>{{videoTitle}}</h2>
      <p><strong>Channel:</strong> {{channelName}}</p>
      <p><strong>Published:</strong> {{publishDate}}</p>
      <p><a href="{{videoUrl}}" target="_blank">Watch on YouTube</a></p>
    </div>
  </div>

  <div class="summary-section">
    <h2>Video Summary</h2>
    <p>{{summary}}</p>
    
    <div class="key-points">
      <h3>Key Points</h3>
      <div class="key-points-list">
        {{keyPointsList}}
      </div>
    </div>
  </div>

  <div class="ideas-section">
    <h2>Startup Ideas</h2>
    <p>{{startupIdeasCount}} startup ideas were extracted from the video:</p>
    <div class="startup-ideas-list">
      {{startupIdeasList}}
    </div>
  </div>
</body>
</html>`;

    const tweetTemplate = `<div class="tweet">
  <div class="tweet-header">
    <div class="tweet-author">{{author}}</div>
    <div class="tweet-date">{{date}}</div>
    <div class="score">Relevance: {{score}}</div>
  </div>
  <div class="tweet-content">{{content}}</div>
  <div class="tweet-meta">
    <div>♻️ {{retweets}}</div>
    <div>❤️ {{likes}}</div>
  </div>
  <div><a href="{{url}}" target="_blank">View on Twitter</a></div>
</div>`;

    // Prepare data for template
    const date = new Date().toLocaleString();
    const videoMetadata = result.videoMetadata || {};
    const thumbnailUrl =
      videoMetadata.thumbnail_url ||
      "https://via.placeholder.com/320x180?text=No+Thumbnail";
    const videoTitle = videoMetadata.title || "Untitled Video";
    const channelName = videoMetadata.channel_name || "Unknown Channel";
    const publishDate = videoMetadata.publish_date || "Unknown";
    const videoUrl = videoMetadata.url || "#";

    // Generate key points HTML
    const keyPointsList = result.keyPoints
      .map((point) => {
        return `<div class="key-point">${typeof point === "string" ? point : JSON.stringify(point)}</div>`;
      })
      .join("");

    // Generate startup ideas with tweets HTML
    const startupIdeasCount = result.startupIdeas.length;

    // Add logging to help diagnose any potential undefined issues
    console.log(
      `Found ${result.startupIdeasWithTweets.length} startup ideas with tweets`
    );
    result.startupIdeasWithTweets.forEach((idea, index) => {
      console.log(
        `Idea ${index + 1}: "${idea.idea.substring(0, 40)}..." has ${idea.tweets ? idea.tweets.length : 0} tweets (${idea.tweets ? "defined" : "undefined"} tweets array)`
      );
    });

    const startupIdeasList = result.startupIdeasWithTweets
      .map((ideaWithTweets) => {
        // Add defensive check to handle undefined tweets
        const tweets = ideaWithTweets.tweets || [];
        const tweetsHtml = tweets
          .map((tweet) => {
            let tweetHtml = tweetTemplate;
            const metadata = tweet.metadata || {};

            tweetHtml = tweetHtml.replace(
              "{{author}}",
              metadata.author || "Unknown Author"
            );
            tweetHtml = tweetHtml.replace(
              "{{date}}",
              metadata.created_at || "Unknown Date"
            );
            tweetHtml = tweetHtml.replace(
              "{{content}}",
              tweet.content || "No content"
            );
            tweetHtml = tweetHtml.replace(
              "{{score}}",
              (tweet.score || 0).toFixed(2)
            );
            tweetHtml = tweetHtml.replace(
              "{{retweets}}",
              metadata.retweet_count || 0
            );
            tweetHtml = tweetHtml.replace(
              "{{likes}}",
              metadata.favorite_count || 0
            );
            tweetHtml = tweetHtml.replace("{{url}}", tweet.url || "#");

            return tweetHtml;
          })
          .join("");

        return `
      <div class="startup-idea">
        <div class="idea-header">
          <h3>Startup Idea</h3>
        </div>
        <p>${ideaWithTweets.idea}</p>
        <h4>Related Tweets</h4>
        ${tweetsHtml.length > 0 ? tweetsHtml : "<p>No related tweets found.</p>"}
      </div>`;
      })
      .join("");

    // Replace placeholders with data
    let html = mainTemplate;
    html = html.replace("{{date}}", date);
    html = html.replace("{{thumbnailUrl}}", thumbnailUrl);
    html = html.replace("{{videoTitle}}", videoTitle);
    html = html.replace("{{channelName}}", channelName);
    html = html.replace("{{publishDate}}", publishDate);
    html = html.replace("{{videoUrl}}", videoUrl);
    html = html.replace(
      "{{summary}}",
      result.summary || "No summary available"
    );
    html = html.replace("{{keyPointsList}}", keyPointsList);
    html = html.replace("{{startupIdeasCount}}", startupIdeasCount.toString());
    html = html.replace("{{startupIdeasList}}", startupIdeasList);

    return html;
  } catch (error) {
    console.error("Error generating HTML report:", error);
    return `<html><body><h1>Error generating report</h1><p>${error}</p></body></html>`;
  }
}

/**
 * Saves the HTML report to a file
 * @param htmlContent The HTML content to save
 * @param outputPath Optional custom output path
 * @returns The path where the file was saved
 */
export function saveHtmlReport(
  htmlContent: string,
  outputPath?: string
): string {
  try {
    // Create a default filename based on the current date/time
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    const filename = outputPath || `youtube2twitter_report_${timestamp}.html`;

    // Make sure the directory exists
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(filename, htmlContent);
    return filename;
  } catch (error) {
    console.error("Error saving HTML report:", error);
    throw error;
  }
}
