import { test, Page } from '@playwright/test';
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
const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

const getScreenshotOptions = (round, koName) => {
  return {
    path: `screenshots/${round}/${koName}.jpeg`,
    fullPage: true,
    quality: 0,
  };
};

const getComment = ({
  round,
  koName,
  contentUrl,
  testCase,
  realHeight,
  totalCharacterCount,
  minimumRequiredCharacterCount,
  minimumRequiredHeight,
  codeRatio,
}: {
  round: string;
  koName: string;
  contentUrl: string;
  testCase: {
    height: boolean;
    characterCount: boolean;
    codeRatio: boolean;
  };
  codeRatio: number;
  realHeight: number;
  totalCharacterCount: number;
  minimumRequiredHeight: number;
  minimumRequiredCharacterCount: number;
}) => `${round} ${koName}

> - URL: ${contentUrl}
> - ${
  testCase.height ? ':white_check_mark:' : ':x:'
} 코드 제외 높이 테스트: (${realHeight}/${minimumRequiredHeight})
> - ${
  testCase.codeRatio ? ':white_check_mark:' : ':x:'
} 전체 높이 기준 코드 비율: (${codeRatio}%)
> - ${
  testCase.characterCount ? ':white_check_mark:' : ':x:'
} 글자 수 테스트:  (${totalCharacterCount}/${minimumRequiredCharacterCount})
`;

const connect = async ({
  blogType,
  contentUrl,
  page,
}: {
  blogType: BlogType;
  contentUrl: string;
  page: Page;
}) => {
  // notion.so URL이 notion.site 로 자동 리다이렉션됨
  if (blogType === BlogType.NotionSite || blogType === BlogType.NotionSo) {
    await page.waitForFunction(() => {
      return document.querySelector('#notion-app main');
    });
  }

  // 네이버 PC 블로그는 모바일로 자동 리다이렉트
  if (blogType === BlogType.NaverPc) {
    await page.goto(contentUrl.replace('blog.naver.com', 'm.blog.naver.com'));
    return;
  }

  await page.goto(contentUrl);
};

test.describe('테스트 시작', () => {
  const totalCount = data.length;
  const submittedCount = data.filter(
    (line: { contentUrl: string }) => line.contentUrl
  ).length;
  const passedCount = totalCount - submittedCount;

  test('테스트 시작 메시지 전송', async () => {
    await slack.chat.postMessage({
      channel: message.channel,
      thread_ts: message.ts,
      text: `테스트 대상: 총 ${data.length} 명 (제출 ${submittedCount} 명, 패스 ${passedCount} 명)`,
    });
  });
});

for (const line of data) {
  const { round, team, koName, dt, title, contentUrl } = line;

  if (contentUrl === '' || map.has(koName)) continue;

  map.set(koName, true);

  test(`${koName} 테스트`, async ({ page }) => {
    const blogType = guessBlogType(contentUrl);

    await connect({
      blogType,
      page,
      contentUrl,
    });

    console.log(`${koName} 님의 블로그는 ${blogType}로 추측`);

    // 테스트 별 실패 여부 체크
    const testCase = {
      height: true,
      codeRatio: true,
      characterCount: true,
    };

    // 코드 블럭을 제외한 높이를 테스트
    const { realHeight, codeHeight, minimumRequiredHeight } =
      await getMinimumRequiredHeightTest({
        page,
        blogType,
      });

    if (realHeight < minimumRequiredHeight) {
      testCase.height = false;
    }

    // 코드 비율 테스트
    const codeRatio = Math.min(
      Math.max(Math.round((codeHeight / (realHeight + codeHeight)) * 100), 0),
      100
    );

    const maximumCodeRatio = 75;

    if (codeRatio >= maximumCodeRatio) {
      testCase.codeRatio = false;
    }

    // 글자수 테스트
    const { totalCharacterCount, minimumRequiredCharacterCount } =
      await getSumOfCharacterCountTest({ page, blogType });

    if (totalCharacterCount < minimumRequiredCharacterCount) {
      testCase.characterCount = false;
    }

    const comment = getComment({
      round,
      koName,
      contentUrl,
      testCase,
      realHeight,
      codeRatio,
      totalCharacterCount,
      minimumRequiredCharacterCount,
      minimumRequiredHeight,
    });

    console.log(comment);

    // 실패 시 스크린샷 촬영 후 슬랙 전송
    if (!testCase.height || !testCase.characterCount) {
      const screenshotOptions = getScreenshotOptions(round, koName);
      if (blogType === BlogType.NotionSite) {
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
        initial_comment: comment,
        file: `./screenshots/${round}/${koName}.jpeg`,
      });
    }
  });
}
