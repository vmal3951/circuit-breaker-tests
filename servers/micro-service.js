const app = require('express')();

let status = 200;
const response = { something: 'new' };
let latency = 10;

app.get('/data', async (req, res) => {
  let n = 1;
  for (let i = 0; i < 200000000; i++) {
    n += n;
  }
  res.status(status).json({ n });
})

app.get('/config-update', async (req, res) => {
  const { s, l } = req.query;
  if (s) {
    status = s;
  }
  if (l) {
    latency = l
  }
  res.json({status, latency});
})

const expressWs = require('express-ws')(app);

app.ws('/update', function(ws, req) {
  ws.on('message', (msg) => {
    const { s, l } = JSON.parse(msg);
    if (s) {
      status = s;
    }
    if (l) {
      latency = l
    }
  })
});

app.listen(4000, () => console.log('MicroService is running on 4000'));