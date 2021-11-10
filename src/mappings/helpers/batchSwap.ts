import { BatchSwap, BatchSwapRoute, Swap } from '../../types/schema';
import { ZERO_BD } from './constants';

/**
 * We make the assumption that token+amount will always create a unique ID.
 * This should work in almost all cases, but has a chance to create false positives.
 * Since the output of a hop will always be the input of the next swap, we leverage this relationship below
 */
export function updateBatchSwap(swap: Swap): void {
  let batchSwap = getBatchSwap(swap);
  let swaps = getSwapsForBatchSwap(batchSwap);
  let startSwaps = getBatchStartSwaps(swaps);
  let valueUSD = ZERO_BD;
  let batchSwapRoutes: string[] = [];

  for (let i = 0; i < startSwaps.length; i++) {
    let routeSwaps = getRouteSwapsForStartSwap(startSwaps[i], swaps);
    let batchSwapRoute = updateBatchSwapRoute(batchSwap, routeSwaps);

    batchSwapRoutes.push(batchSwapRoute.id);
    valueUSD = valueUSD.plus(batchSwapRoute.valueUSD);
  }

  batchSwap.valueUSD = valueUSD;
  batchSwap.routes = batchSwapRoutes;
  batchSwap.save();
}

function getBatchSwap(swap: Swap): BatchSwap {
  //since every swap in this batch will have the same tx, it is safe to use it as the ID
  let id = swap.tx.toHexString();
  let batchSwap = BatchSwap.load(id);

  if (batchSwap) {
    let swaps = batchSwap.swaps;
    swaps.push(swap.id);

    batchSwap.swaps = swaps;

    return batchSwap;
  }

  batchSwap = new BatchSwap(swap.tx.toHexString());
  batchSwap.user = swap.userAddress;
  batchSwap.valueUSD = ZERO_BD;
  batchSwap.timestamp = swap.timestamp;
  batchSwap.swaps = [swap.id];
  batchSwap.routes = [];

  return batchSwap;
}

function updateBatchSwapRoute(batchSwap: BatchSwap, routeSwaps: Swap[]): BatchSwapRoute {
  let keyIn = getKeyInForSwap(routeSwaps[0]);
  let batchRoute = BatchSwapRoute.load(batchSwap.id + keyIn);
  let startSwap = routeSwaps[0];
  let endSwap = routeSwaps[routeSwaps.length - 1];
  let swapIds: string[] = [];

  if (!batchRoute) {
    batchRoute = new BatchSwapRoute(batchSwap.id + keyIn);
    batchRoute.batchSwap = batchSwap.id;
  }

  for (let i = 0; i < routeSwaps.length; i++) {
    swapIds.push(routeSwaps[i].id);
  }

  batchRoute.tokenIn = startSwap.tokenIn.toHexString();
  batchRoute.tokenOut = endSwap.tokenOut.toHexString();
  batchRoute.tokenAmountIn = startSwap.tokenAmountIn;
  batchRoute.tokenAmountOut = endSwap.tokenAmountOut;
  batchRoute.timestamp = startSwap.timestamp;
  //TODO: it may be more accurate to take the average of each swap in the route
  batchRoute.valueUSD = startSwap.valueUSD;
  batchRoute.swaps = swapIds;
  batchRoute.save();

  return batchRoute;
}

function getBatchStartSwaps(swaps: Swap[]): Swap[] {
  let startSwaps: Swap[] = [];
  let keysIn: string[] = [];
  let keysOut: string[] = [];

  for (let i = 0; i < swaps.length; i++) {
    keysIn.push(getKeyInForSwap(swaps[i]));
    keysOut.push(getKeyOutForSwap(swaps[i]));
  }

  for (let i = 0; i < keysIn.length; i++) {
    //if the keyIn does not exist as a key out, then it is a start swap
    if (keysOut.indexOf(keysIn[i]) === -1) {
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
  let match: Swap | null = null;

  for (let i = 0; i < swaps.length; i++) {
    let keyIn = getKeyInForSwap(swaps[i]);
    if (keyIn == keyOut) {
      match = swaps[i];
      break;
    }
  }

  return match;
}

function getSwapsForBatchSwap(batchSwap: BatchSwap): Swap[] {
  let swaps: Swap[] = [];

  for (let i = 0; i < batchSwap.swaps.length; i++) {
    let swap = Swap.load(batchSwap.swaps[i]);

    if (swap) {
      swaps.push(swap);
    }
  }

  return swaps;
}

//Since the amount out is always the exact same as the amount in on a hop, we use this relationship to generate
//keys for both sides of the swap that we can match to other swaps in the batch
function getKeyInForSwap(swap: Swap): string {
  return swap.tokenIn.toHexString() + swap.tokenAmountIn.toString();
}

function getKeyOutForSwap(swap: Swap): string {
  return swap.tokenOut.toHexString() + swap.tokenAmountOut.toString();
}
