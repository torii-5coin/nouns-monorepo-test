import Modal from '../Modal';
import WalletButton from '../WalletButton';
import { WALLET_TYPE } from '../WalletButton';
import { useEthers } from '@usedapp/core';
import clsx from 'clsx';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectV2Connector } from '../../utils/walletconnectV2Connector';
import config, { CHAIN_ID, WALLET_CONNECT_V2_PROJECT_ID } from '../../config';
import classes from './WalletConnectModal.module.css';
import { Trans } from '@lingui/macro';

const WalletConnectModal: React.FC<{ onDismiss: () => void }> = props => {
  const { onDismiss } = props;
  const { activate } = useEthers();
  const supportedChainIds = [CHAIN_ID];

  const wallets = (
    <div className={classes.walletConnectModal}>
      <WalletButton
        onClick={() => {
          const injected = new InjectedConnector({
            supportedChainIds,
          });
          activate(injected);
        }}
        walletType={WALLET_TYPE.metamask}
      />
      <WalletButton
        onClick={() => {
          const walletConnectV2 = new WalletConnectV2Connector({
            projectId: WALLET_CONNECT_V2_PROJECT_ID,
            showQrModal: true,
            chains: supportedChainIds,
            rpcMap: {
              [CHAIN_ID]: config.app.jsonRpcUri,
            },
            optionalChains: [CHAIN_ID],
          });
          activate(walletConnectV2);
        }}
        walletType={WALLET_TYPE.walletconnect}
      />
      <WalletButton
        onClick={() => {
          const injected = new InjectedConnector({
            supportedChainIds,
          });
          activate(injected);
        }}
        walletType={WALLET_TYPE.brave}
      />
      <div
        className={clsx(classes.clickable, classes.walletConnectData)}
        onClick={() => localStorage.removeItem('walletconnect')}
      >
        <Trans>Clear WalletConnect Data</Trans>
      </div>
    </div>
  );
  return (
    <Modal title={<Trans>Connect your wallet</Trans>} content={wallets} onDismiss={onDismiss} />
  );
};
export default WalletConnectModal;
