import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthorStore } from '@/stores/author-store';
import { Editable } from './Editable';

const fragment = { _id: 'offer-1', _path: '/content/dam/ironwood/offers/one' };

beforeEach(() => useAuthorStore.setState({ enabled: false, editing: null }));

describe('<Editable />', () => {
  it('emits Universal Editor data attributes for in-context editing', () => {
    render(
      <Editable model="offer" fragment={fragment} prop="title" label="Offer title" as="h3">
        Weekend Residency
      </Editable>,
    );
    const el = screen.getByRole('heading', { name: 'Weekend Residency' });
    expect(el).toHaveAttribute(
      'data-aue-resource',
      'urn:aemconnection:/content/dam/ironwood/offers/one/jcr:content/data/master',
    );
    expect(el).toHaveAttribute('data-aue-prop', 'title');
    expect(el).toHaveAttribute('data-aue-type', 'text');
    expect(el).toHaveAttribute('data-aue-label', 'Offer title');
  });

  it('opens the inline editor in author mode (mouse and keyboard)', async () => {
    useAuthorStore.setState({ enabled: true });
    render(
      <Editable model="offer" fragment={fragment} prop="title" label="Offer title">
        Hello
      </Editable>,
    );
    const btn = screen.getByRole('button', { name: 'Edit Offer title' });
    await userEvent.click(btn);
    expect(useAuthorStore.getState().editing).toMatchObject({
      id: 'offer-1',
      prop: 'title',
      value: 'Hello',
    });
    useAuthorStore.getState().closeEditor();
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(useAuthorStore.getState().editing).not.toBeNull();
  });

  it('has no axe violations in either mode', async () => {
    const { container, rerender } = render(
      <Editable model="offer" fragment={fragment} prop="title" label="T" as="p">
        x
      </Editable>,
    );
    expect(await axe(container)).toHaveNoViolations();
    useAuthorStore.setState({ enabled: true });
    rerender(
      <Editable model="offer" fragment={fragment} prop="title" label="T" as="p">
        x
      </Editable>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
