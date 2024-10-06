const axios = require("axios");
const rss = require("rss-parser");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const parser = new rss();
const settingsPath = path.join(__dirname, "json/settings.json");
const accountListPath = path.join(__dirname, "json/followedAccounts.json");
const DEBUG = false;
let lastUpdated = new Date();
let latestCheckedFeedItemDate = lastUpdated;
let WebhookUrl;
let translateEnabled;
let feedDelay;
let accountListDelay;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let initialSettings = loadSettings();
let feeds = loadAccounts().feeds
feedDelay = initialSettings.settings.seconds_between_feeds;
accountListDelay = initialSettings.settings.interval_minutes;

if (DEBUG) {
  console.log(chalk.red("DEBUG MODE"));
  lastUpdated = new Date(lastUpdated.getTime() - 20 * 60 * 1000); //20 mins earlier
  accountListDelay = 1;
  feedDelay = 2;
}
let optimizedIntervals = initialSettings.settings.optimized_intervals; 
console.log(chalk.bgYellow.white("optimizedIntervals: "+optimizedIntervals))
if(optimizedIntervals) {
    
    if (DEBUG) {
      accountListDelay = (feedDelay * feeds.length + 60) / 60;
    } else {
      accountListDelay = (feedDelay * feeds.length + 300) / 60; 
    }
  }

function loadSettings() {
  const { settings } = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));

  return {
    settings,
  };
}

function loadAccounts() {
  const { feeds } = JSON.parse(fs.readFileSync(accountListPath, "utf-8"));

  return {
    feeds,
  };
}

setInterval(
  () => {
    checkAllAccs();
    lastUpdated = latestCheckedFeedItemDate;
  },
  60 * 1000 * accountListDelay,
);

checkAllAccs();

async function handleFeed(feed) {
  const url = `https://nitter.poast.org/${feed.username}/rss`;
  try {
    const parsed = await parser.parseURL(url);
    const username = parsed.image.title;
    const avatarUrl = parsed.image.url
      .replace(/nitter\.poast\.org\/pic\//, "")
      .replace(/%2F/g, "/");

    for (const item of parsed.items.reverse()) {
      const itemDate = new Date(item.pubDate);
      if (itemDate > lastUpdated && !isRetweet(item)) {
        await handleFeedItem(item, feed, username, avatarUrl);
        latestCheckedFeedItemDate = Math.max(
          latestCheckedFeedItemDate,
          itemDate,
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function isRetweet(item) {
  return item.title.startsWith(`R to`) || item.title.startsWith(`RT by`);
}

async function sendMessageToWebhook(message, webhook, username, avatarUrl) {
  try {
    await axios.post(webhook, {
      content: message,
      username: username,
      avatar_url: avatarUrl,
    });
    console.log(chalk.green.underline(`Sent message to ${webhook}`));
    await delay(5000);
  } catch (err) {
    console.error(err);
  }
}

async function checkAllAccs() {
  console.log(chalk.green.underline("Running checkAllAccs Module..."));
  
  const { settings } = loadSettings(); // Refresh settings here
  const { feeds }  = loadAccounts(); // Refresh settings here
  WebhookUrl = settings.webhook;
  if (!DEBUG && !optimizedIntervals) {
    feedDelay = settings.seconds_between_feeds;
    accountListDelay = settings.interval_minutes;
  }
  console.log(chalk.yellow.underline("feedDelay[Seconds]: "+ feedDelay));
  console.log(chalk.yellow.underline("accountListDelay[Minutes]:"+ accountListDelay)+ `\n`);

  for (let accIndex = 0; accIndex < feeds.length; accIndex++) {
    const feed = feeds[accIndex];
    console.log(
      `${accIndex + 1}.User: ${feed.username}\nChecking feeds at ${new Date()}...\n`,
    );

    translateEnabled = feed.translate ? "en" : "";
    await handleFeed(feed);
    await delay(feedDelay * 1000);
  }

  console.log(
    chalk.blue(
      `All feeds checked. Sleeping for ${accountListDelay} minutes...`,
    ),
  );
}

async function handleFeedItem(feedItem, feed, username, avatarUrl) {
  const message = await buildMessageFromFeed(feedItem, feed);
  await sendMessageToWebhook(message, WebhookUrl, username, avatarUrl);
}

async function buildMessageFromFeed(feedItem, feed) {
  const fxTwitterLink = new URL(feedItem.link);
  fxTwitterLink.hostname = "fxtwitter.com";
  fxTwitterLink.hash = "";

  return `${loadSettings().settings.customMessage}\n[Tweeted](${fxTwitterLink + translateEnabled})`;
}
