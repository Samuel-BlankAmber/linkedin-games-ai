import { test, expect, FrameLocator } from '@playwright/test';
import { Position, solveQueens } from './queens-solver';

async function getRowsAndColumns(frame: FrameLocator) {
  const grid = frame.locator('#queens-grid');
  const style = await grid.getAttribute('style');
  const rows = Number(style?.match(/--rows:\s*(\d+)/)?.[1]);
  const cols = Number(style?.match(/--cols:\s*(\d+)/)?.[1]);
  return { rows, cols };
}

async function getGrid(frame: FrameLocator) {
  const { rows, cols } = await getRowsAndColumns(frame);

  const gridLocator = frame.locator('#queens-grid');
  const cells = await gridLocator.locator('.queens-cell-with-border').all();
  expect(cells.length).toBe(rows * cols);

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
  for (const [index, cell] of cells.entries()) {
    const cellClass = await cell.getAttribute('class');
    const cellColor = cellClass?.match(/cell-color-(\d+)/)?.[1];
    if (!cellColor) {
      throw new Error('Cell color not found');
    }

    const rowIndex = Math.floor(index / cols);
    const colIndex = index % cols;
    grid[rowIndex][colIndex] = cellColor;
  }
  return grid;
}

async function clickSolutions(frame: FrameLocator, solutions: Position[]) {
  const { cols } = await getRowsAndColumns(frame);

  const gridLocator = frame.locator('#queens-grid');
  const cells = await gridLocator.locator('.queens-cell-with-border').all();

  for (const { row, col } of solutions) {
    const index = row * cols + col;
    // If not signed in, Queens may provide some Queen placements for free which are unclickable.
    // For succinctness, it is simpler to just force click.
    await cells[index].click({ force: true });
    await cells[index].click({ force: true });
  }
}

test('Play Queens', async ({ page }) => {
  await page.goto('https://www.linkedin.com/games/');
  await page.getByRole('link', { name: 'Crown each region. Queens' }).click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Start game' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Dismiss' }).click();
  const frame = page.frameLocator('iframe.game-launch-page__iframe');

  const grid = await getGrid(frame);
  const solution = await solveQueens(grid);
  await clickSolutions(frame, solution);

  await expect(page.locator('iframe[title="games"]').contentFrame().getByText('You’re crushing it!')).toBeVisible();
  const solvedText = await page.locator('iframe[title="games"]').contentFrame().getByText('Solved in 0:').textContent();
  if (solvedText) {
    console.log(solvedText.trim());
  }
});
