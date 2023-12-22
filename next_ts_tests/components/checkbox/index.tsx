import classNames from 'classnames';
import React, { useCallback, useState } from 'react';

import styles from './styles.module.scss';

export interface CheckBoxProps {
  checkboxId: string;
  label?: string | JSX.Element;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const CheckBox: React.FC<CheckBoxProps> = ({ checkboxId, label, checked, onChange, className, disabled }) => {
  const [linkOnHover, setLinkOnHover] = useState(false);

  const handleSetLinkOnMouseLeave = useCallback(() => setLinkOnHover(false), []);

  const handleOnChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    e => {
      if (linkOnHover) return;

      onChange(e.target.checked);
    },
    [linkOnHover, onChange]
  );

  const handleMouseMove = useCallback<React.MouseEventHandler<HTMLDivElement>>(e => {
    const target = e.target as HTMLDivElement;
    setLinkOnHover(target?.nodeName === 'A');
  }, []);

  return (
    <div
      className={classNames(className, styles['checkbox-wrapper'], { [styles['disabled']]: disabled })}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleSetLinkOnMouseLeave}
    >
      <label className={classNames(styles['checkbox'])} htmlFor={checkboxId}>
        <input id={checkboxId} type="checkbox" checked={checked} onChange={handleOnChange} />
        {!linkOnHover && <span className={styles['checkbox-text']}>{label}</span>}
      </label>
      {linkOnHover && <span className={styles['checkbox-text']}>{label}</span>}
    </div>
  );
};

export default CheckBox;
