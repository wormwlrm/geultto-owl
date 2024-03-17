import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID || '',
    text: '테스트 끝',
  });
}

main();
