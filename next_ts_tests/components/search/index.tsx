import classNames from 'classnames';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SearchIcon, XMarkIcon } from '@/constants/icons/';
import useWindowSize from '@/hooks/useWindowSize';

import styles from './search.module.scss';

interface SearchProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
}

const LPHONE_BREAKPOINT = 600;

const Search: React.FC<SearchProps> = ({ value, setValue, placeholder }) => {
  const [inputOnFocus, setInputOnFocus] = useState<boolean>(false);
  const [tabIndexFocus, setTabIndexFocus] = useState<boolean>(false);
  const [hoveredSearch, setHoveredSearch] = useState<boolean>(false);
  const windowSize = useWindowSize();

  const { t } = useTranslation('front');

  const handleClearInput = () => {
    setValue('');
  };

  const handleHover = (val: boolean) => {
    if (windowSize.width >= LPHONE_BREAKPOINT) {
      setHoveredSearch(val);
    }
  };

  const handleSetSearchValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleOnBlur = () => {
    setInputOnFocus(false);
    setTabIndexFocus(false);
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    setTabIndexFocus(true);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    setTabIndexFocus(false);
  };

  const classes = useMemo(() => {
    return classNames({
      [styles['input-wrapper']]: true,
      [styles['search-wrapper-tab-focused']]: tabIndexFocus,
      [styles['search-wrapper-focused']]: inputOnFocus
    });
  }, [tabIndexFocus, inputOnFocus]);

  return (
    <div
      className={classes}
      role="search"
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <input
        onFocus={() => setInputOnFocus(true)}
        onBlur={handleOnBlur}
        name="search"
        type="search"
        aria-label={t('assignments.search')}
        value={value}
        className={classNames({
          [styles['search-input-focused']]: inputOnFocus,
          [styles['search-input']]: true
        })}
        placeholder={placeholder || '...'}
        onChange={handleSetSearchValue}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
      />
      {!!value.length && (
        <button aria-label={t('forms.search_clear')} className={styles['clear-button']} onClick={handleClearInput}>
          <span>{XMarkIcon}</span>
        </button>
      )}
      <button
        aria-label={t('forms.search_icon')}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
        className={classNames({
          [styles['search-icon']]: true,
          [styles['search-icon-focused']]: inputOnFocus,
          [styles['search-icon-hovered']]: hoveredSearch
        })}
      >
        <span>{SearchIcon}</span>
      </button>
    </div>
  );
};

export default memo(Search);
