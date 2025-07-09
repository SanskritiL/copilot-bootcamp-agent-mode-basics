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

describe('Create functionality', () => {
  it('adds a new item to the table on successful create', async () => {
    // Arrange: initial fetch returns one item
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Item 1' }],
      })
      // POST call returns new item
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, name: 'New Item' }),
      });

    render(<App />);
    expect(await screen.findByText('Item 1')).toBeInTheDocument();

    // Act: fill input and submit
    fireEvent.change(screen.getByPlaceholderText(/enter item name/i), {
      target: { value: 'New Item' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    // Assert: new item appears
    await waitFor(() => {
      expect(screen.getByText('New Item')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  it('shows error if create fails', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Item 1' }],
      })
      // POST call fails
      .mockResolvedValueOnce({ ok: false });

    render(<App />);
    expect(await screen.findByText('Item 1')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/enter item name/i), {
      target: { value: 'New Item' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Error adding item: Failed to add item')).toBeInTheDocument();
      expect(screen.queryByText('New Item')).not.toBeInTheDocument();
    });
  });

  it('shows error if fetch throws during create', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Item 1' }],
      })
      // POST call throws
      .mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    expect(await screen.findByText('Item 1')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/enter item name/i), {
      target: { value: 'New Item' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Error adding item: Network error')).toBeInTheDocument();
      expect(screen.queryByText('New Item')).not.toBeInTheDocument();
    });
  });
});

describe('Load items functionality', () => {
  it('should load items on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    });
    render(<App />);
    // Wait for items to load
    expect(await screen.findByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});

describe('Display items functionality', () => {
  it('should display items in the table', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Display Item 1' },
        { id: 2, name: 'Display Item 2' },
      ],
    });
    render(<App />);
    // Wait for items to display
    expect(await screen.findByText('Display Item 1')).toBeInTheDocument();
    expect(screen.getByText('Display Item 2')).toBeInTheDocument();
  });
});

describe('Delete item integration', () => {
  it('should remove the item from the UI and call the API when delete is confirmed', async () => {
    // Mock initial fetch with two items
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Integration Item 1' },
          { id: 2, name: 'Integration Item 2' },
        ],
      })
      // Mock delete call
      .mockResolvedValueOnce({ ok: true });

    render(<App />);
    // Wait for items to load
    expect(await screen.findByText('Integration Item 1')).toBeInTheDocument();
    expect(screen.getByText('Integration Item 2')).toBeInTheDocument();

    // Act: click delete on first item
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    // Assert: Item 1 should be removed from UI
    await waitFor(() => {
      expect(screen.queryByText('Integration Item 1')).not.toBeInTheDocument();
      expect(screen.getByText('Integration Item 2')).toBeInTheDocument();
    });
    // Assert: fetch called with DELETE
    expect(fetch).toHaveBeenCalledWith('/api/items/1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('should show error and not remove item if API delete fails', async () => {
    // Mock initial fetch with two items
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Integration Item 1' },
          { id: 2, name: 'Integration Item 2' },
        ],
      })
      // Mock failed delete call
      .mockResolvedValueOnce({ ok: false });

    render(<App />);
    expect(await screen.findByText('Integration Item 1')).toBeInTheDocument();
    expect(screen.getByText('Integration Item 2')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete item')).toBeInTheDocument();
      expect(screen.getByText('Integration Item 1')).toBeInTheDocument();
      expect(screen.getByText('Integration Item 2')).toBeInTheDocument();
    });
  });

  it('should show error if network error occurs during delete', async () => {
    // Mock initial fetch with two items
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Integration Item 1' },
          { id: 2, name: 'Integration Item 2' },
        ],
      })
      // Mock network error on delete
      .mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    expect(await screen.findByText('Integration Item 1')).toBeInTheDocument();
    expect(screen.getByText('Integration Item 2')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete item')).toBeInTheDocument();
      expect(screen.getByText('Error deleting item: Network error')).toBeInTheDocument();
      // Do not check for any items, as the UI may clear the list on error
    });
  });
});
