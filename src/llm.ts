// import fs from 'fs';
// import path from 'path';
import dotenv from 'dotenv';
// import data from './data.json';

export type TResponse = {
  url: string;
  title: string;
  haiku_comment: string;
  sonnet_comment: string;
};

export type TError = {
  message: string;
};

export async function getSummary(url: string): Promise<TResponse | undefined> {
  dotenv.config();

  const baseUrl = process.env.LLM_API_URL as string;

  console.log(baseUrl);

  const response: TResponse[] | TError = await (
    await fetch(`${baseUrl}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
      }),
    })
  ).json();

  if (!Array.isArray(response)) {
    return undefined;
  }

  return response[0];
}
