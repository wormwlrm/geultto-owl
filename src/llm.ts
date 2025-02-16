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
  haiku_comment: string;
  style: TFeedbackIntensity;
};

export type TError = {
  message: string;
};

export type TFeedbackIntensity = 'MILD' | 'HOT' | 'FIRE' | 'DIABLO';

dotenv.config();

export function getFeedbackIntensityName(intensity: TFeedbackIntensity) {
  switch (intensity) {
    case 'MILD':
      return ':seedling: 순한맛';
    case 'HOT':
      return ':garlic: 보통맛';
    case 'FIRE':
      return ':hot_pepper: 매운맛';
    case 'DIABLO':
      return ':skull_and_crossbones: 지옥맛';
  }
}

export async function getSummary(
  url: string
): Promise<TCommentResponse | undefined> {
  const baseUrl = process.env.LLM_API_URL as string;

  let comments: TCommentResponse[] | TError;

  try {
    comments = await (
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
  } catch (e) {
    return undefined;
  }

  if ('message' in comments) {
    return undefined;
  }

  return comments[0];
}

export async function getFeedback({
  text,
  style,
}: {
  text: string;
  style: TFeedbackIntensity;
}): Promise<TFeedbackResponse | undefined> {
  const baseUrl = process.env.LLM_API_URL as string;

  let feedback;

  try {
    feedback = await (
      await fetch(`${baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          style,
        }),
      })
    ).json();
  } catch (e) {
    console.error(e);
    return undefined;
  }

  if ('message' in feedback) {
    console.error(feedback.message);
    return undefined;
  }

  return feedback[0];
}
