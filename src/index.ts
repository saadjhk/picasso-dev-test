require('dotenv').config()
import Keyring from '@polkadot/keyring'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { ethers } from "ethers";
import { ApiPromise, WsProvider } from "@polkadot/api";
import * as definitions from "../interfaces/definitions";
import { hexToU8a } from '@polkadot/util';
import { setupPablo } from './pablo';
import { mintAssetsToAddress } from './pallets/assets/extrinsics';
import fs from "fs";

const createBlock = async (apiPromise: ApiPromise, count: number) => {
  if (count <= 0) return
  const blockToMine = await apiPromise.rpc.engine.createBlock(true, true)
  console.log(blockToMine.toHuman())
  if (count > 0) createBlock(apiPromise, count - 1)
}

const main = async () => {
  await cryptoWaitReady()
  const kr = new Keyring({ type: 'sr25519' })
  const myDot1 = kr.addFromMnemonic(
    process.env.DOT_MNEMONIC ? process.env.DOT_MNEMONIC : '',
  )
  const myDot2 = kr.addFromMnemonic(
    process.env.DOT_MNEMONIC1 ? process.env.DOT_MNEMONIC1 : '',
  )
  const walletSudo = kr.addFromSeed(hexToU8a(process.env.SUDO_MNEMONIC))
  // const walletSudo = kr.addFromUri('//Alice') // alice
  const myEth1 = new ethers.Wallet(process.env.ETH_PK ? process.env.ETH_PK : '')
  const myEth2 = new ethers.Wallet(
    process.env.ETH_PK1 ? process.env.ETH_PK1 : '',
  )

  const rpc = Object.keys(definitions)
      .filter(k => {
        if (!(definitions as any)[k].rpc) {
          return false;
        } else {
          return Object.keys((definitions as any)[k].rpc).length > 0
        }
      })
      .reduce((accumulator, key) => ({ ...accumulator, [key]: (definitions as any)[key].rpc }), {});
  const types = Object.keys(definitions).filter((key) => Object.keys((definitions as any)[key].types).length > 0).reduce((accumulator, key) => ({ ...accumulator, ...(definitions as any)[key].types }), {});

  const provider = new WsProvider(process.env.PICASSO_RPC_URL || '', 1000);

  const api = await ApiPromise.create({ provider, types, rpc });
  await api.isReady

  // console.log(walletSudo.publicKey.toString())
  // await mintAssetsToAddress(api, [
    // "5w53mgBc2w2kNQZgFBaYT5h79cQQNfv8vUuoa85zUe5VxBvQ",
    // "5tirEmQwRYbyadq5QrrFvnPNBPf4WLXsh97qHJUqcqMADDQ9",
    // "5z3wa9ojQra3HqeJthg9Q6hQnsRDsUgH6DC7ZXkb7YXofh3m",
    // "5uxGz8eZmbjvVBMpun9nvQ3G8s5cWD5xHnzgU6SHyAnJf9Vy",
    // "5vVWqFFPg258rCUy1HabDSf6z1bnRbKeDWKYF3XrVLvk3nEc",
    // "5vVWqFFPg258rCUy1HabDSf6z1bnRbKeDWKYF3XrVLvk3nEc"
    // "5ygiZBBgoTEjJqu3hpTQAw9oqaoEaz9eSJUBYGoTguG2qsQ3" // mine
  // ], walletSudo, [1,4,129])
  // await setupPablo(api, walletSudo, myDot1);
  fs.writeFileSync('dalisudo.json',JSON.stringify(walletSudo.toJson('12345678')))
  process.exit(0);
}

cryptoWaitReady().then(() => {
  main().catch((err) => {
    console.error(err.message)
    // process.exit(0);
  })
})
