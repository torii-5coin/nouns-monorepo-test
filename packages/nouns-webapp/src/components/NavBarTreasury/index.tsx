import classes from './NavBarTreasury.module.css';
import { NavBarButtonStyle } from '../NavBarButton';
import clsx from 'clsx';
import { Trans } from '@lingui/macro';
import { treasuryString } from "../../utils/numberUtils";
import { BigNumberish, utils } from "ethers";

interface NavBarTreasuryProps {
  treasuryBalance: BigNumberish;
  treasuryStyle: NavBarButtonStyle;
}

const NavBarTreasury: React.FC<NavBarTreasuryProps> = props => {
  const { treasuryBalance, treasuryStyle } = props;

  let treasuryStyleClass;
  switch (treasuryStyle) {
    case NavBarButtonStyle.WARM_INFO:
      treasuryStyleClass = classes.warmInfo;
      break;
    case NavBarButtonStyle.COOL_INFO:
      treasuryStyleClass = classes.coolInfo;
      break;
    case NavBarButtonStyle.WHITE_INFO:
    default:
      treasuryStyleClass = classes.whiteInfo;
      break;
  }

  return (
    <div className={`${classes.wrapper} ${treasuryStyleClass}`}>
      <div className={classes.button}>
        <div
          className="d-flex flex-row justify-content-around"
          style={{
            paddingTop: '1px',
          }}
        >
          <div
            className={clsx(
              classes.treasuryHeader,
              treasuryStyle === NavBarButtonStyle.WHITE_INFO ? classes.whiteTreasuryHeader : '',
            )}
          >
            <Trans>Treasury</Trans>
          </div>
          <div className={classes.treasuryBalance}>Ξ {treasuryString(Number(utils.formatEther(treasuryBalance)))}</div>
        </div>
      </div>
    </div>
  );
};

export default NavBarTreasury;
