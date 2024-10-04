const axios = require('axios');
const rss = require('rss-parser');
const chalk = require('chalk');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const { settings, feeds, customMessage } = require('./settings.json');
const parser = new rss();
const app = express();
const settingsPath = path.join(__dirname, 'settings.json');

const DEBUG = false;
let lastUpdated = new Date();
let latestCheckedFeedItemDate = lastUpdated;
let WebhookUrl = settings.webhook;
let translateEnabled = '';

if (DEBUG) {
    console.log(chalk.bgGreen('DEBUG MODE'));
    lastUpdated = new Date(lastUpdated.getTime() - 20 * 60 * 1000);
    settings.interval_minutes = 0.5;
}

if (settings.singleWebhook) {
    console.log(chalk.green.underline("SingleWebhook: True"));
} else {
    console.log(chalk.yellow.underline("SingleWebhook: False\nUsing specific webhook for each feed."));
}

setInterval(() => {
    checkAllFeeds();
    lastUpdated = latestCheckedFeedItemDate;
}, 60 * 1000 * settings.interval_minutes);

checkAllFeeds();

async function handleFeed(feed) {
    const url = `https://nitter.poast.org/${feed.username}/rss`;
    try {
        const parsed = await parser.parseURL(url);
        const username = parsed.image.title;
        const avatarUrl = parsed.image.url.replace(/nitter\.poast\.org\/pic\//, '').replace(/%2F/g, '/');
        
        for (const item of parsed.items.reverse()) {
            const itemDate = new Date(item.pubDate);
            if (itemDate > lastUpdated && !isRetweet(item, feed.username)) {
                await handleFeedItem(item, feed, username, avatarUrl);
                latestCheckedFeedItemDate = Math.max(latestCheckedFeedItemDate, itemDate);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

function isRetweet(item, username) {
    return item.title.startsWith(`R by @${username}`) || item.title.startsWith(`RT by @${username}`);
}

async function sendMessageToWebhook(message, webhook, username, avatarUrl) {
    try {
        await axios.post(webhook, {
            content: message,
            username: username,
            avatar_url: avatarUrl,
        });
        console.log(chalk.green.underline(`Sent message to ${webhook}`));
    } catch (err) {
        console.error(err);
    }
}

async function checkAllFeeds() {
    console.log(chalk.green.underline("Running checkAllFeeds Module..."));

    for (let feedIndex = 0; feedIndex < feeds.length; feedIndex++) {
        const feed = feeds[feedIndex];
        console.log(`${feedIndex + 1}.User: ${feed.username}\nChecking feeds at ${new Date()}...\n`);

        translateEnabled = feed.translate ? 'en' : '';

        await handleFeed(feed);
        await delay(settings.seconds_between_feeds * 1000);
    }

    console.log(chalk.blue(`All feeds checked. Sleeping for ${settings.interval_minutes} minutes...`));
}

async function handleFeedItem(feedItem, feed, username, avatarUrl) {
    const message = await buildMessageFromFeed(feedItem, feed);
    sendMessageToWebhook(message, WebhookUrl, username, avatarUrl);
}

async function buildMessageFromFeed(feedItem, feed) {
    const fxTwitterLink = new URL(feedItem.link);
    fxTwitterLink.hostname = 'fxtwitter.com';
    fxTwitterLink.hash = '';

    return `${customMessage || ''}[Tweeted](${fxTwitterLink + translateEnabled})`;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Web server routes
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/settings', (req, res) => {
    fs.readFile(settingsPath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading settings file');
        }
        res.send(data);
    });
});

app.post('/update-settings', (req, res) => {
    fs.writeFile(settingsPath, JSON.stringify(req.body, null, 2), err => {
        if (err) {
            return res.status(500).send('Error writing settings file');
        }
        res.send('Settings updated successfully');
    });
});

app.post('/test-webhook', (req, res) => {
    const { message, webhook, username, avatarUrl } = req.body;

    if (!webhook) {
        return res.status(400).send('Webhook URL is required');
    }

    sendMessageToWebhook(message, webhook, username || 'Test User', avatarUrl || null);
    res.send(`Test message sent to webhook: ${webhook}`);
});

app.listen(3000, () => {
    console.log('Webpanel is up and running!');
});
