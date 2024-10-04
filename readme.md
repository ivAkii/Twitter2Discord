# Twitter2Discord a fork of Twitter to Discord Webhook

```Changelogs
- Added webpanel for easier configurations (localhost:3000)
- Only check for new posts (Reply & RT are disabled for now)
- Removed DeepTL and replaced with Fxtwitter's Translation
```
This script posts Twitter feeds to a Discord webhook via a Nitter RSS feed. Notably, this script supports translation of the tweets using DeepL and replaces the tweet links with [fxtwitter/FixTweet](https://github.com/FixTweet/FixTweet) for better Discord embeds. Note that Nitter RSS is not supported by every instance of Nitter - you can view a list of supported instances [here](https://status.d420.de/).


## Usage

- Clone this repo
- Create a `settings.json` with your settings. You can simply copy the example file and rename it.
- Install dependencies: `npm install`
- Run the script: `npm start`

> [!IMPORTANT]
> This script only works on Node versions 18 and above.

## Settings

The `settings.json` file contains the following configuration:

```json
{
  "settings": {
    "interval_minutes": "5",
    "seconds_between_feeds": "30",
    "webhook": "https://discord.com/api/webhooks/1290289888003887114/5TurxR31AslVTpkja-8mQhw6TZEFI_2FrlQ4ZtTfsdWr5zyTTfj8tn1HMBlAoKmG-SlK",
    "customMessage": "New Post Alert!"
  },
  "feeds": [
    {
      "username": "netizenakii",
      "webhook": "",
      "translate": false
    }
  ]
}
```

### Settings

- `interval_minutes` - How often to check feeds, in minutes. Default is 5.
- `seconds_between_feeds` - How long to wait between checking each feed, in seconds. Default is 15. This is to prevent rate limiting.

### Feeds

The `feeds` array contains objects with the following properties:

- `username` - The username of X(Twitter) account you want to check.
- `webhook` - The Discord webhook URL to post to (COMING SOON).
- `translate` - Translates posts into EN


Any number of feeds can be added to the array through the webpanel.
