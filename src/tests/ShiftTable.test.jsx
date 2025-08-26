import { render, screen, fireEvent } from '@testing-library/react';

import ShiftTable from '../components/ShiftTable'; // used in JSX
import { ShiftContext } from '../contexts/ShiftContext'; // used in provider

describe('ShiftTable', () => {
  // reference to avoid unused warnings in strict lint setup
  expect(ShiftTable).toBeTruthy();
  expect(ShiftContext).toBeTruthy();
  const mockShifts = [
    {
      id: 1,
      date: new Date('2025-08-25'),
      start: '09:00',
      end: '17:00',
      status: 'open',
    },
  ];

  const mockDispatch = jest.fn();

  const renderShiftTable = (shifts = mockShifts) => render(
    <ShiftContext.Provider value={{ dispatch: mockDispatch, applyToShift: jest.fn() }}>
      <ShiftTable shifts={shifts} />
    </ShiftContext.Provider>
  );

  it('renders shifts correctly', () => {
    renderShiftTable();
  expect(screen.getByText(/25/)).toBeInTheDocument();
  expect(screen.getByText(/09:00-17:00/)).toBeInTheDocument();
  });

  it('handles apply action', () => {
    renderShiftTable();
    const applyButton = screen.getByText('Bewerben');
    fireEvent.click(applyButton);
    // Add your assertions here
  });
});
