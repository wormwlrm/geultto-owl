export const BlogType = {
  NOTION_SO: 'notion_so',
  NOTION_SITE: 'notion_site',
  NAVER: 'naver',
  M_NAVER: 'm_naver',
  BLOG: 'blog',
  VELOG: 'velog',
  TISTORY: 'tistory',
  MEDIUM: 'medium',
  GITHUB: 'github',
  BRUNCH: 'brunch',
  OOPY: 'oopy',
  UNKNOWN: 'unknown',
} as const;

export type TBlogType = (typeof BlogType)[keyof typeof BlogType];

export const guessBlogType = (url: string) => {
  if (['notion.so'].some((domain) => url.includes(domain))) {
    return BlogType.NOTION_SO;
  }

  if (['notion.site'].some((domain) => url.includes(domain))) {
    return BlogType.NOTION_SITE;
  }

  if (['m.blog.naver.com'].some((domain) => url.includes(domain))) {
    return BlogType.M_NAVER;
  }

  if (['blog.naver.com'].some((domain) => url.includes(domain))) {
    return BlogType.NAVER;
  }

  if (['velog.io'].some((domain) => url.includes(domain))) {
    return BlogType.VELOG;
  }

  if (['tistory.com'].some((domain) => url.includes(domain))) {
    return BlogType.TISTORY;
  }

  if (['medium.com'].some((domain) => url.includes(domain))) {
    return BlogType.MEDIUM;
  }

  if (['github.io'].some((domain) => url.includes(domain))) {
    return BlogType.GITHUB;
  }

  if (['brunch.co.kr'].some((domain) => url.includes(domain))) {
    return BlogType.BRUNCH;
  }

  if (['oopy.io'].some((domain) => url.includes(domain))) {
    return BlogType.OOPY;
  }

  return BlogType.UNKNOWN;
};
