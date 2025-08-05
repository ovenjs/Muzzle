---
layout: page
title: Discord Bot Content Moderation
permalink: /examples/discord-bot-moderation/
---

# Discord Bot Content Moderation

## 🎯 Problem Statement

You're building a Discord bot for a community server and need to automatically moderate messages to maintain a safe and friendly environment. You want to:

- Automatically delete messages containing inappropriate content
- Warn users when their messages are removed
- Log moderation actions for server administrators
- Allow moderators to configure filtering settings
- Handle different levels of content severity appropriately

## 📋 Prerequisites

- Node.js installed on your system
- A Discord bot token from the Discord Developer Portal
- Basic knowledge of Discord.js
- Familiarity with TypeScript
- Muzzle library installed (`npm install @ovendjs/muzzle`)

## 💻 Implementation

### Complete Example

```typescript
import { Client, GatewayIntentBits, Message, TextChannel, EmbedBuilder } from 'discord.js';
import { Muzzle, MuzzleConfig, FilterResult } from '@ovendjs/muzzle';

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Configure Muzzle for Discord moderation
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      refreshInterval: 86400000, // Refresh every 24 hours
      cache: true
    },
    caseSensitive: false,
    wholeWord: true,
    parameterHandling: {
      includeParametersInResults: true,
      severityMapping: {
        defaultSeverity: 1,
        byType: {
          'profanity': 3,
          'slur': 8,
          'hate': 9
        }
      }
    }
  }
};

const muzzle = new Muzzle({ config });

// Store warnings for users
const userWarnings = new Map<string, number>();

// Moderation log channel (will be set when bot joins a server)
let moderationLogChannel: TextChannel | null = null;

// Initialize Muzzle on startup
async function initializeBot() {
  try {
    await muzzle.initialize();
    console.log('✅ Muzzle initialized successfully');
    
    // Login to Discord
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('🚀 Discord bot logged in');
  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
  }
}

// Event: Bot is ready
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user?.tag}!`);
  
  // Find or create moderation log channel
  const guild = client.guilds.cache.first();
  if (guild) {
    try {
      // Try to find existing log channel
      moderationLogChannel = guild.channels.cache.find(
        channel => channel.name === 'moderation-log' && channel.isTextBased()
      ) as TextChannel;
      
      if (!moderationLogChannel) {
        // Create log channel if it doesn't exist
        moderationLogChannel = await guild.channels.create({
          name: 'moderation-log',
          type: 0, // Text channel
          topic: 'Automated moderation logs',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: ['ViewChannel']
            },
            {
              id: guild.members.me?.id || '',
              allow: ['ViewChannel', 'SendMessages']
            }
          ]
        });
        console.log('📝 Created moderation log channel');
      }
      
      // Send startup message
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Bot Started')
        .setDescription('Content moderation bot is now active')
        .setTimestamp();
      
      await moderationLogChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Failed to set up moderation log channel:', error);
    }
  }
});

// Event: Message received
client.on('messageCreate', async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Ignore DMs
  if (!message.guild) return;
  
  // Check if user has moderation bypass permission
  const member = message.guild.members.cache.get(message.author.id);
  if (member && member.permissions.has('ManageMessages')) return;
  
  try {
    // Filter the message content
    const result = await muzzle.filterText(message.content);
    
    if (result.matched) {
      // Handle inappropriate content
      await handleInappropriateContent(message, result);
    }
  } catch (error) {
    console.error('🚨 Error filtering message:', error);
    
    // Send error message to moderation log
    if (moderationLogChannel) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Filtering Error')
        .setDescription(`Error filtering message from ${message.author.tag}`)
        .addFields(
          { name: 'Message ID', value: message.id },
          { name: 'Error', value: error instanceof Error ? error.message : 'Unknown error' }
        )
        .setTimestamp();
      
      await moderationLogChannel.send({ embeds: [errorEmbed] });
    }
  }
});

// Handle inappropriate content
async function handleInappropriateContent(message: Message, result: FilterResult) {
  try {
    // Delete the inappropriate message
    await message.delete();
    
    // Calculate severity
    const severity = result.matches.reduce((max, match) => {
      const matchSeverity = match.parameters?.severity || 1;
      return Math.max(max, matchSeverity);
    }, 1);
    
    // Increment user warnings
    const userId = message.author.id;
    const currentWarnings = userWarnings.get(userId) || 0;
    userWarnings.set(userId, currentWarnings + 1);
    
    // Send warning to user
    const warningEmbed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('⚠️ Content Warning')
      .setDescription('Your message was removed for containing inappropriate content')
      .addFields(
        { name: 'Reason', value: `Detected: ${result.matches.map(m => m.word).join(', ')}` },
        { name: 'Severity', value: getSeverityLevel(severity) },
        { name: 'Warnings', value: `${currentWarnings + 1}/5` }
      )
      .setFooter({ text: 'Repeated violations may result in a ban' })
      .setTimestamp();
    
    try {
      await message.author.send({ embeds: [warningEmbed] });
    } catch (error) {
      // User might have DMs disabled
      console.log(`⚠️ Could not send DM to ${message.author.tag} (DMs disabled)`);
    }
    
    // Log to moderation channel
    if (moderationLogChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🚫 Message Removed')
        .setDescription('Inappropriate content detected and removed')
        .addFields(
          { name: 'User', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Channel', value: `${message.channel}` },
          { name: 'Content', value: message.content.substring(0, 1024) + (message.content.length > 1024 ? '...' : '') },
          { name: 'Detected Words', value: result.matches.map(m => m.word).join(', ') },
          { name: 'Severity', value: getSeverityLevel(severity) },
          { name: 'User Warnings', value: `${currentWarnings + 1}/5` }
        )
        .setTimestamp();
      
      await moderationLogChannel.send({ embeds: [logEmbed] });
    }
    
    // Take action based on warning count and severity
    if (currentWarnings + 1 >= 5 || severity >= 9) {
      // Ban user for severe violations or too many warnings
      try {
        await message.guild?.members.ban(message.author, {
          reason: `Repeated violations of content policy (${currentWarnings + 1} warnings, severity ${severity})`
        });
        
        if (moderationLogChannel) {
          const banEmbed = new EmbedBuilder()
            .setColor(0x8b0000)
            .setTitle('🔨 User Banned')
            .setDescription('User has been banned for repeated violations')
            .addFields(
              { name: 'User', value: `${message.author.tag} (${message.author.id})` },
              { name: 'Reason', value: `Repeated violations (${currentWarnings + 1} warnings, severity ${severity})` }
            )
            .setTimestamp();
          
          await moderationLogChannel.send({ embeds: [banEmbed] });
        }
        
        // Reset warnings
        userWarnings.delete(userId);
      } catch (error) {
        console.error('🚨 Error banning user:', error);
      }
    } else if (currentWarnings + 1 >= 3) {
      // Timeout user for moderate violations
      try {
        await message.member?.timeout(24 * 60 * 60 * 1000, 'Multiple content violations'); // 24 hours
      
        if (moderationLogChannel) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor(0xff6600)
            .setTitle('⏱️ User Timed Out')
            .setDescription('User has been timed out for multiple violations')
            .addFields(
              { name: 'User', value: `${message.author.tag} (${message.author.id})` },
              { name: 'Duration', value: '24 hours' },
              { name: 'Reason', value: `Multiple violations (${currentWarnings + 1} warnings)` }
            )
            .setTimestamp();
          
          await moderationLogChannel.send({ embeds: [timeoutEmbed] });
        }
      } catch (error) {
        console.error('🚨 Error timing out user:', error);
      }
    }
  } catch (error) {
    console.error('🚨 Error handling inappropriate content:', error);
  }
}

// Get severity level description
function getSeverityLevel(severity: number): string {
  if (severity <= 2) return 'Low';
  if (severity <= 5) return 'Medium';
  if (severity <= 7) return 'High';
  return 'Critical';
}

// Command: !warnings (view user warnings)
client.on('messageCreate', async (message: Message) => {
  if (message.content.startsWith('!warnings')) {
    // Check if user has permission to view warnings
    const member = message.guild?.members.cache.get(message.author.id);
    if (!member || !member.permissions.has('ManageMessages')) return;
    
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      message.reply('Please mention a user to check their warnings.');
      return;
    }
    
    const warnings = userWarnings.get(mentionedUser.id) || 0;
    
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('User Warnings')
      .setDescription(`Warning count for ${mentionedUser.tag}`)
      .addFields(
        { name: 'Warnings', value: `${warnings}/5` },
        { name: 'User ID', value: mentionedUser.id }
      )
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }
});

// Command: !resetwarnings (reset user warnings)
client.on('messageCreate', async (message: Message) => {
  if (message.content.startsWith('!resetwarnings')) {
    // Check if user has permission to reset warnings
    const member = message.guild?.members.cache.get(message.author.id);
    if (!member || !member.permissions.has('ManageMessages')) return;
    
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      message.reply('Please mention a user to reset their warnings.');
      return;
    }
    
    userWarnings.delete(mentionedUser.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('Warnings Reset')
      .setDescription(`Warnings have been reset for ${mentionedUser.tag}`)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    // Log to moderation channel
    if (moderationLogChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Warnings Reset')
        .setDescription(`Warnings have been reset by ${message.author.tag}`)
        .addFields(
          { name: 'User', value: `${mentionedUser.tag} (${mentionedUser.id})` },
          { name: 'Reset By', value: `${message.author.tag} (${message.author.id})` }
        )
        .setTimestamp();
      
      await moderationLogChannel.send({ embeds: [logEmbed] });
    }
  }
});

// Command: !muzzlestatus (check bot status)
client.on('messageCreate', async (message: Message) => {
  if (message.content === '!muzzlestatus') {
    // Check if user has permission to view status
    const member = message.guild?.members.cache.get(message.author.id);
    if (!member || !member.permissions.has('ManageMessages')) return;
    
    try {
      const status = await muzzle.getStatus();
      
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Muzzle Status')
        .addFields(
          { name: 'Status', value: status.initialized ? '✅ Initialized' : '❌ Not Initialized' },
          { name: 'Word List Size', value: status.wordListSize?.toString() || 'Unknown' },
          { name: 'Last Updated', value: status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : 'Never' },
          { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB` },
          { name: 'Uptime', value: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m` }
        )
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('🚨 Error getting status:', error);
      message.reply('❌ Error getting status');
    }
  }
});

// Initialize the bot
initializeBot();
```

## 🔍 Explanation

### 1. Configuration Setup

We start by configuring Muzzle with a URL-based word list and parameter handling:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      refreshInterval: 86400000, // Refresh every 24 hours
      cache: true
    },
    caseSensitive: false,
    wholeWord: true,
    parameterHandling: {
      includeParametersInResults: true,
      severityMapping: {
        defaultSeverity: 1,
        byType: {
          'profanity': 3,
          'slur': 8,
          'hate': 9
        }
      }
    }
  }
};
```

This configuration:
- Uses a remote word list from GitHub
- Enables caching for better performance
- Sets case-insensitive matching
- Enables whole-word matching
- Configures severity mapping for different types of inappropriate content

### 2. Discord Bot Initialization

The bot is initialized with necessary intents to read messages and manage the server:

```typescript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});
```

### 3. Message Filtering

When a message is received, it's filtered through Muzzle:

```typescript
client.on('messageCreate', async (message: Message) => {
  // Ignore bot messages and DMs
  if (message.author.bot) return;
  if (!message.guild) return;
  
  // Check if user has moderation bypass permission
  const member = message.guild.members.cache.get(message.author.id);
  if (member && member.permissions.has('ManageMessages')) return;
  
  // Filter the message content
  const result = await muzzle.filterText(message.content);
  
  if (result.matched) {
    // Handle inappropriate content
    await handleInappropriateContent(message, result);
  }
});
```

### 4. Content Moderation

The `handleInappropriateContent` function manages violations based on severity and warning count:

```typescript
async function handleInappropriateContent(message: Message, result: FilterResult) {
  // Delete the inappropriate message
  await message.delete();
  
  // Calculate severity
  const severity = result.matches.reduce((max, match) => {
    const matchSeverity = match.parameters?.severity || 1;
    return Math.max(max, matchSeverity);
  }, 1);
  
  // Increment user warnings
  const userId = message.author.id;
  const currentWarnings = userWarnings.get(userId) || 0;
  userWarnings.set(userId, currentWarnings + 1);
  
  // Send warning to user
  const warningEmbed = new EmbedBuilder()
    .setColor(0xff9900)
    .setTitle('⚠️ Content Warning')
    .setDescription('Your message was removed for containing inappropriate content')
    .addFields(
      { name: 'Reason', value: `Detected: ${result.matches.map(m => m.word).join(', ')}` },
      { name: 'Severity', value: getSeverityLevel(severity) },
      { name: 'Warnings', value: `${currentWarnings + 1}/5` }
    )
    .setFooter({ text: 'Repeated violations may result in a ban' })
    .setTimestamp();
  
  try {
    await message.author.send({ embeds: [warningEmbed] });
  } catch (error) {
    // User might have DMs disabled
    console.log(`⚠️ Could not send DM to ${message.author.tag} (DMs disabled)`);
  }
  
  // Take action based on warning count and severity
  if (currentWarnings + 1 >= 5 || severity >= 9) {
    // Ban user for severe violations or too many warnings
    await message.guild?.members.ban(message.author, {
      reason: `Repeated violations of content policy (${currentWarnings + 1} warnings, severity ${severity})`
    });
    userWarnings.delete(userId);
  } else if (currentWarnings + 1 >= 3) {
    // Timeout user for moderate violations
    await message.member?.timeout(24 * 60 * 60 * 1000, 'Multiple content violations'); // 24 hours
  }
}
```

### 5. Moderation Commands

The bot includes several commands for moderators:

- `!warnings @user` - View a user's warning count
- `!resetwarnings @user` - Reset a user's warnings
- `!muzzlestatus` - Check the bot's status

## 🔄 Variations

### 1. Custom Word List

To use a custom word list instead of the default one:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse,hate,violence,inappropriate'
    }
  }
};
```

### 2. Server-Specific Configuration

To allow different servers to have their own word lists:

```typescript
const serverConfigs = new Map<string, MuzzleConfig>();

// Load server-specific configurations
client.on('guildCreate', async (guild) => {
  // Load or create configuration for this server
  const config = await loadServerConfig(guild.id);
  serverConfigs.set(guild.id, config);
});

// Use server-specific configuration when filtering
client.on('messageCreate', async (message) => {
  if (!message.guild) return;
  
  const config = serverConfigs.get(message.guild.id);
  if (!config) return;
  
  const muzzle = new Muzzle({ config });
  const result = await muzzle.filterText(message.content);
  
  if (result.matched) {
    await handleInappropriateContent(message, result);
  }
});
```

### 3. Database Integration

To persist warnings across bot restarts:

```typescript
import { Database } from 'sqlite3';

const db = new Database('./moderation.db');

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS warnings (
      user_id TEXT PRIMARY KEY,
      warning_count INTEGER DEFAULT 0,
      last_warning DATETIME
    )
  `);
});

// Get user warnings from database
async function getUserWarnings(userId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT warning_count FROM warnings WHERE user_id = ?',
      [userId],
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.warning_count || 0);
      }
    );
  });
}

// Update user warnings in database
async function updateUserWarnings(userId: string, count: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO warnings (user_id, warning_count, last_warning) VALUES (?, ?, ?)',
      [userId, count, new Date().toISOString()],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
```

## 🚀 Best Practices

1. **Use Intents Wisely**: Only request the intents your bot actually needs to minimize resource usage.

2. **Handle Errors Gracefully**: Always implement proper error handling to ensure your bot remains stable.

3. **Respect Permissions**: Check user permissions before taking moderation actions.

4. **Log Everything**: Maintain detailed logs of all moderation actions for transparency and accountability.

5. **Provide Clear Feedback**: Give users clear explanations when their content is moderated.

6. **Scale Gradually**: Start with basic filtering and add more sophisticated features as needed.

## 🧪 Testing the Implementation

1. Create a `.env` file with your Discord bot token:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   ```

2. Start the bot:
   ```bash
   ts-node your-bot-file.ts
   ```

3. Test with appropriate content:
   - Send a clean message in your server
   - Send a message with inappropriate content
   - Check if the message is deleted and a warning is sent

4. Test moderator commands:
   - `!warnings @user` - Check warning count
   - `!resetwarnings @user` - Reset warnings
   - `!muzzlestatus` - Check bot status

5. Verify moderation logs:
   - Check the moderation-log channel for automated logs
   - Ensure all actions are properly documented

This implementation provides a robust, production-ready Discord bot for content moderation that can be easily integrated into any Discord server.