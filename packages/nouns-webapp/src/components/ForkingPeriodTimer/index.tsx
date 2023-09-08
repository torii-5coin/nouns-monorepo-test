import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import classes from './AuctionTimer.module.css';
import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../hooks';
import clsx from 'clsx';
import { Trans } from '@lingui/macro';
import { i18n } from '@lingui/core';

dayjs.extend(duration);

const ForkingPeriodTimer: React.FC<{
  endTime: number;
  isPeriodEnded: boolean;
  onTimerToggled?: (isToggled: boolean) => void;
}> = props => {
  const [auctionTimer, setAuctionTimer] = useState(0);
  const [timerToggle, setTimerToggle] = useState(true);
  const auctionTimerRef = useRef(auctionTimer); // to access within setTimeout
  auctionTimerRef.current = auctionTimer;
  const timerDuration = dayjs.duration(auctionTimerRef.current, 's');
  const endTimeUnix = Math.floor(Date.now() / 1000) + auctionTimerRef.current;

  // timer logic
  useEffect(() => {
    const timeLeft = props.endTime - dayjs().unix();

    setAuctionTimer(timeLeft);

    if (!props.isPeriodEnded && timeLeft <= 0) {
      setAuctionTimer(0);
    } else {
      const timer = setTimeout(() => {
        setAuctionTimer(auctionTimerRef.current - 1);
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [props.isPeriodEnded, auctionTimer, props.endTime]);

  const flooredMinutes = Math.floor(timerDuration.minutes());
  const flooredSeconds = Math.floor(timerDuration.seconds());
  const flooredDays = Math.floor(timerDuration.days());
  const isCool = useAppSelector(state => state.application.isCoolBackground);

  if (props.isPeriodEnded) return null;

  return (
    <div className="text-center" onClick={() => {
      const isToggled = !timerToggle;

      setTimerToggle(isToggled);
      props.onTimerToggled?.(isToggled);
    }}>
      {timerToggle ? (
        <h2
          className={clsx(classes.timerWrapper, classes.timeLeft)}
          style={{
            color: isCool ? 'var(--brand-cool-dark-text)' : 'var(--brand-warm-dark-text)',
          }}
        >
          <div className={classes.timerSection}>
            {flooredDays > 0 && (
              <span>
                {`${Math.floor(timerDuration.days())}`}
                <span className={classes.small}>
                  {' '}
                  <Trans>days</Trans>
                  {' '}
                </span>
              </span>
            )}
            <span>
              {`${Math.floor(timerDuration.hours())}`}
              <span className={classes.small}>
                {' '}
                <Trans>hours</Trans>
              </span>
            </span>
          </div>
          <div className={classes.timerSection}>
            <span>
              {`${flooredMinutes}`}
              <span className={classes.small}>
                {' '}
                <Trans>minutes</Trans>
              </span>
            </span>
          </div>
          <div className={classes.timerSectionFinal}>
            <span>
              {`${flooredSeconds}`}
              <span className={classes.small}>
                {' '}
                <Trans>seconds</Trans>
              </span>
            </span>
          </div>
        </h2>
      ) : (
        <h2
          className={classes.timerWrapper}
          style={{
            color: isCool ? 'var(--brand-cool-dark-text)' : 'var(--brand-warm-dark-text)',
          }}
        >
          <div className={clsx(classes.timerSection, classes.clockSection)}>
            <span>{i18n.date(new Date(endTimeUnix * 1000), { dateStyle: 'medium', timeStyle: 'medium' })}</span>
          </div>
        </h2>
      )}
    </div>
  );
};

export default ForkingPeriodTimer;
