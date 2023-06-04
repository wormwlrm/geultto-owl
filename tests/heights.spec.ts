import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";

const MINIMUM_REQUIRED_HEIGHT = 4000;

const lines = readFileSync("dummy.csv", "utf8").split(/\r?\n/);

const map = new Map();

const getScreenshotOptions = (count, koName) => {
  return {
    path: `screenshots/${count}/${koName}.jpeg`,
    fullPage: true,
    quality: 1,
  };
};

for (const line of lines) {
  if (!line) continue;

  const [
    count,
    _team,
    koName,
    _title,
    _, // 숨겨진 셀
    contentUrl,
  ] = line.split(/\t/);

  if (contentUrl === "" || map.has(koName)) continue;

  map.set(koName, true);

  test(`${koName}의 ${count} 제출글의 높이는 ${MINIMUM_REQUIRED_HEIGHT}px 이상이어야 한다`, async ({
    page,
  }) => {
    await page.goto(contentUrl);

    let isNotionSo = contentUrl.includes("notion.so");
    let isNotionSite = contentUrl.includes("notion.site");
    let isNotion = isNotionSo || isNotionSite;

    // notion.so URL은 notion.site로 리다이렉션 해야 함
    if (
      isNotionSo &&
      page.getByText("아래의 링크를 따라 외부 사이트로 이동하세요.", {
        exact: true,
      })
    ) {
      await page.locator("a").first().click();
      await page.waitForFunction(() => {
        return document.querySelector("#notion-app main");
      });
    }

    const codeHeight = await page.evaluate(() => {
      const codes = document.querySelectorAll("code");

      return Array.from(codes).reduce((acc, cur) => {
        return acc + cur.clientHeight;
      }, 0);
    });

    const htmlHeight = await page.evaluate(() => {
      const htmlScrollHeight =
        document.querySelector("html")?.scrollHeight ?? 0;
      const bodyScrollHeight =
        document.querySelector("body")?.scrollHeight ?? 0;
      const notionScrollHeight =
        document.querySelector("#notion-app main")?.scrollHeight ?? 0;

      return Math.max(htmlScrollHeight, bodyScrollHeight, notionScrollHeight);
    });

    console.log("htmlHeight: ", htmlHeight, "codeHeight: ", codeHeight);

    if (htmlHeight - codeHeight < MINIMUM_REQUIRED_HEIGHT) {
      const screenshotOptions = getScreenshotOptions(count, koName);
      if (isNotion) {
        await page
          .locator("#notion-app main")
          .first()
          .screenshot({
            ...screenshotOptions,
          });
      } else {
        await page.screenshot({
          ...screenshotOptions,
        });
      }
    }

    expect(htmlHeight - codeHeight).toBeGreaterThanOrEqual(
      MINIMUM_REQUIRED_HEIGHT
    );
  });
}
