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
    const [_year, _month, _day] = dt.split(' ');
    const year = _year.replaceAll('.', '').replaceAll(' ', '');
    const month = _month.replaceAll('.', '').replaceAll(' ', '');
    const day = _day.replaceAll('.', '').replaceAll(' ', '');

    return dayjs(`${year}-${month}-${day}`);
  };

  const today = rows
    .filter((row) => {
      const dt = row.get('dt');
      // 한국시간 9시간 더해줌
      const yesterday = dayjs().subtract(2, 'day').add(9, 'hour');
      return formatDateTime(dt).isAfter(yesterday);
    })
    .map((row) => {
      return {
        round: row.get('회차'),
        team: row.get('team'),
        koName: row.get('ko_name'),
        title: row.get('title'),
        contentUrl: row.get('content_url'),
        dt: formatDateTime(row.get('dt')).format('YYYY-MM-DD'),
        ts: row.get('ts'),
      };
    });

  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(today));
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
