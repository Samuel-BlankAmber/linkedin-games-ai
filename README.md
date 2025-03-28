# LinkedIn Games AI

## Overview

This project uses Playwright to automate the solving of LinkedIn games. I do not encourage tarnishing the sanctity of LinkedIn games, so I highly recommend against running this on your main account.

## Usage

Add `OPENAI_API_KEY` to `src/.env`

```bash
cd src
npm install
npx playwright install
npm start
```

## Costs

Solving some games relies on the OpenAI API, so naturally costs will be incurred. `gpt-4o-mini` is used so costs are minimal (at the expense of accuracy). While developing this I ran the tests quite a lot and it only costed me 4 cents (`$0.04`).

## How does it work?

### Tango

The game can be expressed as a set of constraints, which Z3 Theorem Prover can be used to solve.

### Queens

The game can be expressed as a set of constraints, which Z3 Theorem Prover can be used to solve.

### Pinpoint

Solved using OpenAI API.

### Crossclimb

Solved using OpenAI API. This is the most temperamental one because prompt engineering is hard and draggers are annoying.

### Zip

The game can be expressed as a set of constraints, which Z3 Theorem Prover can be used to solve.

## TODO

- The Tango solver assumes constraint divs use `lotka-cell-edge--right` which may not always be true
- The Crossclimb solver uses an unoptimal algorithm for computing which words to drag
- The Crossclimb solver uses an inefficient page timeout before dragging words
- Make everything faster (?)
