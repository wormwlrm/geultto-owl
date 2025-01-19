import { test, Page } from '@playwright/test';
import data from './data.json';
import user from './user.json';
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
import {
  getFeedback,
  getSummary,
  TCommentResponse,
  TFeedbackResponse,
} from './llm.ts';

dotenv.config();

const sungyoon = `U07NR02CHJR`;

const slack = new WebClient(process.env.SLACK_BOT_TOKEN || '');

const getScreenshotOptions = (round, koName) => {
  return {
    path: `screenshots/${round}/${koName}.jpeg`,
    fullPage: true,
    quality: 1,
  };
};

const escapeTitle = (title: string) => {
  return title
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
};

const getComment = ({
  round,
  koName,
  contentUrl,
  title,
  testCase,
  realHeight,
  totalCharacterCount,
  minimumRequiredCharacterCount,
  minimumRequiredHeight,
  codeRatio,
  maximumCodeRatio,
  isNoticeToUser,
  ts,
  summary,
  feedback,
}: {
  round: string;
  koName: string;
  contentUrl: string;
  title: string;
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
  summary?: TCommentResponse;
  feedback?: TFeedbackResponse;
}) => {
  const slackLink = `<https://geultto10.slack.com/archives/${
    user[koName]
  }/p${ts?.replace('.', '')}|${round} 제출>`;
  const postLink = `<${contentUrl}|작성한 글(_${escapeTitle(title)}_)>`;
  const intro = `${koName} 님이 ${slackLink}로 ${postLink}을 분석했빼미! :owl:`;

  const getTestEmoji = (isPassed: boolean) =>
    isPassed ? ':white_check_mark:' : ':warning:';

  const characterCountCheck = `\n${getTestEmoji(
    testCase.characterCount
  )} 공백과 코드를 제외한 글자 수는 (${totalCharacterCount}자 / ${minimumRequiredCharacterCount}자) 로 파악했빼미.`;

  const heightCheck = isNoticeToUser
    ? ''
    : `${getTestEmoji(
        testCase.height
      )} 코드 블럭을 제외한 본문 높이는 (${realHeight}px / ${minimumRequiredHeight}px) 으로 파악했빼미.`;

  const codeRatioCheck = isNoticeToUser
    ? ''
    : `${getTestEmoji(
        testCase.codeRatio
      )} 전체 높이 기준 코드 비율은 (${codeRatio}% / ${maximumCodeRatio}%) 로 파악했빼미.`;

  const additionalWritingNotice = !testCase.characterCount
    ? `\n:exclamation: ${koName} 님은 공백과 코드를 제외한 *${
        minimumRequiredCharacterCount - totalCharacterCount
      }자를 추가로 작성해야 제출로 인정이 가능* 하다빼미! 한 번 더 써보는 게 어떨까빼미? ${
        isNoticeToUser ? `<@${sungyoon}>` : ''
      }`
    : '';

  const feedbackSection = feedback?.haiku_comment
    ? `\n:mag: 아래는 *haiku* 모델로 분석한 포스트의 피드백이다빼미.
\`\`\`
${feedback.haiku_comment}
\`\`\``
    : '';

  const noticeMessage = true
    ? ':thought_balloon: 혹시... <https://forms.gle/vtBCibc8Us8xUiVy7|내가 주는 피드백에 대한 의견>을 줄 수 있냐빼미? :owl:'
    : '';

  return [
    intro,
    characterCountCheck,
    heightCheck,
    codeRatioCheck,
    additionalWritingNotice,
    feedbackSection,
    noticeMessage,
  ]
    .filter(Boolean)
    .join('\n');
};

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

  if (contentUrl === '') continue;

  test(`[${team}] ${koName} - ${title} - ${contentUrl}`, async ({ page }) => {
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
    const { totalCharacterCount, minimumRequiredCharacterCount, text } =
      await getSumOfCharacterCountTest({ page, blogType });

    if (totalCharacterCount < minimumRequiredCharacterCount) {
      testCase.characterCount = false;
    }

    const isFailed =
      !testCase.height || !testCase.codeRatio || !testCase.characterCount;

    if (isFailed) {
      fs.writeFileSync(path.join(__dirname, 'isFailed.json'), 'true');
    }

    // 스크린샷 촬영 후 슬랙 전송
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

    // const summary = await getSummary(contentUrl);
    const feedback = await getFeedback(text);

    // 실패 케이스만 스크린샷 전송
    if (isFailed) {
      await slack.files.uploadV2({
        thread_ts: message?.ts,
        channel_id: message?.channel,
        filename: `${round}-${koName}.jpeg`,
        initial_comment: getComment({
          round,
          koName,
          title,
          contentUrl,
          testCase,
          realHeight,
          codeRatio,
          totalCharacterCount,
          minimumRequiredCharacterCount,
          minimumRequiredHeight,
          maximumCodeRatio,
          isNoticeToUser: false,
          ts,
          feedback,
        }),
        file: `./screenshots/${round}/${koName}.jpeg`,
      });
    } else {
      await slack.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID || '',
        thread_ts: message?.ts,
        unfurl_links: false,
        unfurl_media: false,
        text: getComment({
          round,
          koName,
          title,
          contentUrl,
          testCase,
          realHeight,
          codeRatio,
          totalCharacterCount,
          minimumRequiredCharacterCount,
          minimumRequiredHeight,
          maximumCodeRatio,
          isNoticeToUser: false,
          ts,
          feedback,
        }),
      });
    }

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
          title,
          testCase,
          realHeight,
          codeRatio,
          totalCharacterCount,
          minimumRequiredCharacterCount,
          minimumRequiredHeight,
          maximumCodeRatio,
          isNoticeToUser: true,
          ts,
          feedback,
        }),
        file: `./screenshots/${round}/${koName}.jpeg`,
      });
    }
  });
}
