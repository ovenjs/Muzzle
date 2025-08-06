---
layout: page
title: Discord Bot Moderation
permalink: /examples/discord-bot-moderation/
---

# Discord Bot Moderation Example

This example demonstrates how to create a Discord bot that automatically moderates messages using Muzzle to filter inappropriate content in real-time.

## 🎯 Problem Statement

We want to build a Discord bot that can:
- Scan messages in channels for inappropriate content
- Automatically delete messages that violate content policies
- Send warnings to users who violate policies
- Keep track of violations for potential further action
- Allow moderators to configure filtering settings

## 📋 Prerequisites

- Node.js installed on your system
- A Discord account and a server where you have administrator permissions
- Basic knowledge of JavaScript/TypeScript
- Familiarity with Discord.js library
- A code editor of your choice

## 🚀 Implementation

### 1. Project Setup

First, let's set up a new project:

```bash
# Create a new project directory
mkdir discord-muzzle-bot
cd discord-muzzle-bot

# Initialize npm project
npm init -y

# Install dependencies
npm install discord.js @ovendjs/muzzle dotenv sqlite3

# Install TypeScript dependencies (optional)
npm install -D typescript @types/node @types/discord.js ts-node

# Create a .env file for configuration
touch .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your Discord bot token and other settings:

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_server_id_here
MODERATOR_ROLE_ID=your_moderator_role_id_here
LOG_CHANNEL_ID=channel_id_for_moderation_logs
DATABASE_PATH=./data/moderation.db
```

### 3. Create the Bot Structure

Create the following directory structure:

```
discord-muzzle-bot/
├── src/
│   ├── commands/
│   │   ├── config.js
│   │   └── help.js
│   ├── events/
│   │   ├── guildCreate.js
│   │   ├── interactionCreate.js
│   │   ├── messageCreate.js
│   │   └── ready.js
│   ├── database/
│   │   └── database.js
│   ├── utils/
│   │   └── logger.js
│   ├── index.js
│   └── muzzle.js
├── .env
├── package.json
└── tsconfig.json (if using TypeScript)
```

### 4. Set Up the Database

Create `src/database/database.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.db = null;
        
        // Ensure the directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        const queries = [
            // Guild settings table
            `CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id TEXT PRIMARY KEY,
                log_channel_id TEXT,
                moderator_role_id TEXT,
                warning_threshold INTEGER DEFAULT 3,
                mute_duration INTEGER DEFAULT 300000,
                filter_enabled INTEGER DEFAULT 1,
                custom_banned_words TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            // User violations table
            `CREATE TABLE IF NOT EXISTS user_violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                user_id TEXT,
                username TEXT,
                violation_type TEXT,
                message_id TEXT,
                channel_id TEXT,
                content TEXT,
                severity INTEGER,
                action_taken TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            // Warning levels table
            `CREATE TABLE IF NOT EXISTS user_warnings (
                guild_id TEXT,
                user_id TEXT,
                warning_count INTEGER DEFAULT 0,
                last_warning_at INTEGER DEFAULT 0,
                PRIMARY KEY (guild_id, user_id)
            )`
        ];

        for (const query of queries) {
            await this.run(query);
        }
    }

    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    }
}

module.exports = Database;
```

### 5. Configure Muzzle

Create `src/muzzle.js`:

```javascript
const { Muzzle } = require('@ovendjs/muzzle');

class MuzzleFilter {
    constructor() {
        this.muzzle = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            this.muzzle = new Muzzle({
                config: {
                    textFiltering: {
                        bannedWordsSource: {
                            type: 'string',
                            string: 'badword,profanity,swear,curse,hate,violence,stupid,idiot,dumb,kill,death,racist,sexist,homophobic,slur'
                        },
                        caseSensitive: false,
                        wholeWord: true,
                        preprocessText: true,
                        parameterHandling: {
                            includeParametersInResults: true,
                            severityMapping: {
                                defaultSeverity: 1,
                                byType: {
                                    'profanity': 3,
                                    'hate': 8,
                                    'violence': 7,
                                    'insult': 5,
                                    'slur': 10
                                }
                            }
                        }
                    }
                }
            });

            await this.muzzle.initialize();
            this.initialized = true;
            console.log('Muzzle filter initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Muzzle filter:', error);
            throw error;
        }
    }

    async filterText(text, customWords = '') {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Add custom words to the filter if provided
            if (customWords) {
                const words = customWords.split(',').map(w => w.trim()).filter(w => w);
                // In a real implementation, you would update the config
                // For this example, we'll just use the base filter
            }

            const result = await this.muzzle.filterText(text);
            return result;
        } catch (error) {
            console.error('Error filtering text:', error);
            throw error;
        }
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = new MuzzleFilter();
```

### 6. Create Logger Utility

Create `src/utils/logger.js`:

```javascript
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };

        // Log to console
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');

        // Log to file
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }

    info(message, data = null) {
        this.log('info', message, data);
    }

    warn(message, data = null) {
        this.log('warn', message, data);
    }

    error(message, data = null) {
        this.log('error', message, data);
    }

    debug(message, data = null) {
        this.log('debug', message, data);
    }
}

module.exports = new Logger();
```

### 7. Create Event Handlers

#### Ready Event

Create `src/events/ready.js`:

```javascript
const logger = require('../utils/logger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);
        logger.info(`Bot is in ${client.guilds.cache.size} guilds`);
        
        // Set bot activity
        client.user.setActivity('for inappropriate content', { type: 'WATCHING' });
    }
};
```

#### Message Create Event

Create `src/events/messageCreate.js`:

```javascript
const muzzle = require('../muzzle');
const Database = require('../database/database');
const logger = require('../utils/logger');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Ignore DMs
        if (!message.guild) return;
        
        try {
            // Get guild settings from database
            const db = new Database(process.env.DATABASE_PATH);
            await db.connect();
            
            const settings = await db.get(
                'SELECT * FROM guild_settings WHERE guild_id = ?',
                [message.guild.id]
            );
            
            // If filtering is disabled or no settings exist, ignore
            if (!settings || !settings.filter_enabled) {
                await db.close();
                return;
            }
            
            // Check if user is a moderator
            const member = await message.guild.members.fetch(message.author.id);
            if (member.roles.cache.has(settings.moderator_role_id)) {
                await db.close();
                return;
            }
            
            // Filter the message content
            const result = await muzzle.filterText(message.content, settings.custom_banned_words || '');
            
            if (result.matched) {
                logger.info(`Inappropriate content detected from ${message.author.tag} in ${message.guild.name}`, {
                    userId: message.author.id,
                    guildId: message.guild.id,
                    content: message.content,
                    matches: result.matches
                });
                
                // Get the highest severity match
                const maxSeverity = Math.max(...result.matches.map(m => m.parameters?.severity || 1));
                
                // Log the violation
                await db.run(
                    `INSERT INTO user_violations 
                    (guild_id, user_id, username, violation_type, message_id, channel_id, content, severity, action_taken) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        message.guild.id,
                        message.author.id,
                        message.author.tag,
                        'inappropriate_content',
                        message.id,
                        message.channel.id,
                        message.content,
                        maxSeverity,
                        'message_deleted'
                    ]
                );
                
                // Delete the message
                await message.delete();
                
                // Get user's warning count
                let warningData = await db.get(
                    'SELECT * FROM user_warnings WHERE guild_id = ? AND user_id = ?',
                    [message.guild.id, message.author.id]
                );
                
                if (!warningData) {
                    await db.run(
                        'INSERT INTO user_warnings (guild_id, user_id, warning_count, last_warning_at) VALUES (?, ?, 1, ?)',
                        [message.guild.id, message.author.id, Date.now()]
                    );
                    warningData = { warning_count: 1 };
                } else {
                    await db.run(
                        'UPDATE user_warnings SET warning_count = warning_count + 1, last_warning_at = ? WHERE guild_id = ? AND user_id = ?',
                        [Date.now(), message.guild.id, message.author.id]
                    );
                    warningData.warning_count += 1;
                }
                
                // Send warning to user
                const warningMessage = `Your message in ${message.guild.name} was deleted for containing inappropriate content. This is warning #${warningData.warning_count}.`;
                
                try {
                    await message.author.send(warningMessage);
                } catch (err) {
                    logger.warn(`Could not send DM to user ${message.author.tag}`, err);
                }
                
                // Log to moderation channel if configured
                if (settings.log_channel_id) {
                    const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
                    if (logChannel && logChannel.isTextBased()) {
                        const embed = {
                            color: 0xFF0000,
                            title: 'Message Deleted - Inappropriate Content',
                            author: {
                                name: message.author.tag,
                                icon_url: message.author.displayAvatarURL()
                            },
                            description: `A message from ${message.author} in ${message.channel} was deleted for containing inappropriate content.`,
                            fields: [
                                {
                                    name: 'Original Message',
                                    value: message.content.substring(0, 1024)
                                },
                                {
                                    name: 'Detected Words',
                                    value: result.matches.map(m => m.word).join(', ')
                                },
                                {
                                    name: 'Severity',
                                    value: maxSeverity.toString()
                                },
                                {
                                    name: 'Warning Count',
                                    value: warningData.warning_count.toString()
                                }
                            ],
                            timestamp: new Date(),
                            footer: {
                                text: `User ID: ${message.author.id}`
                            }
                        };
                        
                        await logChannel.send({ embeds: [embed] });
                    }
                }
                
                // Apply punishment if threshold is reached
                if (warningData.warning_count >= settings.warning_threshold) {
                    try {
                        // Reset warning count
                        await db.run(
                            'UPDATE user_warnings SET warning_count = 0 WHERE guild_id = ? AND user_id = ?',
                            [message.guild.id, message.author.id]
                        );
                        
                        // Mute the user
                        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
                        if (muteRole) {
                            await member.roles.add(muteRole);
                            
                            // Schedule unmute
                            setTimeout(async () => {
                                try {
                                    const memberToUnmute = await message.guild.members.fetch(message.author.id).catch(() => null);
                                    if (memberToUnmute && memberToUnmute.roles.cache.has(muteRole.id)) {
                                        await memberToUnmute.roles.remove(muteRole);
                                        
                                        // Log unmute
                                        if (settings.log_channel_id) {
                                            const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
                                            if (logChannel && logChannel.isTextBased()) {
                                                const embed = {
                                                    color: 0x00FF00,
                                                    title: 'User Unmuted',
                                                    description: `${message.author.tag} has been unmuted.`,
                                                    timestamp: new Date()
                                                };
                                                
                                                await logChannel.send({ embeds: [embed] });
                                            }
                                        }
                                    }
                                } catch (err) {
                                    logger.error(`Failed to unmute user ${message.author.tag}`, err);
                                }
                            }, settings.mute_duration || 300000); // Default 5 minutes
                            
                            // Log mute
                            if (settings.log_channel_id) {
                                const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
                                if (logChannel && logChannel.isTextBased()) {
                                    const embed = {
                                        color: 0xFFA500,
                                        title: 'User Muted',
                                        description: `${message.author.tag} has been muted for reaching the warning threshold.`,
                                        fields: [
                                            {
                                                name: 'Duration',
                                                value: `${(settings.mute_duration || 300000) / 60000} minutes`
                                            },
                                            {
                                                name: 'Reason',
                                                value: 'Reached warning threshold for inappropriate content'
                                            }
                                        ],
                                        timestamp: new Date()
                                    };
                                    
                                    await logChannel.send({ embeds: [embed] });
                                }
                            }
                        }
                    } catch (err) {
                        logger.error(`Failed to mute user ${message.author.tag}`, err);
                    }
                }
            }
            
            await db.close();
        } catch (error) {
            logger.error('Error in messageCreate event:', error);
        }
    }
};
```

#### Interaction Create Event

Create `src/events/interactionCreate.js`:

```javascript
const logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            logger.warn(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Error executing ${interaction.commandName} command:`, error);
            
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }
};
```

#### Guild Create Event

Create `src/events/guildCreate.js`:

```javascript
const Database = require('../database/database');
const logger = require('../utils/logger');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        logger.info(`Joined new guild: ${guild.name} (${guild.id})`);
        
        try {
            const db = new Database(process.env.DATABASE_PATH);
            await db.connect();
            
            // Check if settings already exist for this guild
            const settings = await db.get(
                'SELECT * FROM guild_settings WHERE guild_id = ?',
                [guild.id]
            );
            
            if (!settings) {
                // Create default settings for the guild
                await db.run(
                    `INSERT INTO guild_settings 
                    (guild_id, log_channel_id, moderator_role_id, warning_threshold, mute_duration, filter_enabled) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [guild.id, null, null, 3, 300000, 1]
                );
                
                logger.info(`Created default settings for guild ${guild.name}`);
            }
            
            await db.close();
            
            // Try to send a welcome message to the system channel
            if (guild.systemChannel) {
                try {
                    const embed = {
                        color: 0x00AE86,
                        title: 'Thanks for adding Muzzle Moderation Bot!',
                        description: 'This bot helps moderate your server by filtering inappropriate content.',
                        fields: [
                            {
                                name: 'Getting Started',
                                value: 'Use `/config` to set up the bot for your server. You\'ll need to specify a moderator role and optionally a log channel.'
                            },
                            {
                                name: 'Commands',
                                value: '`/config` - Configure bot settings\n`/help` - Show help information'
                            },
                            {
                                name: 'Need Help?',
                                value: 'Join our support server for assistance: [Support Server](https://discord.gg/your-support-server)'
                            }
                        ],
                        timestamp: new Date(),
                        footer: {
                            text: 'Muzzle Moderation Bot'
                        }
                    };
                    
                    await guild.systemChannel.send({ embeds: [embed] });
                } catch (err) {
                    logger.warn(`Could not send welcome message to ${guild.name}`, err);
                }
            }
        } catch (error) {
            logger.error(`Error in guildCreate event for ${guild.name}:`, error);
        }
    }
};
```

### 8. Create Slash Commands

#### Config Command

Create `src/commands/config.js`:

```javascript
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('../database/database');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings')
        .addChannelOption(option =>
            option.setName('log_channel')
                .setDescription('The channel where moderation logs will be sent')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('moderator_role')
                .setDescription('The role that can bypass moderation')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('warning_threshold')
                .setDescription('Number of warnings before a user is muted')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10))
        .addIntegerOption(option =>
            option.setName('mute_duration')
                .setDescription('Duration of mute in minutes')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(1440))
        .addStringOption(option =>
            option.setName('custom_banned_words')
                .setDescription('Comma-separated list of additional banned words')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('filter_enabled')
                .setDescription('Whether the content filter is enabled')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const db = new Database(process.env.DATABASE_PATH);
            await db.connect();
            
            // Get current settings
            let settings = await db.get(
                'SELECT * FROM guild_settings WHERE guild_id = ?',
                [interaction.guild.id]
            );
            
            if (!settings) {
                // Create default settings
                await db.run(
                    `INSERT INTO guild_settings 
                    (guild_id, log_channel_id, moderator_role_id, warning_threshold, mute_duration, filter_enabled) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [interaction.guild.id, null, null, 3, 300000, 1]
                );
                
                settings = await db.get(
                    'SELECT * FROM guild_settings WHERE guild_id = ?',
                    [interaction.guild.id]
                );
            }
            
            // Update settings based on provided options
            const updates = [];
            const params = [];
            
            if (interaction.options.getChannel('log_channel')) {
                updates.push('log_channel_id = ?');
                params.push(interaction.options.getChannel('log_channel').id);
            }
            
            if (interaction.options.getRole('moderator_role')) {
                updates.push('moderator_role_id = ?');
                params.push(interaction.options.getRole('moderator_role').id);
            }
            
            if (interaction.options.getInteger('warning_threshold') !== null) {
                updates.push('warning_threshold = ?');
                params.push(interaction.options.getInteger('warning_threshold'));
            }
            
            if (interaction.options.getInteger('mute_duration') !== null) {
                updates.push('mute_duration = ?');
                params.push(interaction.options.getInteger('mute_duration') * 60000); // Convert to milliseconds
            }
            
            if (interaction.options.getString('custom_banned_words') !== null) {
                updates.push('custom_banned_words = ?');
                params.push(interaction.options.getString('custom_banned_words'));
            }
            
            if (interaction.options.getBoolean('filter_enabled') !== null) {
                updates.push('filter_enabled = ?');
                params.push(interaction.options.getBoolean('filter_enabled') ? 1 : 0);
            }
            
            if (updates.length > 0) {
                updates.push('updated_at = ?');
                params.push(Date.now());
                params.push(interaction.guild.id);
                
                await db.run(
                    `UPDATE guild_settings SET ${updates.join(', ')} WHERE guild_id = ?`,
                    params
                );
                
                // Get updated settings
                settings = await db.get(
                    'SELECT * FROM guild_settings WHERE guild_id = ?',
                    [interaction.guild.id]
                );
            }
            
            await db.close();
            
            // Create response embed
            const embed = {
                color: 0x00AE86,
                title: 'Bot Configuration',
                description: 'Current bot settings:',
                fields: [
                    {
                        name: 'Log Channel',
                        value: settings.log_channel_id 
                            ? `<#${settings.log_channel_id}>` 
                            : 'Not set',
                        inline: true
                    },
                    {
                        name: 'Moderator Role',
                        value: settings.moderator_role_id 
                            ? `<@&${settings.moderator_role_id}>` 
                            : 'Not set',
                        inline: true
                    },
                    {
                        name: 'Warning Threshold',
                        value: settings.warning_threshold.toString(),
                        inline: true
                    },
                    {
                        name: 'Mute Duration',
                        value: `${settings.mute_duration / 60000} minutes`,
                        inline: true
                    },
                    {
                        name: 'Filter Enabled',
                        value: settings.filter_enabled ? 'Yes' : 'No',
                        inline: true
                    },
                    {
                        name: 'Custom Banned Words',
                        value: settings.custom_banned_words || 'None',
                        inline: false
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Muzzle Moderation Bot'
                }
            };
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error in config command:', error);
            
            await interaction.editReply({
                content: 'There was an error while updating the configuration.',
                ephemeral: true
            });
        }
    }
};
```

#### Help Command

Create `src/commands/help.js`:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help information'),
    
    async execute(interaction) {
        const embed = {
            color: 0x00AE86,
            title: 'Muzzle Moderation Bot - Help',
            description: 'This bot automatically moderates your server by filtering inappropriate content.',
            fields: [
                {
                    name: 'Commands',
                    value: '`/config` - Configure bot settings (Admin only)\n`/help` - Show this help message'
                },
                {
                    name: 'How It Works',
                    value: 'The bot scans all messages in your server for inappropriate content. When such content is detected, the message is automatically deleted and the user receives a warning. After a certain number of warnings, the user is automatically muted.'
                },
                {
                    name: 'Setting Up',
                    value: '1. Use `/config` to set up the bot\n2. Specify a moderator role that can bypass moderation\n3. Optionally set a log channel to see moderation actions\n4. Configure warning threshold and mute duration as needed'
                },
                {
                    name: 'Need Help?',
                    value: 'Join our support server for assistance: [Support Server](https://discord.gg/your-support-server)'
                }
            ],
            timestamp: new Date(),
            footer: {
                text: 'Muzzle Moderation Bot'
            }
        };
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
```

### 9. Create the Main Bot File

Create `src/index.js`:

```javascript
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const logger = require('./utils/logger');
const muzzle = require('./muzzle');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.info(`Loaded command: ${command.data.name}`);
    } else {
        logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    
    logger.info(`Loaded event: ${event.name}`);
}

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        logger.info('Bot logged in successfully');
        
        // Initialize Muzzle after login
        muzzle.initialize()
            .then(() => {
                logger.info('Muzzle filter initialized');
            })
            .catch(err => {
                logger.error('Failed to initialize Muzzle filter:', err);
            });
    })
    .catch(err => {
        logger.error('Failed to log in:', err);
    });

// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    
    try {
        // Destroy the Discord client
        await client.destroy();
        logger.info('Discord client destroyed');
        
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    
    try {
        // Destroy the Discord client
        await client.destroy();
        logger.info('Discord client destroyed');
        
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});
```

### 10. Add Start Script to package.json

Update your `package.json` to include a start script:

```json
{
  "name": "discord-muzzle-bot",
  "version": "1.0.0",
  "description": "A Discord bot for content moderation using Muzzle",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "@ovendjs/muzzle": "^1.0.0",
    "discord.js": "^14.0.0",
    "dotenv": "^16.0.0",
    "sqlite3": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}
```

## 🧪 Testing the Implementation

### 1. Invite the Bot to Your Server

1. Go to the Discord Developer Portal
2. Select your application
3. Go to the "OAuth2" -> "URL Generator" page
4. Select the `bot` and `applications.commands` scopes
5. Select the necessary bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Manage Messages
   - Read Message History
   - Manage Roles
   - Embed Links
6. Copy the generated URL and paste it into your browser to invite the bot to your server

### 2. Set Up the Bot

1. Create a moderator role in your server
2. Create a channel for moderation logs (optional)
3. Use the `/config` command to configure the bot:
   ```
   /config moderator_role:@Moderator log_channel:#moderation-logs
   ```

### 3. Test Content Filtering

1. Send a message with inappropriate content in any channel
2. Observe that the message is deleted
3. Check if you received a DM warning
4. Check the moderation log channel for the action

### 4. Test Warning System

1. Send multiple messages with inappropriate content to reach the warning threshold
2. Observe that you get muted after reaching the threshold
3. Check if you're automatically unmuted after the mute duration

## 💡 Explanation

### How It Works

1. **Initialization**: When the bot starts, it initializes Muzzle with a configuration that includes banned words and filtering options.

2. **Message Scanning**: For every message sent in the server, the bot:
   - Ignores messages from bots and DMs
   - Checks if the sender is a moderator (bypasses filtering)
   - Filters the message content using Muzzle
   - Takes action based on the filtering results

3. **Violation Handling**: When inappropriate content is detected:
   - The message is deleted
   - A warning is sent to the user via DM
   - The violation is logged to the database
   - If the warning threshold is reached, the user is muted

4. **Configuration**: Moderators can configure bot settings using the `/config` slash command, including:
   - Moderator role (bypasses filtering)
   - Log channel (for moderation actions)
   - Warning threshold (number of warnings before mute)
   - Mute duration (how long users are muted)
   - Custom banned words (additional words to filter)

### Key Features Demonstrated

1. **Real-time Content Filtering**: Messages are scanned and filtered as they are sent.

2. **Progressive Discipline**: Users receive warnings and are eventually muted for repeated violations.

3. **Configurable Settings**: Moderators can customize the bot's behavior to suit their server's needs.

4. **Comprehensive Logging**: All moderation actions are logged to the database and optionally to a Discord channel.

5. **Graceful Error Handling**: The bot handles errors gracefully and continues to function even if some operations fail.

## 🔧 Variations

### 1. Custom Severity Levels

You could implement custom severity levels for different types of violations:

```javascript
// In muzzle.js
const getSeverityForMatch = (match) => {
    const word = match.word.toLowerCase();
    
    // Define custom severity levels
    const severityMap = {
        'mild': 1,
        'moderate': 3,
        'severe': 5,
        'extreme': 10
    };
    
    // Check if the word matches any custom severity
    for (const [level, severity] of Object.entries(severityMap)) {
        if (customWords[level] && customWords[level].includes(word)) {
            return severity;
        }
    }
    
    // Default severity
    return match.parameters?.severity || 1;
};

// In messageCreate.js
const maxSeverity = Math.max(...result.matches.map(m => getSeverityForMatch(m)));
```

### 2. Temporary Bans

For severe violations, you could implement temporary bans instead of mutes:

```javascript
// In messageCreate.js
if (warningData.warning_count >= settings.warning_threshold) {
    try {
        // Reset warning count
        await db.run(
            'UPDATE user_warnings SET warning_count = 0 WHERE guild_id = ? AND user_id = ?',
            [message.guild.id, message.author.id]
        );
        
        // Ban the user temporarily
        await message.guild.members.ban(message.author, {
            reason: 'Reached warning threshold for inappropriate content',
            deleteMessageDays: 1
        });
        
        // Schedule unban
        setTimeout(async () => {
            try {
                await message.guild.members.unban(message.author.id);
                
                // Log unban
                if (settings.log_channel_id) {
                    const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
                    if (logChannel && logChannel.isTextBased()) {
                        const embed = {
                            color: 0x00FF00,
                            title: 'User Unbanned',
                            description: `${message.author.tag} has been unbanned.`,
                            timestamp: new Date()
                        };
                        
                        await logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (err) {
                logger.error(`Failed to unban user ${message.author.tag}`, err);
            }
        }, settings.ban_duration || 86400000); // Default 24 hours
    } catch (err) {
        logger.error(`Failed to ban user ${message.author.tag}`, err);
    }
}
```

### 3. Appeal System

You could implement an appeal system where users can appeal warnings:

```javascript
// Create a new command: src/commands/appeal.js
const { SlashCommandBuilder } = require('discord.js');
const Database = require('../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('appeal')
        .setDescription('Appeal a warning')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the appeal')
                .setRequired(true)),
    
    async execute(interaction) {
        const reason = interaction.options.getString('reason');
        
        const db = new Database(process.env.DATABASE_PATH);
        await db.connect();
        
        // Get user's warning count
        const warningData = await db.get(
            'SELECT * FROM user_warnings WHERE guild_id = ? AND user_id = ?',
            [interaction.guild.id, interaction.user.id]
        );
        
        if (!warningData || warningData.warning_count === 0) {
            await db.close();
            return interaction.reply({
                content: 'You don\'t have any warnings to appeal.',
                ephemeral: true
            });
        }
        
        // Log the appeal
        await db.run(
            `INSERT INTO appeals 
            (guild_id, user_id, username, reason, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [interaction.guild.id, interaction.user.id, interaction.user.tag, reason, 'pending', Date.now()]
        );
        
        await db.close();
        
        // Get guild settings
        const settings = await db.get(
            'SELECT * FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        // Notify moderators
        if (settings.log_channel_id) {
            const logChannel = interaction.guild.channels.cache.get(settings.log_channel_id);
            if (logChannel && logChannel.isTextBased()) {
                const embed = {
                    color: 0xFFA500,
                    title: 'New Appeal',
                    description: `${interaction.user.tag} has appealed a warning.`,
                    fields: [
                        {
                            name: 'User',
                            value: `${interaction.user.tag} (${interaction.user.id})`
                        },
                        {
                            name: 'Reason',
                            value: reason
                        },
                        {
                            name: 'Status',
                            value: 'Pending'
                        }
                    ],
                    timestamp: new Date()
                };
                
                await logChannel.send({
                    content: '@here New appeal submitted',
                    embeds: [embed]
                });
            }
        }
        
        await interaction.reply({
            content: 'Your appeal has been submitted. Moderators will review it and get back to you.',
            ephemeral: true
        });
    }
};
```

### 4. Web Dashboard

You could create a web dashboard for managing moderation actions:

```javascript
// Example Express.js server for the dashboard
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const Database = require('./database/database');

const app = express();
const db = new Database(process.env.DATABASE_PATH);

// Configure session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Configure Passport
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user is a moderator in any guild
        // This is a simplified example - in a real implementation, you would check each guild
        return done(null, profile);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
    res.send('<a href="/auth/discord">Login with Discord</a>');
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', 
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

app.get('/dashboard', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    
    try {
        await db.connect();
        
        // Get recent violations
        const violations = await db.all(
            `SELECT * FROM user_violations 
            ORDER BY created_at DESC 
            LIMIT 50`
        );
        
        await db.close();
        
        // Render dashboard with violations data
        res.send(`
            <h1>Moderation Dashboard</h1>
            <h2>Recent Violations</h2>
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Content</th>
                        <th>Severity</th>
                        <th>Action</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${violations.map(v => `
                        <tr>
                            <td>${v.username}</td>
                            <td>${v.content.substring(0, 100)}${v.content.length > 100 ? '...' : ''}</td>
                            <td>${v.severity}</td>
                            <td>${v.action_taken}</td>
                            <td>${new Date(v.created_at * 1000).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `);
    } catch (err) {
        console.error('Error loading dashboard:', err);
        res.status(500).send('Error loading dashboard');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dashboard server running on port ${PORT}`);
});
```

## 🚀 Next Steps

1. **Add More Commands**: Implement commands for managing warnings, viewing user history, and manual moderation actions.

2. **Improve the Dashboard**: Enhance the web dashboard with more features, better UI, and real-time updates.

3. **Add Machine Learning**: Integrate with machine learning services for more sophisticated content analysis.

4. **Implement Rate Limiting**: Add rate limiting to prevent abuse of the bot's commands.

5. **Add Backup System**: Implement a system to back up the database regularly.

6. **Create an API**: Create an API for integrating with other services and applications.

7. **Add Analytics**: Implement analytics to track moderation trends and effectiveness.

This example provides a comprehensive implementation of a Discord bot for content moderation using Muzzle. You can extend and customize it based on your specific requirements.