import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { BigNumber } from "bignumber.js";
import { DECIMALS, mintAssetsToWallets } from "./pallets/assets/extrinsics";
import {
  addFundstoThePool,
  createConstantProductPool,
  createLiquidityBootstrappingPool,
  createStableSwapPool,
  enableTwap,
  swapTokenPairs,
} from "./pallets/pablo/extrinsics";
import { sendWait } from "./utils/polkadot";

export const setupLBP = async (
  api: ApiPromise,
  walletSudo: KeyringPair,
  walletMe: KeyringPair
) => {
  // Base Asset is PICA and Quote Asset is KUSD
  let baseAssetId = 1;
  let quoteAssetId = 129;

  // Mint 999999 PICA and KUSD
  await mintAssetsToWallets(api, [walletSudo, walletMe], walletSudo, [
    quoteAssetId,
    baseAssetId,
  ]);

  // 1.00 % owner fee for the pool
  const defaultFeeRate = 10000;

  // Create LBP with Max Sale Duration
  const createLBP = await createLiquidityBootstrappingPool(
    api,
    walletSudo,
    baseAssetId,
    quoteAssetId,
    {
      feeRate: defaultFeeRate,
      ownerFeeRate: defaultFeeRate,
      protocolFeeRate: defaultFeeRate,
    },
    18000,
    75,
    25,
    15
  );
  const createRes: any = createLBP.data.toJSON();
  console.log("LBP Pool Created: ", createLBP.data.toJSON());

  // Add Liquidity to the Pool
  const baseAssetAmount = new BigNumber("100000").times(DECIMALS);
  const quoteAssetAmount = new BigNumber("100000").times(DECIMALS);
  const addLiqRes = await addFundstoThePool(
    api,
    walletSudo,
    createRes && createRes.length ? createRes[0] : 0,
    baseAssetAmount.toString(),
    quoteAssetAmount.toString()
  );
  console.log("LBP Liquidity Added: ", addLiqRes.data.toHuman());

  // Register in DEX Router
  let picaKusdRoute = api.createType(
    "ComposableTraitsDefiCurrencyPairCurrencyId",
    {
      base: api.createType("u128", baseAssetId),
      quote: api.createType("u128", quoteAssetId),
    }
  );

  const kusdPicaRouteRes = await sendWait(
    api,
    api.tx.sudo.sudo(
      api.tx.dexRouter.updateRoute(picaKusdRoute, [
        createRes && createRes.length ? createRes[0] : 0,
      ])
    ),
    walletSudo
  );

  console.log(kusdPicaRouteRes.toHuman());
};

export const setupCpp = async (
  api: ApiPromise,
  walletSudo: KeyringPair,
  walletMe: KeyringPair,
  baseAssetId = 1,
  quoteAssetId = 129
): Promise<number> => {
  // Mint 999999 PICA and KUSD
  await mintAssetsToWallets(api, [walletSudo, walletMe], walletSudo, [
    quoteAssetId,
    baseAssetId,
  ]);

  // 1.00 % owner fee for the pool
  const ownerFee = 10000;
  const createCpp = await createConstantProductPool(
    api,
    walletSudo,
    baseAssetId,
    quoteAssetId,
    ownerFee,
  );
  const createRes: any = createCpp.data.toJSON();
  console.log("UniswapCPP Pool Created: ", createRes);

  const poolId: number = createRes[0];
  await enableTwap(api, walletSudo, poolId);

  // Add Liquidity to the Pool
  const baseAssetAmount = new BigNumber("999999").times(DECIMALS);
  const quoteAssetAmount = new BigNumber("999999").times(DECIMALS);

  const addLiqRes = await addFundstoThePool(
    api,
    walletSudo,
    createRes && createRes.length ? createRes[0] : 0,
    baseAssetAmount.toString(),
    quoteAssetAmount.toString()
  );
  console.log("UniswapCPP Liquidity Added: ", addLiqRes.data.toHuman());

  // Register in DEX Router
  let routeParams = api.createType(
    "ComposableTraitsDefiCurrencyPairCurrencyId",
    {
      base: api.createType("u128", baseAssetId),
      quote: api.createType("u128", quoteAssetId),
    }
  );

  const dexRoute = await sendWait(
    api,
    api.tx.sudo.sudo(
      api.tx.dexRouter.updateRoute(routeParams, [
        createRes && createRes.length ? createRes[0] : 0,
      ])
    ),
    walletSudo
  );

  console.log(dexRoute.toHuman());

  return Promise.resolve(poolId);
};

export const doSwaps = async (
    api: ApiPromise,
    walletSudo: KeyringPair,
    poolId: number,
    amount: number,
    baseAssetId: number,
    quoteAssetId: number
) => {
  // Base Asset is KSM and Quote Asset is KUSD

  for (let i = 1; i <= amount; i++) {
    await swapTokenPairs(api, walletSudo, poolId, baseAssetId, quoteAssetId,  10 ** 12);
  }
}

export const setupStableSwap = async (
  api: ApiPromise,
  walletSudo: KeyringPair,
  walletMe: KeyringPair
) => {
  // Base Asset is KSM and Quote Asset is KUSD
  let baseAssetId = 1;
  let quoteAssetId = 129;

  // Mint 999999 PICA and KSM
  await mintAssetsToWallets(api, [walletSudo, walletMe], walletSudo, [
    quoteAssetId,
    baseAssetId,
  ]);

  // 1.00 % owner fee for the pool
  const ownerFee = 10000;
  const amplificationCoEfficient = 10000;

  const createStableSwap = await createStableSwapPool(
    api,
    walletSudo,
    baseAssetId,
    quoteAssetId,
    amplificationCoEfficient,
    ownerFee
  );
  const createRes: any = createStableSwap.data.toJSON();
  console.log("StableSwap Pool Created: ", createRes);

  // Add Liquidity to the Pool
  const baseAssetAmount = new BigNumber("10000").times(DECIMALS);
  const quoteAssetAmount = new BigNumber("10000").times(DECIMALS);

  const addLiqRes = await addFundstoThePool(
    api,
    walletSudo,
    createRes && createRes.length ? createRes[0] : 0,
    baseAssetAmount.toString(),
    quoteAssetAmount.toString()
  );
  console.log("StableSwap Liquidity Added: ", addLiqRes.data.toHuman());

  // Register in DEX Router
  let KsmKusdRoute = api.createType(
    "ComposableTraitsDefiCurrencyPairCurrencyId",
    {
      base: api.createType("u128", baseAssetId),
      quote: api.createType("u128", quoteAssetId),
    }
  );

  const kusdPicaRouteRes = await sendWait(
    api,
    api.tx.sudo.sudo(
      api.tx.dexRouter.updateRoute(KsmKusdRoute, [
        createRes && createRes.length ? createRes[0] : 0,
      ])
    ),
    walletSudo
  );

  console.log(kusdPicaRouteRes.toHuman());
};

export const setupPablo = async (
  api: ApiPromise,
  walletSudo: KeyringPair,
  _walletUser: KeyringPair
) => {
  await setupLBP(api, walletSudo, _walletUser);
  await setupStableSwap(api, walletSudo, _walletUser);
  return;
};


export const setupSwaps = async (
  api: ApiPromise,
  walletSudo: KeyringPair,
  _walletUser: KeyringPair
) => {
  const poolId = await setupCpp(api, walletSudo, _walletUser);
  await doSwaps(api, walletSudo, poolId, 10, 1, 129);

  // await setupStableSwap(api, walletSudo, _walletUser);
  return;
};