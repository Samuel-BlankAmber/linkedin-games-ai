const { init } = require('z3-solver');

export interface Position {
  row: number;
  col: number;
}

export interface Wall {
  start: Position;
  end: Position;
}

export async function solveZip(grid: number[][], walls: Wall[]): Promise<number[][]> {
  const { Context } = await init();
  const { Solver, Int, Or, And } = new Context('main');

  const numRows = grid.length;
  const numCols = grid[0].length;
  const gridZ3 = Array.from({ length: numRows }, (_, i) => Array.from({ length: numCols }, (_, j) => Int.const(`cell_${i}_${j}`)));
  const solver = new Solver();

  const numberPositions: Record<number, Position> = {};
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      const cellZ3 = gridZ3[i][j];
      solver.add(cellZ3.ge(1), cellZ3.le(numRows * numCols));

      const value = grid[i][j];
      if (value > 0) {
        numberPositions[value] = { row: i, col: j };
      }
    }
  }

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (numberPositions[1].row === i && numberPositions[1].col === j) continue;

      const cellZ3 = gridZ3[i][j];
      const adjacentCellsZ3 = [];
      if (i > 0) {
        adjacentCellsZ3.push(gridZ3[i - 1][j]);
      }
      if (i < numRows - 1) {
        adjacentCellsZ3.push(gridZ3[i + 1][j]);
      }
      if (j > 0) {
        adjacentCellsZ3.push(gridZ3[i][j - 1]);
      }
      if (j < numCols - 1) {
        adjacentCellsZ3.push(gridZ3[i][j + 1]);
      }
      solver.add(Or(...adjacentCellsZ3.map(adj => adj.add(1).eq(cellZ3))));
    }
  }

  const sortedNumbers = Object.keys(numberPositions).map(Number).sort((a, b) => a - b);
  const biggestNumber = sortedNumbers[sortedNumbers.length - 1];
  for (const number of sortedNumbers) {
    const { row, col } = numberPositions[number];
    const cellZ3 = gridZ3[row][col];

    if (number === 1) {
      solver.add(cellZ3.eq(1));
    } else if (number === biggestNumber) {
      solver.add(cellZ3.eq(numRows * numCols));
    } else if (number > 1) {
      const prevNumber = number - 1;
      const { row: prevRow, col: prevCol } = numberPositions[prevNumber];
      const prevCellZ3 = gridZ3[prevRow][prevCol];

      solver.add(cellZ3.gt(prevCellZ3));
    } else {
      throw new Error(`Invalid number: ${number}`);
    }
  }

  for (const wall of walls) {
    const { start, end } = wall;
    const startZ3 = gridZ3[start.row][start.col];
    const endZ3 = gridZ3[end.row][end.col];
    solver.add(And(startZ3.neq(endZ3.add(1)), startZ3.neq(endZ3.sub(1))));
  }

  const result = await solver.check();
  if (result === 'sat') {
    const model = solver.model();
    const solution: number[][] = Array.from({ length: numRows }, () => Array(numCols).fill(0));
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        const cellValue = model.eval(gridZ3[i][j], true).value();
        solution[i][j] = Number(cellValue);
      }
    }
    return solution;
  } else {
    throw new Error('Unsatisfiable');
  }
}
