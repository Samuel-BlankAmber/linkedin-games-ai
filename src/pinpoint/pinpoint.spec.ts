import { test, expect, FrameLocator } from '@playwright/test';
import { getOpenAIResponse } from '../openai/client';

async function getClues(frame: FrameLocator): Promise<string[]> {
  const clues = await frame.locator(".pinpoint__card--clue").all();
  const clueTexts: string[] = [];
  for (const clue of clues) {
    const text = await clue.textContent();
    expect(text).toBeTruthy();
    if (text) {
      clueTexts.push(text.trim());
    }
  }
  return clueTexts;
}

test('Play Pinpoint', async ({ page }) => {
  await page.goto('https://www.linkedin.com/games/');
  await page.getByRole('link', { name: 'Guess the category. Pinpoint' }).click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Start game' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Dismiss' }).click();
  const frame = page.frameLocator('iframe.game-launch-page__iframe');
  const guessCategoryInput = frame.locator('.pinpoint__input');
  const guessButton = frame.locator('.pinpoint__submit-btn');

  const NUM_GUESSES = 5;

  for (let i = 0; i < NUM_GUESSES; i++) {
    const clues = await getClues(frame);

    const prompt = `
    You are a game master for the LinkedIn Pinpoint game.
    You will be given clues from the game, and you need to guess the category based on these clues.
    The clues will be provided in the format: "Clue 1: [clue text]".
    Each clue will be separated by a newline.
    Your task is to provide a single guess for the category based on the clues.
    Do not provide any additional information or explanations.
    Just provide the category name.

    ${clues.map((clue, index) => `Clue ${index + 1}: ${clue}`).join('\n')}
    `
    const category = await getOpenAIResponse(prompt);

    await guessCategoryInput.fill(category);
    await guessButton.click();

    if (!(await guessCategoryInput.isVisible())) {
      break;
    }
  }

  const gameResultsText = (await frame.locator('.pr-top__headline').textContent())?.trim();
  if (gameResultsText === "You’re crushing it!") {
    const solvedText = (await frame.locator('.pr-top__subtext', { hasText: 'Solved in' }).textContent())?.trim();
    console.log(solvedText);
    expect(solvedText).toMatch(/Solved in \d guess/);
  } else {
    console.log(gameResultsText);
    expect(false).toBeTruthy();
  }
});
