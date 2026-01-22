import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Chatbot from '../Chatbot.jsx';

vi.mock('../../utils/api', () => ({
  api: {
    post: vi.fn(async () => ({
      json: async () => ({
        response: 'Step‑by‑step: Filing a Complaint',
        intent: 'guide_file_complaint',
        confidence: 0.9,
        actions: ['Schedule appointment', 'More info'],
        type: 'guide',
        steps: ['Confirm jurisdiction and timeframe.', 'Prepare incident details and witnesses.'],
        disclaimers: ['Bantay provides guidance only and does not submit complaints.'],
      }),
    })),
  },
}));

describe('Chatbot guidance rendering', () => {
  it('renders guide steps and filters booking actions', async () => {
    render(
      <MemoryRouter>
        <Chatbot />
      </MemoryRouter>
    );
    const fab = screen.getByRole('button', { name: /chat/i });
    fireEvent.click(fab);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'How to file a complaint?' } });
    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Step‑by‑step: Filing a Complaint/i)).toBeInTheDocument();
      expect(screen.getByText(/1\. Confirm jurisdiction and timeframe\./i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Prepare incident details and witnesses\./i)).toBeInTheDocument();
    });

    // Ensure scheduling action chips are filtered out
    const chips = screen.queryAllByRole('button', { name: /schedule appointment/i });
    expect(chips.length).toBe(0);
  });
});
