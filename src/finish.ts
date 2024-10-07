import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import isFailed from './isFailed.json';

dotenv.config();

async function main() {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

  const sungyoon = `U07NR02CHJR`;
  const jongyoon = `U07P33U2UN8`;

  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID || '',
    text: `테스트 완료했다빼미! ${
      isFailed
        ? `실패 케이스가 있으니 <@${sungyoon}>, <@${jongyoon}>님 확인해달라빼미.`
        : ''
    }`,
  });
}

main();
