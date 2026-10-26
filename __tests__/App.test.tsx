import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';

/** A smoke test: the preview screen renders, and tapping a history updates the suggestions. */

describe('recommender preview screen', () => {
  test('shows suggestions for a brand-new child first', async () => {
    await render(<App />);
    expect(screen.getByText('Recommender preview')).toBeTruthy();
    expect(screen.getAllByText(/new-to-explore/).length).toBeGreaterThan(0);
  });

  test('tapping a play history changes the suggestions and notes', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByText('Needed help at the simplest level'));
    expect(screen.getAllByText(/different-way/).length).toBeGreaterThan(0);
    expect(screen.getByText('rest-needed-help')).toBeTruthy();
  });
});
