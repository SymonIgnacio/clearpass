import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import QRCodeGenerator from '../pages/QRCodeGenerator';
import QRCode from 'qrcode';

// Mock dependencies
const mockToDataURL = vi.fn();
const mockToCanvas = vi.fn();

vi.mock('qrcode', () => ({
  default: {
    toDataURL: (...args) => mockToDataURL(...args),
    toCanvas: (...args) => mockToCanvas(...args),
  },
  toDataURL: (...args) => mockToDataURL(...args),
  toCanvas: (...args) => mockToCanvas(...args),
}));

// Re-assign to the imported object for test assertions
QRCode.toDataURL = mockToDataURL;
QRCode.toCanvas = mockToCanvas;

// Mock Notification Context
const mockNotify = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notify: mockNotify,
  }),
}));

describe('QRCodeGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<QRCodeGenerator />);
    expect(screen.getByText('QR Code Generator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text to encode...')).toBeInTheDocument();
  });

  it('generates QR code when text is entered', async () => {
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,test-qr-code');

    render(<QRCodeGenerator />);
    
    const input = screen.getByPlaceholderText('Enter text to encode...');
    fireEvent.change(input, { target: { value: 'Test Content' } });

    // Wait for debounce and generation
    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith('Test Content', expect.objectContaining({
        width: 256,
        color: { dark: '#000000', light: '#ffffff' }
      }));
    });

    // Verify image is displayed
    const img = await screen.findByAltText('Generated QR Code');
    expect(img).toHaveAttribute('src', 'data:image/png;base64,test-qr-code');
  });

  it('updates configuration options', async () => {
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,test-qr-code');
    render(<QRCodeGenerator />);

    // Change input first to trigger generation logic
    fireEvent.change(screen.getByPlaceholderText('Enter text to encode...'), { target: { value: 'Test' } });

    // Change Color
    const colorInput = screen.getByLabelText('Foreground Color');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith('Test', expect.objectContaining({
        color: { dark: '#ff0000', light: '#ffffff' }
      }));
    });
  });

  it('handles generation errors gracefully', async () => {
    QRCode.toDataURL.mockRejectedValue(new Error('Generation failed'));
    
    render(<QRCodeGenerator />);
    
    const input = screen.getByPlaceholderText('Enter text to encode...');
    fireEvent.change(input, { target: { value: 'Error Test' } });

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('Failed to generate QR code', 'error');
    });
  });

  it('downloads QR code', async () => {
    vi.useFakeTimers();
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,test-qr-code');
    
    // Mock link click setup BEFORE render
    const originalCreateElement = document.createElement.bind(document);
    const linkMock = originalCreateElement('a');
    const clickSpy = vi.spyOn(linkMock, 'click');

    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return linkMock;
      return originalCreateElement(tagName);
    });

    render(<QRCodeGenerator />);
    
    // Generate QR first
    fireEvent.change(screen.getByPlaceholderText('Enter text to encode...'), { target: { value: 'Download Test' } });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    vi.useRealTimers();

    const img = await screen.findByAltText('Generated QR Code');
    await waitFor(() => expect(img).toHaveAttribute('src', 'data:image/png;base64,test-qr-code'));

    // Click download
    const downloadBtn = screen.getByText('Download PNG');
    fireEvent.click(downloadBtn);

    const aTagCalls = createElementSpy.mock.calls.filter(args => args[0] === 'a');
    expect(aTagCalls.length).toBeGreaterThan(0);
    expect(linkMock.download).toMatch(/qrcode-\d+\.png/);
    expect(linkMock.href).toBe('data:image/png;base64,test-qr-code');
    expect(clickSpy).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('QR Code downloaded successfully', 'success');
  });
});
