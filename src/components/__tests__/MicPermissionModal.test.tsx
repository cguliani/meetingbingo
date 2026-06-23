import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MicPermissionModal } from '../MicPermissionModal';

describe('MicPermissionModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(<MicPermissionModal isOpen={false} onAllow={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('explains the privacy model and offers both actions when open', () => {
    render(<MicPermissionModal isOpen onAllow={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/processed entirely in your browser/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /allow.*listen/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /skip/i })).toBeTruthy();
  });

  it('calls onAllow when "Allow & Listen" is clicked', () => {
    const onAllow = vi.fn();
    render(<MicPermissionModal isOpen onAllow={onAllow} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /allow.*listen/i }));
    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when "Skip" is clicked', () => {
    const onSkip = vi.fn();
    render(<MicPermissionModal isOpen onAllow={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when Escape is pressed', () => {
    const onSkip = vi.fn();
    render(<MicPermissionModal isOpen onAllow={vi.fn()} onSkip={onSkip} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
