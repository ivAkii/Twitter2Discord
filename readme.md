
# Twitter2Discord: A Fork of Twitter to Discord Webhook

This script posts Twitter feeds to a Discord webhook via a Nitter RSS feed. It supports tweet translation using DeepL (now replaced by [FixTweet](https://github.com/FixTweet/FixTweet)) for better Discord embeds, and replaces the tweet links for improved presentation. Note that Nitter RSS isn't supported by all instances — you can find a list of supported instances [here](https://status.d420.de/).

## Changes in this fork
- Added web panel for easier configurations (`localhost:3000`)
- Limited to checking for new posts (Replies & Retweets are currently disabled)
- Removed DeepL Translator since [FixTweet](https://github.com/FixTweet/FixTweet) supports translations .
- 1s Delays between every Webhook

## Usage

1. Clone this repository:
   ```bash
   git clone https://github.com/ivAkii/Twitter2Discord.git
   ```
2. Copy `settings.example.json` and rename it to `settings.json`:
   ```bash
   cp settings.example.json settings.json
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the script:
   ```bash
   npm start
   ```

> **Note:**  
> This script requires Node.js version 18 or higher.

## Settings

The `settings.json` file allows you to configure the following:

```json
{
  "settings": {
    "interval_minutes": "5",
    "seconds_between_feeds": "30",
    "webhook": "https://discord.com/api/webhooks/your-webhook-url",
    "customMessage": "New Post Alert!"
  },
  "feeds": [
    {
      "username": "netizenakii",
      "webhook": "", // Not implemented yet
      "translate": false
    }
  ]
}
```

### Global Settings

- **`interval_minutes`**: Time interval (in minutes) to check the feeds. Default is 5 minutes.
- **`seconds_between_feeds`**: Delay (in seconds) between checking each feed, to prevent rate limiting. Default is 30 seconds.
- **`webhook`**: The Discord webhook URL used for posting.
- **`customMessage`**: A custom message to send alongside the post link.

### Feed Settings

The `feeds` array allows you to define multiple feeds, each with its own settings:

- **`username`**: The X (Twitter) username to fetch posts from.
- **`webhook`**: A custom Discord webhook URL for this specific feed (feature coming soon).
- **`translate`**: Set to `true` to translate posts to English.

You can manage and add more feeds directly from the web panel.
