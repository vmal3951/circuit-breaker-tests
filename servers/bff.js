const axios = require('axios');
const CircuitBreaker = require('opossum');
const getStats = require('./stats');

const app = require('express')();
app.use(require('express-status-monitor')());
// Service Layer
const MicroService = async () => {
  const result = await axios.get('http://localhost:4000/data', { timeout: 5000 });
  return result.data;
}

const options = {
  timeout: 5000, // If our function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 15000, // After 30 seconds, try again.
  rollingPercentilesEnabled: false,
};
const breaker = new CircuitBreaker(MicroService, options);

app.get('/', (req, res) => res.send('UP'));

app.get('/ms-data', async (req, res) => {
  console.log('================= Initiate', `[${req.query.count}]`, new Date().toLocaleTimeString(), new Date().getMilliseconds())
  try {
    const data = await MicroService();
    // console.log('End', req.query.count, new Date().toLocaleTimeString(), new Date().getMilliseconds())
    res.json(data);
  } catch (e) {
    // console.log('Response Complete with error', req.query.count, new Date().toLocaleTimeString(), new Date().getMilliseconds())
    res.json({status: e.status, message: e.message});
  }
})

app.get('/ms-data-with-cb', async (req, res) => {
  console.log('throught cb')
  try {
    const data = await breaker.fire();
    res.json(data);
  } catch (e) {
    res.json({status: e.status, message: e.message});
  }
})

app.get('/cb-state', (req, res) => {
  getStats((stats) => {
    res.json({
      cb: breaker.toJSON(),
      stats
    });
  })
})

app.listen(5000, () => console.log('BFF is running on 5000'));