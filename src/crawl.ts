import { GoogleSpreadsheet } from 'google-spreadsheet';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

async function main() {
  const doc = new GoogleSpreadsheet('***', {
    apiKey: '***',
  });

  await doc.loadInfo();

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
      // return formatDateTime(dt).isAfter(dayjs('2023-12-02'));
      return formatDateTime(dt).isAfter(dayjs().subtract(1, 'day'));
    })
    .map((row) => {
      return {
        round: row.get('회차'),
        team: row.get('team'),
        koName: row.get('ko_name'),
        title: row.get('title'),
        contentUrl: row.get('content_url'),
        dt: formatDateTime(row.get('dt')).format('YYYY-MM-DD'),
      };
    });

  fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(today));
}

main();
