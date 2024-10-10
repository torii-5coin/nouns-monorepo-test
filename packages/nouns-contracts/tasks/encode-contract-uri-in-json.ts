import { task } from 'hardhat/config';
import ContractUri from '../contract-uri.json'
task('encode-contract-uri-in-json', 'Show the contractURI encoded in base64').setAction(async ({}, {}) => {
    console.log(
        'data:application/json;' +
        Buffer.from(JSON.stringify(ContractUri)).toString('base64')
    )
});
