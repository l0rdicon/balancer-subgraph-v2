import { Swap, BatchSwap, BatchSwapRoute } from '../../types/schema';

/**
 * We make the assumption that token+amount will always create a unique ID.
 * This should work in almost all cases, but has a chance to create false positives.
 * Since the output of a hop will always be the input of the next swap, we leverage this relationship below
 */
export function updateBatchSwap(swap: Swap): void {
  let batchSwap = getBatchSwap(swap);
  let swaps = batchSwap.swaps.map((swap) => Swap.load(swap)!);
  let startSwaps = getBatchStartSwaps(swaps);

  for (let i = 0; i < startSwaps.length; i++) {
    let routeSwaps = getRouteSwapsForStartSwap(startSwaps[i], swaps);
    updateBatchSwapRoute(batchSwap, routeSwaps);
  }
}

function getBatchSwap(swap: Swap): BatchSwap {
  //since every swap in this batch will have the same tx, it is safe to use it as the ID
  let id = swap.tx.toHexString();
  let batchSwap = BatchSwap.load(id);

  if (batchSwap) {
    return batchSwap;
  }

  batchSwap = new BatchSwap(swap.tx.toHexString());
  batchSwap.timestamp = swap.timestamp;
  batchSwap.tokenIn = swap.tokenIn.toHexString();
  batchSwap.tokenOut = swap.tokenOut.toHexString();
  batchSwap.tokenAmountIn = swap.tokenAmountIn;
  batchSwap.tokenAmountOut = swap.tokenAmountOut;
  batchSwap.user = swap.userAddress;
  batchSwap.swaps = [];
  batchSwap.save();

  return batchSwap;
}

function updateBatchSwapRoute(batchSwap: BatchSwap, routeSwaps: Swap[]): void {
  let keyIn = getKeyInForSwap(routeSwaps[0]);
  let batchRoute = BatchSwapRoute.load(batchSwap.id + keyIn);
  let startSwap = routeSwaps[0];
  let endSwap = routeSwaps[routeSwaps.length - 1];

  if (!batchRoute) {
    batchRoute = new BatchSwapRoute(batchSwap.id + keyIn);
    batchRoute.batchSwap = batchRoute.id;
  }

  batchRoute.tokenIn = startSwap.tokenIn.toHexString();
  batchRoute.tokenOut = endSwap.tokenOut.toHexString();
  batchRoute.tokenAmountIn = startSwap.tokenAmountIn;
  batchRoute.tokenAmountOut = endSwap.tokenAmountOut;
  batchRoute.valueUSD = startSwap.valueUSD;
  batchRoute.swaps = routeSwaps.map((swap) => swap.id);
  batchRoute.save();
}

function getBatchStartSwaps(swaps: Swap[]): Swap[] {
  let startSwaps: Swap[] = [];
  let keysIn = swaps.map((swap) => getKeyInForSwap(swap));
  let keysOut = swaps.map((swap) => getKeyOutForSwap(swap));

  for (let i = 0; i < keysIn.length; i++) {
    //if the key does not exist as a key out, then it is a start swap
    if (!keysOut.includes(keysIn[i])) {
      startSwaps.push(swaps[i]);
    }
  }

  return startSwaps;
}

function getRouteSwapsForStartSwap(startSwap: Swap, swaps: Swap[]): Swap[] {
  let finished = false;
  //the start swap is the first swap in this route
  let routeSwaps: Swap[] = [startSwap];

  while (!finished) {
    //the next swap in this route is the swap with tokenIn+amount = tokenOut+amount of the previous swap
    let nextSwap = getNextSwapInRoute(routeSwaps[routeSwaps.length - 1], swaps);

    if (nextSwap) {
      routeSwaps.push(nextSwap);
    }

    //if no next swap, we're finished
    //we set a bail out condition if the routeSwaps contains all of ths swaps
    if (nextSwap === null || routeSwaps.length >= swaps.length + 1) {
      finished = true;
    }
  }

  return routeSwaps;
}

//match on any swap where the keyIn matches the keyOut of the current swap
function getNextSwapInRoute(current: Swap, swaps: Swap[]): Swap | null {
  let keyOut = getKeyOutForSwap(current);
  const match = swaps.find((swap) => getKeyInForSwap(swap) === keyOut);

  return match || null;
}

//Since the amount out is always the exact same as the amount in on a hop, we use this relationship to generate
//keys for both sides of the swap that we can match to other swaps in the batch
function getKeyInForSwap(swap: Swap): string {
  return swap.tokenIn.toHexString() + swap.tokenAmountIn.toString();
}

function getKeyOutForSwap(swap: Swap): string {
  return swap.tokenOut.toHexString() + swap.tokenAmountOut.toString();
}
