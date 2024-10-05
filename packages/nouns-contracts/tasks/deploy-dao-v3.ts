import { default as NounsAuctionHouseABI } from '../abi/contracts/NounsAuctionHouse.sol/NounsAuctionHouse.json';
import { default as NounsDAOExecutorV2ABI } from '../abi/contracts/governance/NounsDAOExecutorV2.sol/NounsDAOExecutorV2.json';
import { default as NounsDaoDataABI } from '../abi/contracts/governance/data/NounsDAOData.sol/NounsDAOData.json';
import {ChainId, ContractDeployment, ContractDeploymentWithName, ContractNamesDAOV3, DeployedContract} from './types';
import { Interface, parseUnits } from 'ethers/lib/utils';
import { task, types } from 'hardhat/config';
import {BigNumber, constants} from 'ethers';
import promptjs from 'prompt';

promptjs.colors = false;
promptjs.message = '> ';
promptjs.delimiter = '';

const proxyRegistries: Record<number, string> = {
  [ChainId.Mainnet]: '0xa5409ec958c83c3f309868babaca7c86dcb077c1',
  [ChainId.Goerli]: '0x5d44754DE92363d5746485F31280E4c0c54c855c', // ProxyRegistryMock
  [ChainId.Sepolia]: '0x152E981d511F8c0865354A71E1cb84d0FB318470', // ProxyRegistryMock
};
const wethContracts: Record<number, string> = {
  [ChainId.Mainnet]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  [ChainId.Ropsten]: '0xc778417e063141139fce010982780140aa0cd5ab',
  [ChainId.Kovan]: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
  [ChainId.Goerli]: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  [ChainId.Sepolia]: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  [ChainId.Holesky]: '0x0014e5C0B28dfFFb02D0B1A7d6aE2eAEde19d577',
};

// *1: 再利用可能（参照される側なので使い回せる）
const deployedContracts: Record<ContractNamesDAOV3, string> = {
  NFTDescriptorV2: "0x85713edfc54E40EC0d3bC9af38Bf28cd4eB7B14e", // independent
  SVGRenderer: "0x81B9E78216Ba492bBF5a721709e988b6fA68A568", // independent
  NounsDescriptorV2: "0xE6cCc2725E83b9d16980e3c21d9504226c58D595", // depends on SVGRenderer, NFTDescriptorV2
  Inflator: "0xc8eCE48BeB342525aB8F19Ec25DF01a3943fa065", // independent
  NounsArt: "0x3adE90547C5a60172CF78330733315b4Ca7DE71b", // depends on NounsDescriptorV2, Inflator
  NounsSeeder: "0x520d319832cCB800B43c58B86Ae0F072410E0000", // independent
  NounsToken: "0x5787FB90eFc0a3e37aF3FD5F6BDaCA9F8a02D015", // depends on NounsDescriptorV2, NounsSeeder, proxyRegistryAddress
  NounsAuctionHouse: "0x6Edc790017111E959D5579675d85068a3eC5841c", // independent
  NounsAuctionHouseProxyAdmin: "0x7b50a5654cf87F2aa0677D1216F8ba193ff1787b", // independent
  NounsAuctionHouseProxy: "0x70C9686DAdCE27c91Dd0a89be51D3DBd9De6de23", // depdens on NounsAuctionHouse, NounsAuctionHouseProxyAdmin, NounsToken, args
  NounsDAOV3DynamicQuorum: "0x566599e3fCDe54717e3540F127Df10cc6fAAb5C5", // independent
  NounsDAOV3Admin: "0x02545E0F72e1B15877B442d8101BfaC07021f05F", // independent
  NounsDAOV3Proposals: "0x988f253CE5f372C1426cE8d19AF1FD60963Ae9C4", // independent
  NounsDAOV3Votes: "0x142f841900E67fb3F013c23C07102A13cb003ba5", // independent
  NounsDAOV3Fork: "0x98e4A12f4140fBd7543896043b878E7e92465dAD", // independent
  NounsDAOLogicV3: "0x69dea4b27AB2749C927cC6c9F666BC1605522f3A", // depends on NounsDAOV3Admin, NounsDAOV3DynamicQuorum, NounsDAOV3Proposals, NounsDAOV3Votes, NounsDAOV3Fork
  NounsDAOForkEscrow: "0xD0b4092c70fEB94931aDF843bf057df8baB1b4ef", //depends on NounsDAOProxyV3, NounsToken
  NounsTokenFork: "0x54eDe669FeBcA79d1ff7C9D486C0841b4785362F", // independent
  NounsAuctionHouseFork: "0x6bFA97455d0FB0d6271cd686760684464481fd8b", // independent
  NounsDAOLogicV1Fork: "0xdbb9582Ac25a18A52BC2DD32B74058Aa397be50B", // independent
  NounsDAOExecutorV2: "0xB5FED52A8b907Ab24cE5D64d25E11bd3B6bc686c", // independent
  NounsDAOExecutorProxy: "0x9ed9aF78ee112CE2778D9142C3a518379CCFE559", // depends on NounsDAOExecutorV2, NounsDAOProxyV3
  ForkDAODeployer: "0x3087570081a729355B893DbC3e3231e39ab60ca8", // depends on NounsTokenFork, NounsAuctionHouseFork, NounsDAOLogicV1Fork, NounsDAOExecutorV2
  NounsDAOProxyV3: "0x449ad0f89cA08E49813CcAB32519435581413afB", // depends on NounsDAOExecutorProxy, NounsToken, NounsDAOForkEscrow, ForkDAODeployer, args, NounsDAOLogicV3
  NounsDAOData: "0x7F72Dca919F64ad1b2A2236e1E75c55758Dc2290", // depends on NounsToken, NounsDAOProxyV3
  NounsDAODataProxy: "0xeD68fB4edB5B5b16b43D3046e7bade31711263A4", // depends on NounsDaoDataABI, NounsDAOExecutorProxy, args, NounsDAOProxyV3
}
task('deploy-dao-v3', 'Deploy all Nouns contracts with short gov times for testing')
  .addFlag('autoDeploy', 'Deploy all contracts without user interaction')
  .addOptionalParam('weth', 'The WETH contract address', undefined, types.string)
  .addOptionalParam('noundersdao', 'The nounders DAO contract address', undefined, types.string)
  .addOptionalParam(
    'auctionTimeBuffer',
    'The auction time buffer (seconds)',
    5 * 60 /* 5 minutes */,
    types.int,
  )
  .addOptionalParam(
    'auctionReservePrice',
    'The auction reserve price (wei)',
    1 /* 1 wei */,
    types.int,
  )
  .addOptionalParam(
    'auctionMinIncrementBidPercentage',
    'The auction min increment bid percentage (out of 100)',
    2 /* 2% */,
    types.int,
  )
  .addOptionalParam(
    'auctionDuration',
    'The auction duration (seconds)',
      60 * 60 * 24 /* 24 hours */,
    types.int,
  )
  .addOptionalParam(
      'timelockDelay',
      'The timelock delay (seconds)',
      60 * 60 * 24 * 2 /* 2 days */,
      types.int,
  )
  .addOptionalParam(
    'votingPeriod',
    'The voting period (blocks)',
    Math.round(4 * 60 * 24 * (60 / 13)) /* 4 days (13s blocks) */,
    types.int,
  )
  .addOptionalParam(
      'votingDelay',
      'The voting delay (blocks)',
      Math.round(3 * 60 * 24 * (60 / 13)) /* 3 days (13s blocks) */,
      types.int,
  )
  .addOptionalParam(
    'proposalThresholdBps',
    'The proposal threshold (basis points)',
    100 /* 1% */,
    types.int,
  )
  .addOptionalParam(
    'minQuorumVotesBPS',
    'Min basis points input for dynamic quorum',
    1_000,
    types.int,
  ) // Default: 10%
  .addOptionalParam(
    'maxQuorumVotesBPS',
    'Max basis points input for dynamic quorum',
    1_500,
    types.int,
  ) // Default: 40%
  .addOptionalParam(
    'quorumCoefficient',
    'Dynamic quorum coefficient (float)',
    1,
    types.float,
  )
  .addOptionalParam(
    'createCandidateCost',
    'Data contract proposal candidate creation cost in wei',
    100000000000000, // 0.0001 ether
    types.int,
  )
  .addOptionalParam(
    'updateCandidateCost',
    'Data contract proposal candidate update cost in wei',
    0,
    types.int,
  )
  .setAction(async (args, { ethers }) => {
    const network = await ethers.provider.getNetwork();
    const [deployer] = await ethers.getSigners();

    // prettier-ignore
    const proxyRegistryAddress = proxyRegistries[network.chainId] ?? constants.AddressZero;

    if (!args.noundersdao) {
      console.log(
          `Nounders DAO address not provided. Setting to deployer (${deployer.address})...`,
      );
      args.noundersdao = deployer.address;
    }
    if (!args.weth) {
      const deployedWETHContract = wethContracts[network.chainId];
      if (!deployedWETHContract) {
        throw new Error(
            `Can not auto-detect WETH contract on chain ${network.name}. Provide it with the --weth arg.`,
        );
      }
      args.weth = deployedWETHContract;
    }

    console.log(`deployer address is ${deployer.address}`)

    /////////////////// getTransactionCount()が正しい値にならない場合は手動で設定する。
    const nonce = 251;
    // const nonce = await deployer.getTransactionCount();
    console.log(`current nonce is ${nonce}`)

    const deployment: Record<ContractNamesDAOV3, DeployedContract> = {} as Record<
        ContractNamesDAOV3,
        DeployedContract
    >;
    const contracts: Record<ContractNamesDAOV3, ContractDeployment> = {
      NFTDescriptorV2: {
        waitForConfirmation: true,
      },
      SVGRenderer: {},
      NounsDescriptorV2: {
        args: [() => expectedNounsArtAddress(), () => deployment.SVGRenderer.address],
        libraries: () => ({
          NFTDescriptorV2: deployment.NFTDescriptorV2.address,
        }),
        waitForConfirmation: true,
      },
      Inflator: {},
      NounsArt: {
        args: [() => deployment.NounsDescriptorV2.address, () => deployment.Inflator.address],
      },
      NounsSeeder: {},
      NounsToken: {
        args: [
          args.noundersdao,
          deployer.address,
          () => deployment.NounsDescriptorV2.address,
          () => deployment.NounsSeeder.address,
          proxyRegistryAddress,
        ],
      },
      NounsAuctionHouse: {
        waitForConfirmation: true,
      },
      NounsAuctionHouseProxyAdmin: {},
      NounsAuctionHouseProxy: {
        args: [
          () => deployment.NounsAuctionHouse.address,
          () => deployment.NounsAuctionHouseProxyAdmin.address,
          () =>
            new Interface(NounsAuctionHouseABI).encodeFunctionData('initialize', [
              deployment.NounsToken.address,
              args.weth,
              args.auctionTimeBuffer,
              args.auctionReservePrice,
              args.auctionMinIncrementBidPercentage,
              args.auctionDuration,
            ]),
        ],
        waitForConfirmation: true,
        validateDeployment: () => {
          const expected = expectedAuctionHouseProxyAddress().toLowerCase();
          const actual = deployment.NounsAuctionHouseProxy.address.toLowerCase();
          if (expected !== actual) {
            throw new Error(
                `Unexpected auction house proxy address. Expected: ${expected}. Actual: ${actual}.`,
            );
          }
        },
      },
      NounsDAOV3DynamicQuorum: {},
      NounsDAOV3Admin: {},
      NounsDAOV3Proposals: {},
      NounsDAOV3Votes: {},
      NounsDAOV3Fork: {},
      NounsDAOLogicV3: {
        libraries: () => ({
          NounsDAOV3Admin: deployment.NounsDAOV3Admin.address,
          NounsDAOV3DynamicQuorum: deployment.NounsDAOV3DynamicQuorum.address,
          NounsDAOV3Proposals: deployment.NounsDAOV3Proposals.address,
          NounsDAOV3Votes: deployment.NounsDAOV3Votes.address,
          NounsDAOV3Fork: deployment.NounsDAOV3Fork.address,
        }),
        waitForConfirmation: true,
      },
      NounsDAOForkEscrow: {
        args: [() => expectedNounsDAOProxyAddress(), () => deployment.NounsToken.address],
      },
      NounsTokenFork: {},
      NounsAuctionHouseFork: {},
      NounsDAOLogicV1Fork: {},
      NounsDAOExecutorV2: {
        waitForConfirmation: true,
      },
      NounsDAOExecutorProxy: {
        args: [
          () => deployment.NounsDAOExecutorV2.address,
          () =>
              new Interface(NounsDAOExecutorV2ABI).encodeFunctionData('initialize', [
                expectedNounsDAOProxyAddress(),
                args.timelockDelay,
              ]),
        ],
      },
      ForkDAODeployer: {
        args: [
          () => deployment.NounsTokenFork.address,
          () => deployment.NounsAuctionHouseFork.address,
          () => deployment.NounsDAOLogicV1Fork.address,
          () => deployment.NounsDAOExecutorV2.address,
          60 * 60 * 24 * 30, // 30 days
          36000,
          36000,
          25,
          1000,
        ],
      },
      NounsDAOProxyV3: {
        args: [
          () => deployment.NounsDAOExecutorProxy.address, // timelock
          () => deployment.NounsToken.address, // token
          () => deployment.NounsDAOForkEscrow.address, // forkEscrow
          () => deployment.ForkDAODeployer.address, // forkDAODeployer
          args.noundersdao || deployer.address, // vetoer
          () => deployment.NounsDAOExecutorProxy.address, // admin
          () => deployment.NounsDAOLogicV3.address, // implementation
          {
            votingPeriod: args.votingPeriod,
            votingDelay: args.votingDelay,
            proposalThresholdBPS: args.proposalThresholdBps,
            lastMinuteWindowInBlocks: 0,
            objectionPeriodDurationInBlocks: 0,
            proposalUpdatablePeriodInBlocks: 0,
          }, // DAOParams
          {
            minQuorumVotesBPS: args.minQuorumVotesBPS,
            maxQuorumVotesBPS: args.maxQuorumVotesBPS,
            quorumCoefficient: parseUnits(args.quorumCoefficient.toString(), 6),
          }, // DynamicQuorumParams
        ],
        waitForConfirmation: true,
        validateDeployment: () => {
          const expected = expectedNounsDAOProxyAddress().toLowerCase();
          const actual = deployment.NounsDAOProxyV3.address.toLowerCase();
          if (expected !== actual) {
            throw new Error(
                `Unexpected Nouns DAO proxy address. Expected: ${expected}. Actual: ${actual}.`,
            );
          }
        },
      },
      NounsDAOData: {
        args: [() => deployment.NounsToken.address, () => expectedNounsDAOProxyAddress()],
        waitForConfirmation: true,
      },
      NounsDAODataProxy: {
        args: [
          () => deployment.NounsDAOData.address,
          () =>
              new Interface(NounsDaoDataABI).encodeFunctionData('initialize', [
                deployment.NounsDAOExecutorProxy.address,
                args.createCandidateCost,
                args.updateCandidateCost,
                expectedNounsDAOProxyAddress(),
              ]),
        ],
      },
    };

    const notDeployedContracts = (): Array<ContractDeploymentWithName> => Object.keys(contracts)
        .map((name) => {
          const _name = name as ContractNamesDAOV3
          return {
            name: _name,
            ...contracts[_name]
          } as ContractDeploymentWithName
        })
        .filter((v) => !deployedContracts[v.name]?.startsWith('0x'))
        .map((v, index) => {
          return {
            index,
            ...v
          } as ContractDeploymentWithName
        })

    const indexByContractName = (name: ContractNamesDAOV3): number | undefined => {
      const contract = notDeployedContracts()
          .find((v) => v.name === name)
      return contract?.index;
    }
    const getContractAddress = (contractName: ContractNamesDAOV3): string => {
      const deployedContractAddress = deployedContracts[contractName]
      if (deployedContractAddress?.startsWith('0x')) return deployedContractAddress
      const plusNonce = indexByContractName(contractName) || 0
      console.log(`plusNonce: ${plusNonce}`)
      const getContractAddress = ethers.utils.getContractAddress({
        from: deployer.address,
        nonce: nonce + plusNonce,
      });
      console.log(`getContractAddress: ${getContractAddress}`)
      return getContractAddress
    }

    const expectedNounsArtAddress = () => getContractAddress('NounsArt')
    const expectedAuctionHouseProxyAddress = () => getContractAddress('NounsAuctionHouseProxy')
    const expectedNounsDAOProxyAddress = () => getContractAddress('NounsDAOProxyV3')

    for (const [name, contract] of Object.entries(contracts)) {
      let gasPrice = await ethers.provider.getGasPrice();
      if (!args.autoDeploy) {
        const gasInGwei = Math.round(Number(ethers.utils.formatUnits(gasPrice, 'gwei')));

        promptjs.start();

        const result = await promptjs.get([
          {
            properties: {
              gasPrice: {
                type: 'integer',
                required: true,
                description: 'Enter a gas price (gwei)',
                default: gasInGwei,
              },
            },
          },
        ]);
        gasPrice = ethers.utils.parseUnits(result.gasPrice.toString(), 'gwei');
      }

      let nameForFactory: string;
      switch (name) {
        case 'NounsDAOExecutorV2':
          nameForFactory = 'NounsDAOExecutorV2Test';
          break;
        case 'NounsDAOLogicV3':
          nameForFactory = 'NounsDAOLogicV3Harness';
          break;
        default:
          nameForFactory = name;
          break;
      }

      const factory = await ethers.getContractFactory(nameForFactory, {
        libraries: contract?.libraries?.(),
      });

      let deployedContract;

      const contractAddress = deployedContracts[name as ContractNamesDAOV3];
      if (contractAddress?.startsWith('0x')) {
        deployedContract = await factory.attach(contractAddress);
        console.log(`Contract already deployed is ${deployedContract.address}`)
      } else {
        const deploymentGas = await factory.signer.estimateGas(
          factory.getDeployTransaction(
            ...(contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
            {
              gasPrice,
            },
          ),
        );
        // ガス不足(Base gasだけで不足する)になるので、5%足す
        const addGasPrice = gasPrice.div(BigNumber.from(20))
        gasPrice = gasPrice.add(addGasPrice)
        const deploymentCost = deploymentGas.mul(gasPrice);

        console.log(
          `Estimated cost to deploy ${name}: ${ethers.utils.formatUnits(
            deploymentCost,
            'ether',
          )} ETH`,
        );

        if (!args.autoDeploy) {
          const result = await promptjs.get([
            {
              properties: {
                confirm: {
                  pattern: /^(DEPLOY|SKIP|EXIT)$/,
                  description:
                    'Type "DEPLOY" to confirm, "SKIP" to skip this contract, or "EXIT" to exit.',
                },
              },
            },
          ]);
          if (result.operation === 'SKIP') {
            console.log(`Skipping ${name} deployment...`);
            continue;
          }
          if (result.operation === 'EXIT') {
            console.log('Exiting...');
            return;
          }
        }
        console.log(`Deploying ${name}...`);

        deployedContract = await factory.deploy(
          ...(contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? []),
          {
            gasPrice,
          },
        );
        if (contract.waitForConfirmation) {
          await deployedContract.deployed();
          console.log(`Contract has just deployed!`)
        }
        console.log(`Contract is ${deployedContract.address}`)
        console.log(`Tx hash is ${deployedContract.deployTransaction.hash}`)
        console.log(`Tx maxFeePerGas is ${deployedContract.deployTransaction.maxFeePerGas}`)
        console.log(`Tx maxPriorityFeePerGas is ${deployedContract.deployTransaction.maxPriorityFeePerGas}`)
        console.log(`Tx gasPrice is ${deployedContract.deployTransaction.gasPrice}`)
        console.log(`Tx nonce is ${deployedContract.deployTransaction.nonce}`)
      }

      deployment[name as ContractNamesDAOV3] = {
        name: nameForFactory,
        instance: deployedContract,
        address: deployedContract.address,
        constructorArguments: contract.args?.map(a => (typeof a === 'function' ? a() : a)) ?? [],
        libraries: contract?.libraries?.() ?? {},
      };

      if (!contractAddress?.startsWith('0x')) {
        contract.validateDeployment?.();
      }

      console.log('----------------------------------------------------------')
      console.log(`${name} contract deployed to ${deployedContract.address}`);
      console.log('----------------------------------------------------------')

    }

    return deployment;
  });
