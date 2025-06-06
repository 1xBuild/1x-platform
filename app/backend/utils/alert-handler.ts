import { config } from '../config';

const DISCORD_WEBHOOK_URL = config.app.discordWebhookUrl;
const SLACK_WEBHOOK_URL = config.app.slackWebhookUrl;

export async function sendDiscordAlert(message: string) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('No Discord webhook URL provided');
    return;
  }
  try {
    const railwayUrl = 'https://railway.app/';
    const embed = {
      title: '🚨 Application Error Alert! 🚨',
      description:
        '```' +
        (typeof message === 'string'
          ? message
          : JSON.stringify(message, null, 2)) +
        '```',
      color: 0xff0000, // Red
      fields: [
        {
          name: '🔎 View full logs on Railway',
          value: `[Click here to view logs](${railwayUrl})`,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    console.log('Discord alert sent successfully');
  } catch (err) {
    console.error('Failed to send Discord alert:', err);
  }
}

export async function sendSlackAlert(message: string) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('No Slack webhook URL provided');
    return;
  }
  try {
    console.log('Sending Slack alert...');
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    console.log('Slack alert sent successfully');
  } catch (err) {
    console.error('Failed to send Slack alert:', err);
  }
}

export async function sendAlertToAdmins(message: string) {
  // Discord will use embed, Slack will use styled text
  const railwayUrl = 'https://railway.app/';
  const slackLink = `<${railwayUrl}|View full logs on Railway>`;

  const styledMessageSlack = [
    ':rotating_light: *Application Error Alert!* :rotating_light:',
    '```',
    typeof message === 'string' ? message : JSON.stringify(message, null, 2),
    '```',
    '',
    `:mag: ${slackLink}`,
  ].join('\n');

  await sendDiscordAlert(message);
  await sendSlackAlert(styledMessageSlack);
}
