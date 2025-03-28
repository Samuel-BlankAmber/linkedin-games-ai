import { test, expect, FrameLocator } from '@playwright/test';
import { GridConstraint, solveTango } from './tango-solver';

async function getRowsAndColumns(frame: FrameLocator) {
  const grid = frame.locator('.lotka-grid.gil__grid');
  const style = await grid.getAttribute('style');
  const rows = Number(style?.match(/--rows:\s*(\d+)/)?.[1]);
  const cols = Number(style?.match(/--cols:\s*(\d+)/)?.[1]);
  return { rows, cols };
}

async function getGridInfo(frame: FrameLocator) {
  const { rows, cols } = await getRowsAndColumns(frame);

  const cells = await frame.locator('div.lotka-cell').all();
  expect(cells.length).toBe(rows * cols);

  const grid: string[][] = [];
  let gridRow: string[] = [];
  const gridConstraints: GridConstraint[] = [];

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const childrenCount = await cell.locator(':scope > *').count();
    expect(childrenCount).toBeLessThanOrEqual(2);

    const cellContent = cell.locator('.lotka-cell-content');
    const cellContentCount = await cellContent.count();
    expect(cellContentCount).toBe(1);

    if (childrenCount > 1) {
      const cellEdges = await cell.locator('.lotka-cell-edge').all();
      expect(cellEdges.length).toBeLessThanOrEqual(2); // Always right or down - is this a correct assumption?

      for (const cellEdge of cellEdges) {
        const classList = await cellEdge.getAttribute('class') || '';
        let cell2Index = -1;
        if (classList.includes('lotka-cell-edge--right')) {
          cell2Index = i + 1;
        } else if (classList.includes('lotka-cell-edge--down')) {
          cell2Index = i + cols;
        } else {
          throw new Error(`Unknown cell edge class: ${classList}`);
        }

        const cellEdgeChildren = await cellEdge.locator(':scope > *').all();
        expect(cellEdgeChildren.length).toBe(1);

        const inner = cellEdgeChildren[0];
        expect(await inner.evaluate(node => node.tagName.toLowerCase() === 'svg')).toBe(true);

        const ariaLabel = await inner.getAttribute('aria-label');
        if (ariaLabel === 'Equal') {
          gridConstraints.push({ cell1Index: i, cell2Index: cell2Index, constraint: 'same' });
        } else {
          gridConstraints.push({ cell1Index: i, cell2Index: cell2Index, constraint: 'different' });
        }
      }
    }

    const cellContentChildren = await cellContent.locator(':scope > *').all();
    expect(cellContentChildren.length).toBe(1);

    const inner = cellContentChildren[0];
    expect(await inner.evaluate(node => node.tagName.toLowerCase() === 'svg')).toBe(true);

    const classList = await inner.getAttribute('class') || '';
    const ariaLabel = await inner.getAttribute('aria-label');

    if (classList.includes('lotka-cell-empty')) {
      gridRow.push('E');
    } else if (ariaLabel === 'Sun') {
      gridRow.push('S');
    } else if (ariaLabel === 'Moon') {
      gridRow.push('M');
    } else {
      expect(false).toBe(true);
    }
    if (gridRow.length === cols) {
      grid.push(gridRow);
      gridRow = [];
    }
  }

  return { rows, cols, grid, gridConstraints };
}

async function clickBasedOnGrid(frame: FrameLocator, grid: string[][]) {
  const { rows, cols } = await getRowsAndColumns(frame);

  const cells = await frame.locator('div.lotka-cell').all();
  expect(cells.length).toBe(rows * cols);

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const cellClassList = await cell.getAttribute('class') || '';
    if (cellClassList.includes('lotka-cell--locked')) continue;

    const [i1, j1] = [Math.floor(i / rows), i % cols];
    await cell.click();
    if (grid[i1][j1] === 'M') {
      await cell.click();
    }
  }
}

test('Play Tango', async ({ page }) => {
  await page.goto('https://www.linkedin.com/games/');
  await page.getByRole('link', { name: 'Harmonize the grid. Tango' }).click();
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Start game' }).click();
  await page.locator('iframe[title="games"]').contentFrame().getByRole('button', { name: 'Dismiss' }).click();
  const frame = page.frameLocator('iframe.game-launch-page__iframe');

  const info = await getGridInfo(frame);
  const grid = info.grid;
  const gridConstraints = info.gridConstraints;
  await solveTango(grid, gridConstraints);
  await clickBasedOnGrid(frame, grid);

  await expect(page.locator('iframe[title="games"]').contentFrame().getByText('You’re crushing it!')).toBeVisible();
  const solvedText = await page.locator('iframe[title="games"]').contentFrame().getByText('Solved in 0:').textContent();
  if (solvedText) {
    console.log(solvedText.trim());
  }
});
