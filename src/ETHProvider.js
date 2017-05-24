import CurrencyInfoProvider from './CurrencyInfoProvider';

/* global _ */

const TRANSACTIONS_TO_RETRIEVE = 1000;

class ETHProvider extends CurrencyInfoProvider {

    initialize(callback, callbackError) {
        super.initialize();

        this.get('https://etherchain.org/api/basic_stats')
            .then((response) => {
                let data = JSON.parse(response);

                this.price = data.data.price.usd;
                this.lastBlock = data.data.blockCount.number;

                callback && callback(this.price);
            })
            .catch((err) => {
                callbackError && callbackError();
                console.warn('Cannot retrieve basic ETH info!');
            });
    }

    getCurrencyName = () => 'ETH';

    getTransactionURL(tx) {
        return 'https://etherscan.io/tx/' + tx;
    };

    getLastTransactions(callback, callbackError) {
        this.get('https://etherchain.org/api/txs/0/' + TRANSACTIONS_TO_RETRIEVE)
            .then((response) => {
                let data = JSON.parse(response),
                    transactions = data.data,
                    result;

                result = _.chain(transactions)
                    .filter((tx) => {
                        return tx.amount > 0 && tx.gasUsed === 21000
                    })
                    .map((tx, index) => {
                        let amount = tx.amount / 1000000000000000000,
                            fee = tx.gasUsed * (tx.price / 1000000000000000000),
                            feeUSD = fee * this.price;

                        return {
                            id: tx.hash,
                            amount: amount,
                            amountUSD: amount * this.price,
                            gasUsed: tx.gasUsed,
                            gasPrice: tx.price / 1000000000000000000,
                            fee: fee,
                            feeUSD: feeUSD,
                            percentage: fee / (fee + amount) * 100
                        };
                    })
                    .value();

                callback && callback(result);
            })
            .catch((err) => {
                callbackError && callbackError();
                console.warn('Cannot retrieve latest ETH transactions!');
            });

    }
}

export default ETHProvider;
