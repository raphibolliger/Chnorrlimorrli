import { parsePostalCodes } from './shipping-admin-api';

describe('parsePostalCodes', () => {
  it('accepts commas, spaces and line breaks and removes duplicates', () => {
    expect(parsePostalCodes('5612, 5610\n5612 5630;abc 123')).toEqual(['5610', '5612', '5630']);
  });
});
