import { fireEvent, render, screen } from '@testing-library/react';
import { createRenderer as shallowRenderer, ShallowRenderer } from 'react-test-renderer/shallow';

import Component, { CheckBoxProps } from './index';

const requiredProps: CheckBoxProps = {
  checkboxId: 'test-checkbox-id',
  checked: false,
  onChange: jest.fn()
};

describe('snapshot', () => {
  let renderer: ShallowRenderer;
  beforeEach(() => {
    renderer = shallowRenderer();
  });
  afterEach(() => {
    renderer.unmount();
  });

  it('required props only', () => {
    renderer.render(<Component {...requiredProps} />);
    expect(renderer.getRenderOutput()).toMatchSnapshot();
  });
  it('checked', () => {
    const props: CheckBoxProps = {
      ...requiredProps,
      checked: true
    };
    renderer.render(<Component {...props} />);
    expect(renderer.getRenderOutput()).toMatchSnapshot();
  });
  it('label with no links in it', () => {
    const props: CheckBoxProps = {
      ...requiredProps,
      label: 'I agree'
    };
    renderer.render(<Component {...props} />);
    expect(renderer.getRenderOutput()).toMatchSnapshot();
  });
  it('label with a link in it', () => {
    const props: CheckBoxProps = {
      ...requiredProps,
      label: 'I agree with the <a href="https://link-example.com/" target="_blank">following</a> terms'
    };
    renderer.render(<Component {...props} />);
    expect(renderer.getRenderOutput()).toMatchSnapshot();
  });
});

describe('callbacks', () => {
  it('onChange', async () => {
    const props: CheckBoxProps = {
      ...requiredProps,
      onChange: jest.fn()
    };
    const { container } = render(<Component {...props} />);

    expect(props.onChange).not.toBeCalled();

    const checkbox = container.querySelector('#test-checkbox-id');
    expect(checkbox).toBeDefined();
    expect(checkbox).not.toBeNull();

    checkbox && fireEvent.click(checkbox);
    expect(props.onChange).toBeCalledWith<Parameters<CheckBoxProps['onChange']>>(true);
  });
});
