const axios = require('axios');
const app = require('express')();

let frequency = 200;

const expressWs = require('express-ws')(app);

let bffRequestTimoutRef = null;
let bffReqeustCount = 0;

const two = (n) => n < 10 ? '0' + n : n;
const three = (n) => n < 10 ? '00' + n : (n < 100 ? '0' + n : n);
const now = (d) => {
  return `${two(d.getMinutes() + 1)}-${two(d.getSeconds())}-${three(d.getMilliseconds())}`
}

app.get('/', (req, res) => res.send('OK'))

app.ws('/set-config', function(ws, req) {
  ws.on('message', (msg) => {
    const { frequency, cbEndpoint, active } = JSON.parse(msg);
    console.log('Changing configs', frequency, cbEndpoint);

    clearInterval(bffRequestTimoutRef);

    if (active) {
      bffRequestTimoutRef = setInterval(() => {

        bffReqeustCount ++;
        const d = new Date();
        const time = now(d);

        ws.send(JSON.stringify({type: 'start', id: bffReqeustCount, start: time, ts: d.getTime()}))
        console.log('start ', bffReqeustCount)
        axios.get(`http://localhost:5000/${cbEndpoint ? 'ms-data-with-cb' : 'ms-data'}?count=${bffReqeustCount}&time=${time}`)
          .then(function(res) {
            const d = new Date();
            const time = now(d);
            const url = new URL(res.config.url)
            const id = parseInt(url.searchParams.get('count'))
            ws.send(JSON.stringify({type: 'success', id, end: time, ts: d.getTime()}))
        }).catch(err => {
          const d = new Date();
          const time = now(d);
          const url = new URL(err.config.url)
          const id = parseInt(url.searchParams.get('count'))
          ws.send(JSON.stringify({type: 'error', id, end: time, ts: d.getTime()}))
        })
      }, frequency);
    }
  })
});

app.listen(8080, () => console.log('Request Initiater is running on 8080'));