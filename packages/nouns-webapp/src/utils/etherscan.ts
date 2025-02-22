import { ChainId } from '@usedapp/core';
import { CHAIN_ID, ChainId_Sepolia, ChainId_Holesky, ETHERSCAN_API_KEY } from '../config';

const getBaseURL = (network: ChainId | number) => {
  switch (network) {
    case ChainId.Goerli:
      return 'https://goerli.etherscan.io/';
    case ChainId.Sepolia:
      return 'https://sepolia.etherscan.io/';
    case ChainId_Holesky:
      return 'https://holesky.etherscan.io/';
    default:
      return 'https://etherscan.io/';
  }
};

const BASE_URL = getBaseURL(CHAIN_ID);

export const buildEtherscanTxLink = (txHash: string): string => {
  const path = `tx/${txHash}`;
  return new URL(path, BASE_URL).toString();
};

export const buildEtherscanAddressLink = (address: string): string => {
  const path = `address/${address}`;
  return new URL(path, BASE_URL).toString();
};

export const buildEtherscanTokenLink = (tokenContractAddress: string, tokenId: number): string => {
  const path = `token/${tokenContractAddress}?a=${tokenId}`;
  return new URL(path, BASE_URL).toString();
};

export const buildEtherscanHoldingsLink = (address: string): string => {
  const path = `tokenholdings?a=${address}`;
  return new URL(path, BASE_URL).toString();
};

const getApiBaseURL = (network: number) => {
  switch (network) {
    case ChainId.Goerli:
      return 'https://api-goerli.etherscan.io/';
    case ChainId_Sepolia:
      return 'https://api-sepolia.etherscan.io/';
    case ChainId_Holesky:
      return 'https://api-holesky.etherscan.io/';
    default:
      return 'https://api.etherscan.io/';
  }
};

const API_BASE_URL = getApiBaseURL(CHAIN_ID);

export const buildEtherscanApiQuery = (
  address: string,
  module = 'contract',
  action = 'getsourcecode',
): string => {
  const params = new URLSearchParams({
    module,
    action,
    address,
    apikey: ETHERSCAN_API_KEY,
  });
  const path = `api?${params.toString()}`;
  return new URL(path, API_BASE_URL).toString();
};
