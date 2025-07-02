import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.resetAllMocks();
});

describe('Delete functionality', () => {
  it('removes item from table on successful delete', async () => {
    // Arrange: initial fetch returns two items
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      })
      // Delete call
      .mockResolvedValueOnce({ ok: true });

    render(<App />);

    // Wait for items to load
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();

    // Act: click delete on first item
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    // Assert: Item 1 should be removed
    await waitFor(() => {
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('shows error and does not remove item if delete fails', async () => {
    // Arrange: initial fetch returns one item
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Item 1' }],
      })
      // Delete call fails
      .mockResolvedValueOnce({ ok: false });

    render(<App />);
    expect(await screen.findByText('Item 1')).toBeInTheDocument();

    // Act: click delete
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Assert: error message shown, item not removed
    await waitFor(() => {
      expect(screen.getByText('Failed to delete item')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  it('shows error if fetch throws during delete', async () => {
    // Arrange: initial fetch returns one item
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Item 1' }],
      })
      // Delete call throws
      .mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    expect(await screen.findByText('Item 1')).toBeInTheDocument();

    // Act: click delete
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Assert: error messages shown
    await waitFor(() => {
      expect(screen.getByText('Failed to delete item')).toBeInTheDocument();
      expect(screen.getByText('Error deleting item: Network error')).toBeInTheDocument();
    });
  });
});
