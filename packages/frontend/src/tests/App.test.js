import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('handleDelete function', () => {
  it('removes item from UI on successful delete', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Delete Test Item 1' },
          { id: 2, name: 'Delete Test Item 2' },
        ],
      })
      .mockResolvedValueOnce({ ok: true });

    render(<App />);
    expect(await screen.findByText('Delete Test Item 1')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    await waitFor(() => {
      expect(screen.queryByText('Delete Test Item 1')).not.toBeInTheDocument();
      expect(screen.getByText('Delete Test Item 2')).toBeInTheDocument();
    });
  });

  it('shows error and does not remove item if delete fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Delete Test Item 1' },
        ],
      })
      .mockResolvedValueOnce({ ok: false });

    render(<App />);
    expect(await screen.findByText('Delete Test Item 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to delete item')).toBeInTheDocument();
      expect(screen.getByText('Delete Test Item 1')).toBeInTheDocument();
    });
  });

  it('shows error if network error occurs during delete', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Delete Test Item 1' },
        ],
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    expect(await screen.findByText('Delete Test Item 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to delete item')).toBeInTheDocument();
      expect(screen.getByText('Error deleting item: Network error')).toBeInTheDocument();
    });
  });
});
