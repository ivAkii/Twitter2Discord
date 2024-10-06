const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const settingsPath = path.join(__dirname, 'json/settings.json');
const followedAccountsPath = path.join(__dirname, 'json/followedAccounts.json');

const userDataPath = path.join(__dirname, 'json/userData.json');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
	secret: 'your-secret-key',
	resave: false,
	saveUninitialized: true
}));

// Load user data
let userData = {};

function loadUserData() {
	if (fs.existsSync(userDataPath)) {
		userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
	} else {
		userData = {
			users: []
		};
	}
}
loadUserData();

function isAuthorized(req, res, next) {
	if (req.session.username && req.session.isAdmin) {
		return next();
	} else {
		return res.status(403).send('Access denied');
	}
}

function isUser(req, res, next) {
	if (req.session.username) {
		return next();
	} else {
		return res.status(403).send('Access denied');
	}
}
// Login Route
app.post('/login', (req, res) => {
	const {
		username,
		password
	} = req.body;
	const user = userData.users.find(user => user.username === username && user.password === password);
	const admin = userData.users.isAdmin
	if (user) {
		req.session.username = username;
		req.session.isAdmin = user.isAdmin || false;
		return res.json({
			success: true,
			isAdmin: req.session.isAdmin
		});
	} else {
		return res.json({
			success: false,
			message: 'Invalid username or password'
		});
	}
});

// Register Route
app.post('/register', (req, res) => {
	const {
		username,
		password
	} = req.body;

	// Check if the username already exists
	if (userData.users.some(user => user.username === username)) {
		return res.json({
			success: false,
			message: 'Username already exists'
		});
	}

	const newUser = {
		username,
		password,
		isAdmin: false 
	};

	userData.users.push(newUser);
	fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
	return res.json({
		success: true,
		message: 'User registered successfully'
	});
});

app.post('/logout', (req, res) => {
	req.session.destroy(err => {
		if (err) {
			return res.status(500).send('Error logging out');
		}
		res.send('Logged out successfully');
	});
});

app.get('/loadSettingData', isAuthorized, (req, res) => {
	fs.readFile(settingsPath, 'utf-8', (err, data) => {
		if (err) {
			return res.status(500).send('Error reading settings file');
		}
		const settings = JSON.parse(data).settings;
		const settingsHtml = `
        <h3>General Settings</h3>
        <label for="interval-minutes">Interval Minutes:</label>
        <input type="number" id="interval-minutes" min="1">
  
        <label for="seconds-between-feeds">Seconds Between Feeds:</label>
        <input type="number" id="seconds-between-feeds" min="1">
  
        <label for="global-webhook">Webhook URL:</label>
        <input type="text" id="global-webhook">
        
        <h3 for="custom-message">Custom Message:</h3>
        <input type="text" id="custom-message">

        <button type="button" onclick="saveSettings()">Save Settings</button>
        <h3 for="test-webhook">Webhook Test Message:</h3>
        <input type="text" id="test-webhook">
        <button type="button" onclick="testWebhook()">Test Webhook</button>
      `;

		res.json({
			values: settings, 
			html: settingsHtml
		});
	});
});

app.get('/loadAccountList', isUser, (req, res) => {
	fs.readFile(followedAccountsPath, 'utf-8', (err, data) => {
		if (err) {
			console.error('Error reading account list file:', err);
			return res.status(500).send('Error reading account list file');
		}
		try {
			const parsedData = JSON.parse(data);
			res.json(parsedData);
		} catch (parseError) {
			console.error('Error parsing JSON:', parseError);
			res.status(500).send('Error parsing account list JSON');
		}
	});
});

app.post('/updateSettings', (req, res) => {
	fs.writeFile(settingsPath, JSON.stringify(req.body, null, 2), err => {
		if (err) {
			return res.status(500).send('Error writing account list file');
		}
		res.send('Setting updated successfully');
	});
});
app.post('/updateAccountList', (req, res) => {
	fs.writeFile(followedAccountsPath, JSON.stringify(req.body, null, 2), err => {
		if (err) {
			return res.status(500).send('Error writing account list file');
		}
		res.send('Account list updated successfully');
	});
});

// Send message to webhook
async function sendMessageToWebhook(message, webhook, username, avatarUrl) {
	try {
		await axios.post(webhook, {
			content: message,
			username: username,
			avatar_url: avatarUrl,
		});
		console.log(`Sent message to ${webhook}`);
		await delay(5000);
	} catch (err) {
		console.error(err);
	}
}

// Test webhook
app.post('/test-webhook', (req, res) => {
	const {
		message,
		webhook,
		username,
		avatarUrl
	} = req.body;

	if (!webhook) {
		return res.status(400).send('Webhook URL is required');
	}

	sendMessageToWebhook(message, webhook, username || 'Test User', avatarUrl || null);

	res.send(`Test message sent to webhook: ${webhook}`);
});

app.listen(3000, () => {
	console.log('Webpanel is up and running! [localhost:3000]');
});