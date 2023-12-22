import classNames from 'classnames';
import React, { FC, useCallback, useEffect, useState } from 'react';

import CopyButton from '@/components/buttons/CopyButton';
import { copyToClipboard } from '@/helpers/clipboard';

import styles from './styles.module.scss';

export interface CopyFieldProps {
  id?: string;
  label: string;
  value?: string;
}

const hideCopiedMessageTimeout = 3000;

const CopyField: FC<CopyFieldProps> = ({ id, label, value = '' }) => {
  const [inputValue, setInputValue] = useState(value);
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = useCallback(() => {
    copyToClipboard(inputValue).catch(error => console.warn(error));
    setIsCopied(true);
  }, [inputValue]);

  useEffect(() => {
    setInputValue(value);
    setIsCopied(false);
  }, [value]);

  useEffect(() => {
    if (isCopied) {
      const timeoutId = setTimeout(() => setIsCopied(false), hideCopiedMessageTimeout);
      return () => clearTimeout(timeoutId);
    }
  }, [isCopied]);

  return (
    <div>
      <div className={styles['label-wrapper']}>
        <label className={styles.label}>{label}</label>
        <CopyButton isCopied={isCopied} onCopy={onCopy} />
      </div>
      <input
        id={id || 'copy-field'}
        type="text"
        className={classNames(styles['input'], { [styles['copied']]: isCopied })}
        value={inputValue}
        readOnly
      />
    </div>
  );
};

export default CopyField;
