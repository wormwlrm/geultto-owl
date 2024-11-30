// import fs from 'fs';
// import path from 'path';
import dotenv from 'dotenv';
// import data from './data.json';

export type TCommentResponse = {
  url: string;
  title: string;
  haiku_comment: string;
  sonnet_comment: string;
};

export type TFeedbackResponse = {
  url: string;
  title: string;
  haiku_comment: string;
};

export type TError = {
  message: string;
};

dotenv.config();

export async function getSummary(
  url: string
): Promise<TCommentResponse | undefined> {
  const baseUrl = process.env.LLM_API_URL as string;

  const comments: TCommentResponse[] | TError = await (
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

  if ('message' in comments) {
    return undefined;
  }

  return comments[0];
}

export async function getFeedback(
  url: string
): Promise<TFeedbackResponse | undefined> {
  const baseUrl = process.env.LLM_API_URL as string;

  const feedback: TFeedbackResponse[] | TError = await (
    await fetch(`${baseUrl}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
      }),
    })
  ).json();

  console.log(feedback);

  if ('message' in feedback) {
    return undefined;
  }

  return feedback[0];
}
