const { init } = require('z3-solver');

export interface GridConstraint {
  cell1Index: number;
  cell2Index: number;
  constraint: 'same' | 'different';
}

export async function solveTango(grid: string[][], gridConstraints: GridConstraint[]) {
  const { Context } = await init();
  const { Solver, Int, Or, Not, Sum } = new Context('main');

  const gridMapped = grid.map(row => row.map(cell => cell === 'E' ? 0 : cell === 'S' ? 1 : -1));
  const numRows = gridMapped.length;
  const numCols = gridMapped[0].length;
  const gridZ3 = Array.from({ length: numRows }, (_, i) => Array.from({ length: numCols }, (_, j) => Int.const(`cell_${i}_${j}`)));
  const solver = new Solver();

  for (let i = 0; i < numRows; i++) {
    solver.add(Sum(...gridZ3[i]).eq(0));
    for (let j = 0; j < numCols; j++) {
      if (gridMapped[i][j] !== 0) {
        solver.add(gridZ3[i][j].eq(gridMapped[i][j]));
      }
      solver.add(Or(gridZ3[i][j].eq(1), gridZ3[i][j].eq(-1)))
    }
  }

  for (let j = 0; j < numCols; j++) {
    const column = gridZ3.map(row => row[j]);
    solver.add(Sum(...column).eq(0));
  }

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols - 2; j++) {
      const window = Array.from({ length: 3 }, (_, k) => gridZ3[i][j + k]);
      solver.add(Not(window[0].eq(1).and(window[1].eq(1)).and(window[2].eq(1))));
      solver.add(Not(window[0].eq(-1).and(window[1].eq(-1)).and(window[2].eq(-1))));
    }
  }

  for (let j = 0; j < numCols; j++) {
    for (let i = 0; i < numRows - 2; i++) {
      const window = Array.from({ length: 3 }, (_, k) => gridZ3[i + k][j]);
      solver.add(Not(window[0].eq(1).and(window[1].eq(1)).and(window[2].eq(1))));
      solver.add(Not(window[0].eq(-1).and(window[1].eq(-1)).and(window[2].eq(-1))));
    }
  }


  for (const { cell1Index, cell2Index, constraint } of gridConstraints) {
    const [i1, j1] = [Math.floor(cell1Index / numCols), cell1Index % numCols];
    const [i2, j2] = [Math.floor(cell2Index / numCols), cell2Index % numCols];
    if (constraint === 'same') {
      solver.add(gridZ3[i1][j1].eq(gridZ3[i2][j2]));
    } else {
      solver.add(gridZ3[i1][j1].neq(gridZ3[i2][j2]));
    }
  }

  const result = await solver.check();
  if (result === 'sat') {
    const model = solver.model();
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        const cellValue = model.eval(gridZ3[i][j], true).value();
        grid[i][j] = cellValue === 0n ? 'E' : cellValue === 1n ? 'S' : 'M';
      }
    }
  } else {
    throw new Error('Unsatisfiable');
  }
}
