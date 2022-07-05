import { BondOffer, HumanizedBondOffer } from "@dev-test/types";
import { ApiPromise } from "@polkadot/api";

export function toBondOffer(api: ApiPromise, offer: HumanizedBondOffer): BondOffer {
    const maturity = offer.maturity === "Infinite" ? offer.maturity :
    { Finite: { returnIn: api.createType("u32", offer.maturity.Finite.returnIn) } }

    return {
        asset: api.createType("u128", offer.asset),
        bondPrice: api.createType("u128", offer.bondPrice),
        nbOfBonds: api.createType("u128", offer.nbOfBonds),
        maturity: maturity,
        reward: {
            asset: api.createType("", offer.reward.asset),
            amount: api.createType("", offer.reward.amount),
            maturity: api.createType("", offer.reward.maturity),
        }
    }
}