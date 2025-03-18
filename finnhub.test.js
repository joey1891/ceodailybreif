const { getAllIndices } = require('./finnhub-api');

describe('getAllIndices', () => {
  it('should return an object with data for all indices', async () => {
    const results = await getAllIndices();

    expect(typeof results).toBe('object');
    expect(results).toHaveProperty('KOSPI');
    expect(results).toHaveProperty('KOSDAQ');
    expect(results).toHaveProperty('NASDAQ');
    expect(results).toHaveProperty('S&P500');
    expect(results).toHaveProperty('DOW');

    console.log('KOSPI Data:', results.KOSPI);
    console.log('KOSDAQ Data:', results.KOSDAQ);
    console.log('NASDAQ Data:', results.NASDAQ);
    console.log('S&P500 Data:', results['S&P500']);
    console.log('Dow Jones Data:', results.DOW);
  }, 10000);

  it('should return data in the expected format', async () => {
    const results = await getAllIndices();
    const kospiData = results.KOSPI;

    expect(typeof kospiData).toBe('object');
    expect(kospiData).toHaveProperty('price');
    expect(kospiData).toHaveProperty('change');
    expect(kospiData).toHaveProperty('changeRate');
    expect(kospiData).toHaveProperty('date');
  }, 10000);
});
