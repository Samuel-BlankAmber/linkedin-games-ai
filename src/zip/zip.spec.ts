import { test, expect, FrameLocator, Page } from '@playwright/test';
import { Position, solveZip, Wall } from './zip-solver';

async function getRowsAndColumns(frame: FrameLocator) {
  const grid = frame.locator('.trail-grid');
  const style = await grid.getAttribute('style');
  const rows = Number(style?.match(/--rows:\s*(\d+)/)?.[1]);
  const cols = Number(style?.match(/--cols:\s*(\d+)/)?.[1]);
  return { rows, cols };
}

async function getGrid(frame: FrameLocator) {
  const { rows, cols } = await getRowsAndColumns(frame);

  const gridLocator = frame.locator('.trail-grid');
  const cells = await gridLocator.locator('.trail-cell').all();
  expect(cells.length).toBe(rows * cols);

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  const walls: Wall[] = [];
  for (const [index, cell] of cells.entries()) {
    const rowIndex = Math.floor(index / cols);
    const colIndex = index % cols;

    const cellWalls = await cell.locator('.trail-cell-wall').all();
    expect(cellWalls.length).toBeLessThanOrEqual(2);

    for (const cellWall of cellWalls) {
      const cellWallClassList = await cellWall.getAttribute('class');
      if (cellWallClassList?.includes('trail-cell-wall--right')) {
        const rightWall = {
          start: { row: rowIndex, col: colIndex },
          end: { row: rowIndex, col: colIndex + 1 },
        };
        walls.push(rightWall);
      } else if (cellWallClassList?.includes('trail-cell-wall--down')) {
        const downWall = {
          start: { row: rowIndex, col: colIndex },
          end: { row: rowIndex + 1, col: colIndex },
        };
        walls.push(downWall);
      }
      // TODO: Add more logic to handle walls (?)
    }

    const cellContent = cell.locator('.trail-cell-content');
    const cellContentCount = await cellContent.count();
    if (cellContentCount === 0) continue;
    expect(cellContentCount).toBe(1);

    const cellNumber = await cellContent.textContent();
    if (!cellNumber) {
      throw new Error('Cell number not found');
    }

    const cellNumberValue = Number(cellNumber);
    if (isNaN(cellNumberValue)) {
      throw new Error('Cell number is not a number');
    }

    grid[rowIndex][colIndex] = cellNumberValue;
  }
  return { grid, walls };
}

async function navigateSolution(page: Page, solution: number[][]) {
  const numToPosition: Record<number, Position> = {};
  const numRows = solution.length;
  const numCols = solution[0].length;
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      const cellNumber = solution[i][j];
      numToPosition[cellNumber] = { row: i, col: j };
    }
  }

  let currentNum = 1;
  while (currentNum < numRows * numCols) {
    const currentPos = numToPosition[currentNum];
    const nextPos = numToPosition[currentNum + 1];

    if (nextPos.row > currentPos.row) {
      await page.keyboard.press('ArrowDown');
    } else if (nextPos.row < currentPos.row) {
      await page.keyboard.press('ArrowUp');
    } else if (nextPos.col > currentPos.col) {
      await page.keyboard.press('ArrowRight');
    } else if (nextPos.col < currentPos.col) {
      await page.keyboard.press('ArrowLeft');
    } else {
      throw new Error(`Invalid move from ${currentPos.row},${currentPos.col} to ${nextPos.row},${nextPos.col}`);
    }
    currentNum++;
  }
}

test('Play Zip', async ({ page }) => {
  await page.goto('https://www.linkedin.com/games/');
  await page.getByRole('link', { name: 'Complete the path. Zip' }).click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Start game' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Dismiss' }).click();
  const frame = page.frameLocator('iframe.game-launch-page__iframe');

  const { grid, walls } = await getGrid(frame);
  const solution = await solveZip(grid, walls);
  await navigateSolution(page, solution);

  await expect(page.locator('iframe[title="games"]').contentFrame().getByText('You’re crushing it!')).toBeVisible();
  const solvedText = await page.locator('iframe[title="games"]').contentFrame().getByText('Solved in 0:').textContent();
  if (solvedText) {
    console.log(solvedText.trim());
  }
});
