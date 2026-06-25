import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageShell } from './page-shell';

describe('PageShell', () => {
  it('renders title and description', () => {
    render(
      <PageShell title="Test Title" description="Test Description">
        <div>Test Content</div>
      </PageShell>
    );

    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Test Description')).toBeTruthy();
    expect(screen.getByText('Test Content')).toBeTruthy();
  });
});
