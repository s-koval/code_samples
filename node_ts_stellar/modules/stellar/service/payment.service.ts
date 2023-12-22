import { Api404Error } from '../../../helper/error';
import StellarSdk, {server} from '../../../lib/stellar/api';
import clientCMC from './helpers/connect';
import currencyList from './helpers/currencyList';

export const paymentService = {
  assetBuilder : function( code: string, issuer: string ) {
    if ( code === 'XLM' ) {
    return StellarSdk.Asset.native();
  } else {
    return new StellarSdk.Asset( code, issuer );
  }
  },
  findStrictReceivePaymentPaths : async function( data: any ) {
    const { sourceAsset, destinationAmount, destinationAsset } = data;
  const options = {
    amount:           destinationAmount,
    destinationAsset: this.assetBuilder( destinationAsset?.code, destinationAsset?.issuer ),
    sourceAsset:      this.assetBuilder( sourceAsset?.code, sourceAsset?.issuer ),
  };

  const paths = await server.strictReceivePaths(
    [options.sourceAsset],
    options.destinationAsset,
    options.amount )
    .call();
    console.log('paths', paths)
  return paths;
  },
  findCryptoCurrency: async function ( symbol: string ) {
    try {
      const { data: { data } } = await clientCMC.get( `/v1/cryptocurrency/map?symbol=${ symbol.toUpperCase() }` );
      // return data[symbol.toUpperCase()][0];
      return data?.[0];
    } catch ( e ) {
      console.log( e );
      throw e;
    }
  },
  getExchangeRate: async function ( currency : string, convertCurrency : string, amount : string ) {

    const id = currencyList[currency.toUpperCase()];
    const convertId = currencyList[convertCurrency.toUpperCase()];
  
    const values = {
      id, convertId,
    };
  
    if ( !id ) {
      const cryptoCurrency = await this.findCryptoCurrency( currency );
      if ( !cryptoCurrency ) throw new Api404Error( `Unsupported currency : ${ currency }`, 404 );
      values.id = cryptoCurrency?.id;
    }
    if ( !convertId ) {
      const cryptoCurrency = await this.findCryptoCurrency( convertCurrency );
      if ( !cryptoCurrency ) throw new Api404Error( `Unsupported currency: ${ convertCurrency }`, 404 );
      values.convertId = cryptoCurrency?.id;
    }
  
    const { data } = await clientCMC.get( `/v2/cryptocurrency/quotes/latest?id=${ values.id }&convert_id=${ values.convertId }` );
    const price = data?.data[values.id]?.quote[values.convertId]?.price;
  
    return {
      amount:   (+amount * price).toFixed( 7 ),
      currency: convertCurrency,
    };
  }
}