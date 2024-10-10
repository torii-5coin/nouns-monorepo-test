import chai from 'chai';
import { ethers } from 'hardhat';
import { BigNumber as EthersBN, constants } from 'ethers';
import { solidity } from 'ethereum-waffle';
import { NounsDescriptorV2__factory as NounsDescriptorV2Factory, NounsToken } from '../typechain';
import { deployNounsToken, populateDescriptorV2 } from './utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import ContractUri from '../contract-uri.json'

chai.use(solidity);
const { expect } = chai;

describe('NounsToken', () => {
  let nounsToken: NounsToken;
  let deployer: SignerWithAddress;
  let noundersDAO: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer, noundersDAO] = await ethers.getSigners();
    nounsToken = await deployNounsToken(deployer, noundersDAO.address, deployer.address);

    const descriptor = await nounsToken.descriptor();

    await populateDescriptorV2(NounsDescriptorV2Factory.connect(descriptor, deployer));
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  it('should allow the minter to mint a noun to itself and a reward noun to the noundersDAO', async () => {
    const receipt = await (await nounsToken.mint()).wait();

    const [, , , noundersNounCreated, , , , ownersNounCreated] = receipt.events || [];

    expect(await nounsToken.ownerOf(0)).to.eq(noundersDAO.address);
    expect(noundersNounCreated?.event).to.eq('NounCreated');
    expect(noundersNounCreated?.args?.tokenId).to.eq(0);
    expect(noundersNounCreated?.args?.seed.length).to.equal(5);

    expect(await nounsToken.ownerOf(1)).to.eq(deployer.address);
    expect(ownersNounCreated?.event).to.eq('NounCreated');
    expect(ownersNounCreated?.args?.tokenId).to.eq(1);
    expect(ownersNounCreated?.args?.seed.length).to.equal(5);

    noundersNounCreated?.args?.seed.forEach((item: EthersBN | number) => {
      const value = typeof item !== 'number' ? item?.toNumber() : item;
      expect(value).to.be.a('number');
    });

    ownersNounCreated?.args?.seed.forEach((item: EthersBN | number) => {
      const value = typeof item !== 'number' ? item?.toNumber() : item;
      expect(value).to.be.a('number');
    });
  });

  it('should set symbol', async () => {
    expect(await nounsToken.symbol()).to.eq('AsoUbuyama NOUN');
  });

  it('should set name', async () => {
    expect(await nounsToken.name()).to.eq('AsoUbuyama Nouns');
  });

  it('should allow minter to mint a noun to itself', async () => {
    await (await nounsToken.mint()).wait();

    const receipt = await (await nounsToken.mint()).wait();
    const nounCreated = receipt.events?.[3];

    expect(await nounsToken.ownerOf(2)).to.eq(deployer.address);
    expect(nounCreated?.event).to.eq('NounCreated');
    expect(nounCreated?.args?.tokenId).to.eq(2);
    expect(nounCreated?.args?.seed.length).to.equal(5);

    nounCreated?.args?.seed.forEach((item: EthersBN | number) => {
      const value = typeof item !== 'number' ? item?.toNumber() : item;
      expect(value).to.be.a('number');
    });
  });

  it('should emit two transfer logs on mint', async () => {
    const [, , creator, minter] = await ethers.getSigners();

    await (await nounsToken.mint()).wait();

    await (await nounsToken.setMinter(minter.address)).wait();
    await (await nounsToken.transferOwnership(creator.address)).wait();

    const tx = nounsToken.connect(minter).mint();

    await expect(tx)
      .to.emit(nounsToken, 'Transfer')
      .withArgs(constants.AddressZero, creator.address, 2);
    await expect(tx).to.emit(nounsToken, 'Transfer').withArgs(creator.address, minter.address, 2);
  });

  it('should allow minter to burn a noun', async () => {
    await (await nounsToken.mint()).wait();

    const tx = nounsToken.burn(0);
    await expect(tx).to.emit(nounsToken, 'NounBurned').withArgs(0);
  });

  it('should revert on non-minter mint', async () => {
    const account0AsNounErc721Account = nounsToken.connect(noundersDAO);
    await expect(account0AsNounErc721Account.mint()).to.be.reverted;
  });

  describe('contractURI', async () => {
    it('should have required params', async () => {
      const contractURI = await nounsToken.contractURI();
      const base64Str = contractURI.replace(/^data:application\/json;base64,/, '')
      const contractURIObj = JSON.parse(Buffer.from(base64Str, 'base64').toString('utf-8'))
      const requiredKeys = ['name', 'description', 'image', 'external_link', 'seller_fee_basis_points', 'fee_recipient']
      expect(contractURIObj).to.have.keys(requiredKeys);
    });
    const encodedContractURI = 'eyJuYW1lIjoiQXNvVWJ1eWFtYSBOb3VucyIsImRlc2NyaXB0aW9uIjoiT25lIEFzb1VidXlhbWEgTm91biwgZXZlcnkgZGF5LCBmb3JldmVyLlxyXG5cclxuQXNvVWJ1eWFtYSBOb3VucyBEQU8gaXMgYW4gb2ZmaWNpYWwgTm91bmlzaCBEQU8gb2YgVWJ1eWFtYSB2aWxsYWdlIGluIEphcGFuLlxyXG5cclxuYXNvLXVidXlhbWEtbm91bnMud3RmIiwiaW1hZ2UiOiJodHRwczovL2Fzby11YnV5YW1hLW5vdW5zLnd0Zi91YnV5YW1hX3NvbnNob3UucG5nIiwiZXh0ZXJuYWxfbGluayI6Imh0dHBzOi8vYXNvLXVidXlhbWEtbm91bnMud3RmIiwic2VsbGVyX2ZlZV9iYXNpc19wb2ludHMiOjAsImZlZV9yZWNpcGllbnQiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifQ=='
    it('should allow owner to set contractURI', async () => {
      await nounsToken.setContractURI(encodedContractURI);
      expect(await nounsToken.contractURI()).to.eq(encodedContractURI);
    });
    it('should not allow non owner to set contractURI', async () => {
      const [, nonOwner] = await ethers.getSigners();
      await expect(nounsToken.connect(nonOwner).setContractURI(encodedContractURI)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });
});
