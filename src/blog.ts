export enum BlogType {
  NotionSo = 'notion_so',
  NotionSite = 'notion_site',
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

export const guessBlogType = (url: string): BlogType => {
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

export const getMinimumRequiredHeight = ({
  blogType,
}: {
  blogType: BlogType;
}) => {
  if (blogType === BlogType.NotionSite || blogType === BlogType.NotionSo) {
    return 2000;
  }

  if (blogType === BlogType.NaverMobile || blogType === BlogType.NaverPc) {
    return 2000;
  }

  if (blogType === BlogType.Velog) {
    return 2000;
  }

  if (blogType === BlogType.Medium) {
    return 2000;
  }

  if (blogType === BlogType.Brunch) {
    return 2000;
  }

  if (blogType === BlogType.Oopy) {
    return 2000;
  }

  if (blogType === BlogType.Inblog) {
    return 2000;
  }

  if (blogType === BlogType.Tistory) {
    // return 3000;
  }

  if (blogType === BlogType.GitHubPages) {
    // return 3000;
  }

  return 2000;
};
