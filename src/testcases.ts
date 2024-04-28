import { Page } from '@playwright/test';
import { BlogType } from './blog';

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
  const minimumRequiredHeight = 2000;

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
      const main = document.querySelector(
        'div[data-content-editable-root="true"]'
      );
      return main?.scrollHeight ?? 0;
    });

    heights.push(notionHeight);
  }

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
  const minimumRequiredCharacterCount = 900;
  let tagsToCheck = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  if ([BlogType.Inblog, BlogType.NotionBased].includes(blogType)) {
    tagsToCheck.push('div[class^="notion-"]');
  } else if (
    [BlogType.NotionSite, BlogType.NotionSo, BlogType.Oopy].includes(blogType)
  ) {
    tagsToCheck.push('div.notion-page-content div[class^="notion-"]');
  }

  const characters = new Set<string>();

  for (const tag of tagsToCheck) {
    for (const content of await page.locator(tag).all()) {
      if (!(await content.isVisible())) {
        continue;
      }

      const text = await content.textContent();

      if (!text || text.trim() === '') {
        continue;
      }

      characters.add(text.trim().replaceAll(/[\r\n\t\s]/g, ''));
    }
  }

  const totalCharacterCount = Array.from(characters).reduce((acc, cur) => {
    return acc + cur.length;
  }, 0);

  return {
    totalCharacterCount,
    minimumRequiredCharacterCount,
  };
};
