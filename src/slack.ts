import { WebClient } from '@slack/web-api';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

  let currentTimeInKST = dayjs();

  // CI에서 돌 때는 한국시간 9시간 더해줌
  if (process.env.CI === 'true') {
    currentTimeInKST = currentTimeInKST.add(9, 'hour');
  }

  const message = await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID || '',
    text: `${currentTimeInKST.format('YYYY-MM-DD HH:mm:ss')} 테스트`,
  });

  fs.writeFileSync(
    path.join(__dirname, 'message.json'),
    JSON.stringify({
      ts: message.ts,
      channel: message.channel,
    })
  );

  // 실패 케이스 계산을 위한 json 파일 초기화
  fs.writeFileSync(path.join(__dirname, 'isFailed.json'), 'false');
}

main();
