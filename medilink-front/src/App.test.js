import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page by default', () => {
  render(<App />);
  const headingElement = screen.getByText(/login/i);
  expect(headingElement).toBeInTheDocument();
});
