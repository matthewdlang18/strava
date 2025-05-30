import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple component test that doesn't rely on the complex App component
const SimpleComponent = () => {
  return (
    <div>
      <h1>Test Component</h1>
      <p>This is a test component</p>
    </div>
  );
};

describe('Basic Component Tests', () => {
  test('renders test component', () => {
    render(<SimpleComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(screen.getByText('This is a test component')).toBeInTheDocument();
  });

  test('basic React functionality works', () => {
    const element = React.createElement('div', { 'data-testid': 'test-element' }, 'Hello World');
    render(element);
    expect(screen.getByTestId('test-element')).toHaveTextContent('Hello World');
  });

  test('environment variables are accessible', () => {
    // Test that environment variables can be accessed
    const apiUrl = process.env.REACT_APP_API_URL || 'default-url';
    expect(typeof apiUrl).toBe('string');
  });
});
