import { Page } from '@playwright/test';
import { BlogType, TBlogType } from './blog';

export const getMinimumRequiredHeightTest = async ({
  page,
}: {
  page: Page;
}) => {
  const MINIMUM_REQUIRED_HEIGHT = 4000;

  const codeHeight = await page.evaluate(() => {
    const codes = document.querySelectorAll('code');

    return Array.from(codes).reduce((acc, cur) => {
      return acc + cur.clientHeight;
    }, 0);
  });

  const htmlHeight = await page.evaluate(() => {
    const htmlScrollHeight = document.querySelector('html')?.scrollHeight ?? 0;
    const bodyScrollHeight = document.querySelector('body')?.scrollHeight ?? 0;
    const notionScrollHeight =
      document.querySelector('#notion-app main')?.scrollHeight ?? 0;

    return Math.max(htmlScrollHeight, bodyScrollHeight, notionScrollHeight);
  });

  return {
    MINIMUM_REQUIRED_HEIGHT,
    codeHeight,
    htmlHeight,
  };
};

export const getSumOfCharacterCountTest = async ({
  blogType,
  page,
}: {
  blogType: TBlogType;
  page: Page;
}) => {
  const MINIMUM_REQUIRED_CHARACTER_COUNT = 1000;
  let tagToCheck = 'p';

  if (blogType === BlogType.NOTION_SITE) {
    tagToCheck = 'div';
  }

  const texts = await page.locator(tagToCheck).allTextContents();

  let totalCharacterCount: number = 0;

  texts.forEach((text) => {
    totalCharacterCount += text.length;
  });

  return {
    totalCharacterCount,
    MINIMUM_REQUIRED_CHARACTER_COUNT,
  };
};
