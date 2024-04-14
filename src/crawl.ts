import { GoogleSpreadsheet } from 'google-spreadsheet';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function getUser(doc: GoogleSpreadsheet) {
  const sheet = doc.sheetsById[370617765];

  const rows = await sheet.getRows();

  const user = rows
    .filter((row) => {
      return row.get('채널ID') && row.get('이름');
    })
    .map((row) => ({
      [row.get('이름')]: row.get('채널ID'),
    }))
    .reduce((acc, cur) => {
      return { ...acc, ...cur };
    }, {});

  fs.writeFileSync(path.join(__dirname, 'user.json'), JSON.stringify(user));
}

async function getSubmission(doc: GoogleSpreadsheet) {
  const sheet = doc.sheetsById[0];

  const rows = await sheet.getRows();

  const formatDateTime = (dt: string) => {
    const [_year, _month, _day, _m, time] = dt.split(' ');
    const year = _year.replaceAll('.', '').replaceAll(' ', '');
    const month = _month.replaceAll('.', '').replaceAll(' ', '');
    const day = _day.replaceAll('.', '').replaceAll(' ', '');
    const m = _m === '오후' ? 'PM' : 'AM';
    const [_hour, _minute, _seconds] = time.split(':');
    // 자정은 0시로, 정오는 12시로 나오게
    const addition = m === 'PM' ? 12 : 0;

    let hour: string;

    if (_hour === '12') {
      // 자정은 0시로, 정오는 12시로 나오게
      if (m === 'AM') {
        hour = '00';
      } else {
        hour = '12';
      }
    } else if (m === 'PM') {
      hour = String(Number(_hour) + addition);
    } else {
      hour = _hour;
    }

    const minute = _minute;
    const seconds = _seconds;

    return dayjs(`${year}-${month}-${day}`)
      .set('hour', Number(hour))
      .set('minute', Number(minute))
      .set('second', Number(seconds));
  };

  // 한국 시간 기준으로 계산
  // 혹시 테스트 시간 필요하면 여기서 수정
  let currentTimeInKST = dayjs().set('minute', 0).set('second', 0);

  // CI에서 돌 때는 한국시간 9시간 더해줌
  if (process.env.CI === 'true') {
    currentTimeInKST = currentTimeInKST.add(9, 'hour');
  }

  // 크롤링 범위를 정확하게 지정하기
  let from: dayjs.Dayjs;

  // 크론 주기 변하는 시점 예외 처리
  // 토요일
  if (currentTimeInKST.day() === 6) {
    // 자정에 동작하는 크론은 금요일에 작성한 글 테스트
    if (currentTimeInKST.hour() === 0) {
      from = currentTimeInKST.subtract(1, 'day');
    } else {
      // 자정 아닌 시간은 3시간 전까지의 글 테스트
      from = currentTimeInKST.subtract(3, 'hour');
    }
  } else if (currentTimeInKST.day() === 0) {
    // 일요일은 항상 3시간 전까지의 글 테스트
    from = currentTimeInKST.subtract(3, 'hour');
  } else if (currentTimeInKST.day() === 1) {
    // 월요일 자정은 일요일까지 제출된 글을 테스트함
    // 따라서 현재 시간에서 3시간만 빼면 됨
    from = currentTimeInKST.subtract(3, 'hour');
  } else {
    // 평일은 24시간 주기로 데이터를 가져오기
    from = dayjs(currentTimeInKST).subtract(1, 'day');
  }

  let to = currentTimeInKST;

  console.log(from, to);

  const today = rows
    .filter((row) => {
      // 작성 시간
      const dt = formatDateTime(row.get('dt'));

      return dt.isAfter(from) && dt.isBefore(to);
    })
    .map((row) => {
      return {
        round: row.get('회차'),
        team: row.get('team'),
        koName: row.get('ko_name'),
        title: row.get('title'),
        contentUrl: row.get('content_url'),
        dt: formatDateTime(row.get('dt')).format('YYYY-MM-DD HH:mm:ss'),
        ts: row.get('ts'),
      };
    });

  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(today));

  console.log(today);
}

async function main() {
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID as string, {
    apiKey: process.env.GOOGLE_API_KEY as string,
  });

  await doc.loadInfo();

  await getUser(doc);
  await getSubmission(doc);
}

main();
