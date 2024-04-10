import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import message from './message.json';

dotenv.config();

async function main() {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID || '',
    thread_ts: message.ts,
    text: '테스트 끝!',
  });
}

main();
