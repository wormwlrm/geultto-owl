export enum BlogType {
  NotionSo = 'notion_so',
  NotionSite = 'notion_site',
  NotionBased = 'notion_based',
  NaverPc = 'naver',
  NaverMobile = 'm_naver',
  Velog = 'velog',
  Tistory = 'tistory',
  Medium = 'medium',
  GitHubPages = 'github',
  Brunch = 'brunch',
  Oopy = 'oopy',
  Inblog = 'inblog',
  Unknown = 'unknown',
}

export const guessBlogTypeByUrl = (url: string): BlogType => {
  if (['notion.so'].some((domain) => url.includes(domain))) {
    return BlogType.NotionSo;
  }

  if (['notion.site'].some((domain) => url.includes(domain))) {
    return BlogType.NotionSite;
  }

  if (['m.blog.naver.com'].some((domain) => url.includes(domain))) {
    return BlogType.NaverMobile;
  }

  if (['blog.naver.com'].some((domain) => url.includes(domain))) {
    return BlogType.NaverPc;
  }

  if (['velog.io'].some((domain) => url.includes(domain))) {
    return BlogType.Velog;
  }

  if (['tistory.com'].some((domain) => url.includes(domain))) {
    return BlogType.Tistory;
  }

  if (['medium.com'].some((domain) => url.includes(domain))) {
    return BlogType.Medium;
  }

  if (['github.io'].some((domain) => url.includes(domain))) {
    return BlogType.GitHubPages;
  }

  if (['brunch.co.kr'].some((domain) => url.includes(domain))) {
    return BlogType.Brunch;
  }

  if (['oopy.io'].some((domain) => url.includes(domain))) {
    return BlogType.Oopy;
  }

  if (['inblog.ai'].some((domain) => url.includes(domain))) {
    return BlogType.Inblog;
  }

  return BlogType.Unknown;
};
