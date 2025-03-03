import { connectSocket } from "./src/socket/connect";
import { runWorkflow, ServerEmittedEvents } from "./src/socket/workflow";

const WORKFLOW_ID = "twitter";
const AUTH_TOKEN = "pfl_GnMSEMbjh3b8AnhcO3HhJp0cvsaS6fi4nCplw75n0";
const workflowInput = {
  prompt: "Show me competitors",
  project_description: "A SaaS AI Agent builder.",
  limit: 5,
};

const handleRunComplete = (data: ServerEmittedEvents["run_complete"]) => {
  const result = data.state as {
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
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Competitor Analysis Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .tweet { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
    .tweet-title { font-weight: bold; margin-bottom: 10px; }
    .tweet-content { margin-bottom: 10px; }
    .tweet-meta { color: #666; font-size: 0.9em; }
    .relevance { display: inline-block; padding: 3px 6px; background-color: #e0f7fa; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Competitor Analysis Results</h1>
      <p>Prompt: "${result.prompt}"</p>
      <p>Project: "${result.project_description}"</p>
      <p>Results: ${result.tweets.length} tweets found</p>
    </div>
    
    ${result.tweets
      .map(
        (tweet) => `
      <div class="tweet">
        <div class="tweet-title">${tweet.title}</div>
        <div class="tweet-content">${tweet.content}</div>
        <div class="tweet-meta">
          <p>Author: ${tweet.metadata.author} | Date: ${tweet.metadata.created_at}</p>
          <p>Retweets: ${tweet.metadata.retweet_count} | Likes: ${tweet.metadata.favorite_count}</p>
          <p>Relevance Score: <span class="relevance">${tweet.score}/5</span></p>
          <p>Reason: ${tweet.reason}</p>
          <p><a href="${tweet.url}" target="_blank">View on Twitter</a></p>
        </div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>`;

  const fs = require("fs");
  fs.writeFileSync("competitor-analysis.html", htmlContent);
  console.log("Results saved to competitor-analysis.html");
  socket.disconnect();
};

const socket = connectSocket("http://localhost:8080", {
  token: AUTH_TOKEN,

  eventHandlers: {
    run_complete: handleRunComplete,
  },
});

const cleanup = runWorkflow(socket, WORKFLOW_ID, AUTH_TOKEN, workflowInput, {
  prettyLogs: true,
});
