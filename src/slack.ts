import { WebClient } from '@slack/web-api';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

async function main() {
  const slack = new WebClient('***');

  const message = await slack.chat.postMessage({
    channel: '#슬랙-봇-테스트',
    text: `${dayjs()
      .add(9, 'hour')
      .format('YYYY-MM-DD HH:mm:ss')} 테스트를 시작합니다.`,
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
