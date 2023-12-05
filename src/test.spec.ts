import { test, expect } from '@playwright/test';
import data from './data.json';
import { WebClient } from '@slack/web-api';
import message from './message.json';
import {
  getMinimumRequiredHeightTest,
  getSumOfCharacterCountTest,
} from './testcases.ts';
import { guessBlogType, BlogType } from './blog.ts';
import dotenv from 'dotenv';

dotenv.config();

const map = new Map();

const getScreenshotOptions = (round, koName) => {
  return {
    path: `screenshots/${round}/${koName}.jpeg`,
    fullPage: true,
    quality: 0,
  };
};

const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

test.describe('테스트 시작', () => {
  test('테스트 시작 메시지 전송', async () => {
    await slack.chat.postMessage({
      channel: message.channel,
      thread_ts: message.ts,
      text: `오늘 글 올린 사람: 총 ${data.length} 명`,
    });
  });
});

for (const line of data) {
  const { round, team, koName, dt, title, contentUrl } = line;

  if (contentUrl === '' || map.has(koName)) continue;

  map.set(koName, true);

  test(`${koName} 테스트`, async ({ page }) => {
    await page.goto(contentUrl);

    const blogType = guessBlogType(contentUrl);

    // 테스트 별 실패 여부 체크
    const testCase = {
      height: true,
      characterCount: true,
    };

    // notion.so URL은 notion.site 로 리다이렉션 해야 함
    if (
      blogType === BlogType.NOTION_SO &&
      page.getByText('아래의 링크를 따라 외부 사이트로 이동하세요.', {
        exact: true,
      })
    ) {
      await page.locator('a').first().click();
      await page.waitForFunction(() => {
        return document.querySelector('#notion-app main');
      });
    }

    // 높이 테스트
    const { htmlHeight, codeHeight, MINIMUM_REQUIRED_HEIGHT } =
      await getMinimumRequiredHeightTest({
        page,
      });

    const realHeight = htmlHeight - codeHeight;

    if (realHeight < MINIMUM_REQUIRED_HEIGHT) {
      testCase.height = false;
    }

    // 글자수 테스트
    const { totalCharacterCount, MINIMUM_REQUIRED_CHARACTER_COUNT } =
      await getSumOfCharacterCountTest({ page, blogType });
    if (totalCharacterCount < MINIMUM_REQUIRED_CHARACTER_COUNT) {
      testCase.characterCount = false;
    }

    console.log(`> - URL: ${contentUrl}
> - 높이 테스트: ${testCase.height ? '성공' : '실패'}
>   - 기준 높이: ${MINIMUM_REQUIRED_HEIGHT}
>   - 실제 높이: ${realHeight}
> - 글자수 테스트: ${testCase.characterCount ? '성공' : '실패'}
>   - 기준 글자수: ${MINIMUM_REQUIRED_CHARACTER_COUNT}
>   - 실제 글자수: ${totalCharacterCount}`);

    // 실패 시 스크린샷
    if (!testCase.height || !testCase.characterCount) {
      const screenshotOptions = getScreenshotOptions(round, koName);
      if (blogType === BlogType.NOTION_SITE) {
        await page
          .locator('#notion-app main')
          .first()
          .screenshot({
            ...screenshotOptions,
          });
      } else {
        await page.screenshot({
          ...screenshotOptions,
        });
      }

      await slack.files.uploadV2({
        thread_ts: message?.ts,
        channel_id: message?.channel,
        filename: `${round}-${koName}.jpeg`,
        initial_comment: `${round} ${koName}
> - URL: ${contentUrl}
> - 높이 테스트: ${
          testCase.height ? '성공' : '실패'
        } (${MINIMUM_REQUIRED_HEIGHT}/${realHeight})
> - 글자수 테스트: ${
          testCase.characterCount ? '성공' : '실패'
        } (${MINIMUM_REQUIRED_CHARACTER_COUNT}/${totalCharacterCount})
        `,
        file: `./screenshots/${round}/${koName}.jpeg`,
      });
    }
  });
}
