import { Page } from '@playwright/test';
import { BlogType, getMinimumRequiredHeight } from './blog';

export const getMinimumRequiredHeightTest = async ({
  page,
  blogType,
}: {
  page: Page;
  blogType: BlogType;
}): Promise<{
  minimumRequiredHeight: number;
  realHeight: number;
  codeHeight: number;
}> => {
  const minimumRequiredHeight = getMinimumRequiredHeight({ blogType });

  const codeHeight = await page.evaluate(() => {
    const elements = document.querySelectorAll('code');

    return Array.from(elements).reduce((acc, cur) => {
      return acc + cur.offsetHeight;
    }, 0);
  });

  const htmlHeight = await page.evaluate(() => {
    const html = document.querySelector('html');
    return Math.max(html?.scrollHeight ?? 0, html?.offsetHeight ?? 0);
  });

  const bodyHeight = await page.evaluate(() => {
    const body = document.querySelector('body');
    return Math.max(body?.scrollHeight ?? 0, body?.offsetHeight ?? 0);
  });

  const heights = [htmlHeight, bodyHeight];

  if (blogType === BlogType.NotionSite || blogType === BlogType.NotionSo) {
    const notionHeight = await page.evaluate(() => {
      const main = document.querySelector('#notion-app main');
      return main?.scrollHeight ?? 0;
    });

    heights.push(notionHeight);
  }

  console.log(htmlHeight, bodyHeight, codeHeight);

  const realHeight = Math.max(...heights) - codeHeight;

  return {
    minimumRequiredHeight,
    codeHeight,
    realHeight,
  };
};

export const getSumOfCharacterCountTest = async ({
  blogType,
  page,
}: {
  blogType: BlogType;
  page: Page;
}) => {
  const minimumRequiredCharacterCount = 1000;
  let tagToCheck = ['p', 'li', 'ol', 'ul'];

  if (
    [BlogType.NotionSite, BlogType.NotionSo, BlogType.Inblog].includes(blogType)
  ) {
    tagToCheck.push('div');
  }

  let totalCharacterCount: number = 0;

  for (const tag of tagToCheck) {
    const texts = await page.locator(tag).allTextContents();

    totalCharacterCount += texts.reduce((acc, cur) => {
      // 공백과 줄바꿈 삭제
      return acc + cur.replaceAll(/[\r\n\t\s]/g, '').length;
    }, 0);
  }

  return {
    totalCharacterCount,
    minimumRequiredCharacterCount,
  };
};
