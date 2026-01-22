import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Chatbot from '../Chatbot.jsx';

vi.mock('../../utils/api', () => ({
  api: {
    post: vi.fn(async () => ({
      json: async () => ({
        response:
          'Request a Barangay Clearance: select type, add Purpose, upload ID front/back, then submit. Track in My Requests.',
        intent: 'guide_barangay_clearance',
        confidence: 0.93,
        type: 'guide',
        steps: [
          'Go to Certificates → Request Certificate.',
          'Select Barangay Clearance.',
          'Provide Purpose (e.g., Employment, School Requirement).',
          'Review auto‑filled resident details; update your profile if needed.',
          'Upload Valid ID (front and back).',
          'Submit and track in My Requests.',
        ],
        fields: {
          certificate_type: "Select 'Barangay Clearance'.",
          purpose: 'Short reason for requesting the document.',
        },
        resources: [
          { label: 'Open Request Certificate', url: '/resident/request-certificate' },
          { label: 'Open My Requests', url: '/resident/requests' },
        ],
        disclaimers: ['Bantay provides guidance only and does not submit on your behalf.'],
      }),
    })),
  },
}));

describe('Chatbot certificate guides', () => {
  it('renders clearance guide with fields and deep links', async () => {
    render(
      <MemoryRouter>
        <Chatbot />
      </MemoryRouter>
    );

    const fab = screen.getByRole('button', { name: /chat/i });
    fireEvent.click(fab);

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Barangay clearance guide' } });
    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Select 'Barangay Clearance'\./i)).toBeInTheDocument();
      expect(screen.getByText(/Short reason for requesting the document\./i)).toBeInTheDocument();
      expect(screen.getByText(/Go to Certificates/i)).toBeInTheDocument();
    });

    // Deep link chips rendered
    expect(screen.getByRole('button', { name: /Open Request Certificate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open My Requests/i })).toBeInTheDocument();
  });
});
