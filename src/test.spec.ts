import { test, Page } from '@playwright/test';
import data from './data.json';
import user from './user.json';
import failedCount from './failedCount.json';
import { WebClient } from '@slack/web-api';
import message from './message.json';
import {
  getMinimumRequiredHeightTest,
  getSumOfCharacterCountTest,
} from './testcases.ts';
import { guessBlogTypeByUrl, BlogType } from './blog.ts';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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
  maximumCodeRatio,
  isNoticeToUser,
  ts,
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
  maximumCodeRatio: number;
  isNoticeToUser: boolean;
  ts?: string;
}) => `${koName} 님이 <https://geultto9.slack.com/archives/${
  user[koName]
}/p${ts?.replace(
  '.',
  ''
)}|${round} 제출>로 <${contentUrl}|작성한 글>을 분석했빼미! :owl:

${
  testCase.characterCount ? ':white_check_mark:' : ':warning:'
} 글자 수는 (${totalCharacterCount}자 / ${minimumRequiredCharacterCount}자) 로 파악했빼미.${
  isNoticeToUser
    ? ''
    : `
${
  testCase.height ? ':white_check_mark:' : ':warning:'
} 코드 블럭을 제외한 본문 높이는 (${realHeight}px / ${minimumRequiredHeight}px) 으로 파악했빼미.`
}${
  isNoticeToUser
    ? ''
    : `
${
  testCase.codeRatio ? ':white_check_mark:' : ':warning:'
} 전체 높이 기준 코드 비율은 (${codeRatio}% / ${maximumCodeRatio}%) 로 파악했빼미.`
}

블로그 플랫폼의 종류, HTML 구조에 따라 결과가 다소 다르게 나올 수도 있음을 참고해빼미!`;

const connect = async ({
  blogType,
  contentUrl,
  page,
}: {
  blogType: BlogType;
  contentUrl: string;
  page: Page;
}) => {
  if (blogType === BlogType.NotionSite || blogType === BlogType.NotionSo) {
    await page.goto(contentUrl);
    await page.waitForFunction(() => {
      return document.querySelector('div[data-content-editable-root="true"]');
    });
    return;
  }

  // 네이버 PC 블로그는 모바일로 자동 리다이렉트
  if (blogType === BlogType.NaverPc) {
    await page.goto(contentUrl.replace('blog.naver.com', 'm.blog.naver.com'));
    return;
  }

  await page.goto(contentUrl);
};

const guessBlogTypeByHTML = async ({
  page,
  blogType,
}: {
  page: Page;
  blogType: BlogType;
}) => {
  if (blogType !== BlogType.Unknown) {
    return blogType;
  }

  const isNotionBased =
    (await page
      .locator('div[class^="notion-"]')
      .count()
      .catch(() => 0)) > 0;

  if (isNotionBased) {
    return BlogType.NotionBased;
  }

  return BlogType.Unknown;
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
  const { round, team, koName, dt, title, contentUrl, ts } = line;

  if (contentUrl === '' || map.has(koName)) continue;

  map.set(koName, true);

  test(`${koName} 테스트`, async ({ page }) => {
    let blogType = guessBlogTypeByUrl(contentUrl);

    await connect({
      blogType,
      page,
      contentUrl,
    });

    // SPA 사이트 데이터 패치를 위해 3초 대기
    await page.waitForTimeout(3000);

    blogType = await guessBlogTypeByHTML({ page, blogType });

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

    const isFailed =
      !testCase.height || !testCase.codeRatio || !testCase.characterCount;

    if (isFailed) {
      fs.appendFileSync(path.join(__dirname, 'failedCount.json'), '1');
    }

    // 실패 시 스크린샷 촬영 후 슬랙 전송
    // TODO: 임시로 모든 유저에게 전송
    if (true) {
      const screenshotOptions = getScreenshotOptions(round, koName);
      if (blogType === BlogType.NotionSite) {
        await page
          .locator('div[data-content-editable-root="true"]')
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
        initial_comment: getComment({
          round,
          koName,
          contentUrl,
          testCase,
          realHeight,
          codeRatio,
          totalCharacterCount,
          minimumRequiredCharacterCount,
          minimumRequiredHeight,
          maximumCodeRatio,
          isNoticeToUser: false,
          ts: ts,
        }),
        file: `./screenshots/${round}/${koName}.jpeg`,
      });

      // 사용자에게 직접 전송은 CI 환경에서 GitHub Actions 체크 박스 활성화 또는 크론잡 실행 시에만
      if (process.env.CI === 'true' && process.env.NOTICE_TO_USER === 'true') {
        await slack.files.uploadV2({
          thread_ts: ts,
          channel_id: user[koName],
          filename: `${round}-${koName}.jpeg`,
          initial_comment: getComment({
            round,
            koName,
            contentUrl,
            testCase,
            realHeight,
            codeRatio,
            totalCharacterCount,
            minimumRequiredCharacterCount,
            minimumRequiredHeight,
            maximumCodeRatio,
            isNoticeToUser: true,
          }),
          file: `./screenshots/${round}/${koName}.jpeg`,
        });
      }
    }
  });
}
