import { WebClient } from '@slack/web-api';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

  const message = await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID || '',
    // 한국시간 9시간 더해줌
    text: `${dayjs().add(9, 'hour').format('YYYY-MM-DD HH:mm:ss')} 테스트`,
  });

  console.log(message);

  fs.writeFileSync(
    path.join(__dirname, 'message.json'),
    JSON.stringify({
      ts: message.ts,
      channel: message.channel,
    })
  );
}

main();
