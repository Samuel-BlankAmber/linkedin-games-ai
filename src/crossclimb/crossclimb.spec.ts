import { test, expect, FrameLocator, Locator, Page } from '@playwright/test';
import { getOpenAIResponse } from '../openai/client';

async function getClues(frame: FrameLocator) {
  const guessBoxes = (await frame.locator('.crossclimb__guess__inner').all()).slice(1, -1);
  const clues: string[] = [];

  for (const guessBox of guessBoxes) {
    await guessBox.click();
    const clue = await frame.locator('.crossclimb__clue').textContent();
    if (!clue) {
      throw new Error('Clue text is empty or null.');
    }
    clues.push(clue.trim());
  }
  return clues;
}

async function inputAnswer(frame: FrameLocator, guessBoxIndex: number, guess: string) {
  expect(guess).toHaveLength(4);

  const guessBoxes = await frame.locator('.crossclimb__guess__inner').all();
  const guessBox = guessBoxes[guessBoxIndex];

  const inputs = await guessBox.locator('input').all();
  for (let i = 0; i < guess.length; i++) {
    const input = inputs[i];
    await input.fill(guess[i]);
  }
}

async function inputAnswers(frame: FrameLocator, answers: string[], includeIndices: number[] | null = null) {
  for (let i = 0; i < answers.length; i++) {
    if (includeIndices && !includeIndices.includes(i)) {
      continue;
    }
    const guess = answers[i];
    expect(guess).toHaveLength(4);
    await inputAnswer(frame, i+1, guess);
  }
}

async function getWrongIndices(frame: FrameLocator) {
  const guessBoxes = (await frame.locator('.crossclimb__guess').all()).slice(1, -1);
  const wrongIndices: number[] = [];

  for (const [index, guessBox] of guessBoxes.entries()) {
    const className = await guessBox.getAttribute('class');
    if (className?.includes('crossclimb__guess--incorrect')) {
      wrongIndices.push(index);
    }
  }
  return wrongIndices;
}

function getPermutations<T>(arr: T[]) {
  const result: T[][] = [];

  function permute(a: T[], start = 0) {
    if (start === a.length - 1) {
      result.push([...a]);
      return;
    }

    for (let i = start; i < a.length; i++) {
      [a[start], a[i]] = [a[i], a[start]];
      permute(a, start + 1);
      [a[start], a[i]] = [a[i], a[start]];
    }
  }

  permute(arr);
  return result;
}

function isValidOrder(words: string[]) {
  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i];
    const word2 = words[i + 1];
    let diffCount = 0;
    for (let j = 0; j < word1.length; j++) {
      if (word1[j] !== word2[j]) {
        diffCount++;
      }
    }
    if (diffCount !== 1) {
      return false;
    }
  }
  return true;
}

function orderWords(words: string[]) {
  const permutations = getPermutations(words);
  for (const perm of permutations) {
    if (isValidOrder(perm)) {
      return perm;
    }
  }
  throw new Error('No valid order found for the words.');
}

function computeMoves<T>(initial: T[], final: T[]): [number, number][] {
  // TODO: Make this optimal using a more efficient algorithm
  // Refer to: https://www.geeksforgeeks.org/minimum-number-deletions-insertions-transform-one-string-another/
  const current = initial.slice();
  const moves: [number, number][] = [];

  for (let finalIndex = 0; finalIndex < final.length; finalIndex++) {
    if (current[finalIndex] === final[finalIndex]) continue;

    const initialIndex = current.indexOf(final[finalIndex]);
    if (initialIndex === -1) {
      throw new Error("Element from final array not found in initial array");
    }

    const [item] = current.splice(initialIndex, 1);
    current.splice(finalIndex, 0, item);
    moves.push([initialIndex, finalIndex]);
  }

  return moves;
}

async function moveDraggers(page: Page, draggers: Locator[], initialIndex: number, finalIndex: number) {
  const dragger = draggers[initialIndex];
  const targetDragger = draggers[finalIndex];

  const box = await dragger.boundingBox();
  const targetBox = await targetDragger.boundingBox();

  if (!box || !targetBox) {
    throw new Error('Bounding box is null or undefined.');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  if (finalIndex > initialIndex) {
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 + 20, { steps: 10 });
  } else {
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2 - 20, { steps: 10 });
  }
  await page.mouse.up();
}

test('Play Crossclimb', async ({ page }) => {
  await page.goto('https://www.linkedin.com/games/');
  await page.getByRole('link', { name: 'Unlock a trivia ladder. Crossclimb' }).click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Start game' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Dismiss' }).click();
  const frame = page.frameLocator('iframe.game-launch-page__iframe');

  const clues = await getClues(frame);

  const prompt = `
  You are the game master for LinkedIn's Crossclimb game.
  You are given 5 clues.
  Each clue corresponds to a 4-letter English word.
  Each word changes only one letter from another word in the list.

  Your first task is to list 5 possible answers for each clue.
  Your second task is to analyse the answers for each clue and pick the best one.
  VERY IMPORTANT: Ensure each word changes by only one letter from another word in the list. Think long and hard about this.
  Your third task is to output your final choice of words, separated by a line break.

  When you are ready to submit your final answer start the list with a line containing "Final:" then a line break.
  Ensure that the final list is in the same order as the clues.
  Do not include any additional formatting.

  ${clues.map((clue, index) => `Clue ${index + 1}: ${clue}`).join('\n')}
  `;

  let answers = await getOpenAIResponse(prompt);
  let finalAnswers = answers.toLowerCase().split('final:')[1].trim().split('\n').map(answer => answer.trim());
  console.log('Trying answers:', finalAnswers);
  expect(finalAnswers).toHaveLength(5);

  await inputAnswers(frame, finalAnswers);

  const MAX_RETRIES = 3;
  const previousWrongAnswers: string[] = [];
  for (let i = 0; i < MAX_RETRIES; i++) {
    const wrongIndices = await getWrongIndices(frame);
    if (wrongIndices.length === 0) {
      break;
    }

    previousWrongAnswers.push(...wrongIndices.map(index => finalAnswers[index]));

    const retryPrompt = `
    You are the game master for LinkedIn's Crossclimb game.
    You are given 5 clues.
    Each clue corresponds to a 4-letter English word.
    Each word changes only one letter from another word in the list.

    You played before and got some answers wrong.
    The clues are the same as before.
    I will give you the wrong answers and the clues again.
    You need to fix the wrong answers based on the clues.

    Your first task is to list 5 possible answers for each clue you got wrong. DO NOT reuse a known incorrect answer.
    Your second task is to analyse the answers for each and pick the best one.
    VERY IMPORTANT: Ensure each word changes by only one letter from another word in the list. Think long and hard about this.
    Your third task is to output your final choice of words, separated by a line break.

    When you are ready to submit your final answer start the list with a line containing "Final:" then a line break.
    Ensure that the final list is in the same order as the clues. Include even the correct ones.
    Do not include any additional formatting.

    ${clues.map((clue, index) => `Clue ${index + 1}: ${clue}` + (wrongIndices.includes(index) ? ` (wrong)` : ' (correct)')).join('\n')}

    ${finalAnswers.map((answer, index) => `Answer ${index + 1}: ${answer}` + (wrongIndices.includes(index) ? ` (wrong)` : ' (correct)')).join('\n')}

    ${previousWrongAnswers.length > 0 ? `Previous wrong answers (UNDER NO CIRCUMSTANCES SHOULD THESE BE REUSED): ${previousWrongAnswers.join(', ')}` : ''}
    `;

    answers = await getOpenAIResponse(retryPrompt);
    finalAnswers = answers.toLowerCase().split('final:')[1].trim().split('\n').map(answer => answer.trim());
    console.log(`Trying answers (Retry ${i + 1}):`, finalAnswers);
    expect(finalAnswers).toHaveLength(5);

    await inputAnswers(frame, finalAnswers, wrongIndices);
  }

  const wrongIndices = await getWrongIndices(frame);
  if (wrongIndices.length > 0) {
    console.log('Still wrong answers:', wrongIndices);
    expect(false).toBeTruthy();
  }

  await page.waitForTimeout(1000); // TODO: Better fix

  const orderedAnswers = orderWords(finalAnswers);
  const moves = computeMoves(finalAnswers, orderedAnswers);

  const draggers = (await frame.locator('.crossclimb__guess-dragger').all()).filter((_, index) => index % 2 === 0).slice(1, -1);
  expect(draggers).toHaveLength(5);

  for (const [initialIndex, finalIndex] of moves) {
    await moveDraggers(page, draggers, initialIndex, finalIndex);
  }

  const finalClue = (await frame.locator('.crossclimb__clue', { hasText: 'The top + bottom rows =' }).textContent())?.trim();
  expect(finalClue).toBeTruthy();

  const topAndBottomWords = [orderedAnswers[0], orderedAnswers[4]];
  const finalPrompt = `
  You are the game master for LinkedIn's Crossclimb game.
  You have completed the game and have the final clue.
  The clue is: "${finalClue}".

  You must work out the two remaining words.
  These two words will be one letter apart from one of these two words: ${topAndBottomWords.join(', ')}.

  Your first task is to list 5 possible answers for each word.
  Your second task is to analyse the answers for each clue and pick the best one.
  Your third task is to output your final choice of words, separated by a line break.

  When you are ready to submit your final answer start the list with a line containing "Final:" then a line break.
  Do not include any additional formatting.
  `;

  const finalClueAnswers = await getOpenAIResponse(finalPrompt);
  const finalClueFinalAnswers = finalClueAnswers.toLowerCase().split('final:')[1].trim().split('\n').map(answer => answer.trim());
  expect(finalClueFinalAnswers).toHaveLength(2);

  if (isValidOrder([topAndBottomWords[0], finalClueFinalAnswers[0]])) {
    await inputAnswer(frame, 0, finalClueFinalAnswers[0]);
    await inputAnswer(frame, 6, finalClueFinalAnswers[1]);
  } else {
    await inputAnswer(frame, 0, finalClueFinalAnswers[1]);
    await inputAnswer(frame, 6, finalClueFinalAnswers[0]);
  }

  await expect(page.locator('iframe[title="games"]').contentFrame().getByText('You’re crushing it!')).toBeVisible();
  const solvedText = await page.locator('iframe[title="games"]').contentFrame().getByText('Solved in 0:').textContent();
  if (solvedText) {
    console.log(solvedText.trim());
  }
});
