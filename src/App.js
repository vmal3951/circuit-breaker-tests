import './App.css';
import 'antd/dist/antd.css';
import axios from "axios";
import {Row, Col, Checkbox, Slider, Button, Tag} from "antd";
import {useEffect, useState} from "react";
import useWebSocket from 'react-use-websocket';

let networkRequest = {};

function App() {
  const [reqFrequency, setReqFrequency] = useState(300);
  const [msLatency, setMsLatency] = useState(10);
  const [cbEndpoint, setCBEndpoint] = useState(true);
  const [active, setActive] = useState(true);
  const [msStatus, setMsStatus] = useState(200);

  const [cbState, setCBState] = useState({});

  const [requestLog, setRequestLog] = useState([]);

  const { sendMessage } = useWebSocket('ws://localhost:4000/update');
  const { sendMessage: sendRequests, lastMessage: requestStatus } = useWebSocket('ws://localhost:8080/set-config');

  useEffect(() => {
    sendRequests(JSON.stringify({ frequency: reqFrequency, cbEndpoint, active }))
  }, [reqFrequency, cbEndpoint, active]);

  useEffect(() => {
    sendMessage(JSON.stringify({l: msLatency}))
  }, [msLatency]);

  useEffect(() => {
    sendMessage(JSON.stringify({s: msStatus}))
  }, [msStatus]);

  useEffect(() => {
    const data = JSON.parse(requestStatus?.data || '{}');
    if (data && data.type) {
      if (data.type === 'start') {
        networkRequest[data.id] = {status: 'P', start: data.start, startAt: data.ts, id: data.id};
      } else {
        networkRequest[data.id].status = data.type.charAt(0);
        networkRequest[data.id].end = data.end;
        networkRequest[data.id].endAt = data.ts;
      }
    }
    const logs = Object.values(networkRequest);
    setRequestLog(logs);

    if (logs.length > 150) {
      delete networkRequest[logs[logs.length - 1].id - 150]
    }

  }, [requestStatus]);

  useEffect(() => {
    setInterval(() => {
      (async () => {
        const d = await axios.get('http://localhost:5000/cb-state');
        setCBState(d.data);
      })();
    }, 1000);
  }, [])

  return (
    <div className="App">
      <Row style={{width: '100%'}}>
        <Col span={18}>
          <h1>BFF</h1>
          <Checkbox onChange={(e) => {setActive(e.target.checked)}} checked={active}>Active</Checkbox>
          <Checkbox onChange={(e) => {setCBEndpoint(e.target.checked)}} checked={cbEndpoint}>Use Circuit Breaker Endpoint</Checkbox>
          <Slider defaultValue={1000} max={5000} onAfterChange={(e) => setReqFrequency(e)} />
          <span>BFF request on each {reqFrequency}ms</span>
          <div>
            circuit breaker status:
            {cbState && cbState?.cb?.state && <>
              { cbState.cb.state.closed && <Tag color="#87d068">Closed</Tag> }
              { cbState.cb.state.open && <Tag color="#f50">Open</Tag> }
              { cbState.cb.state.halfOpen && <Tag color="#2db7f5">half Open</Tag> }
            </>}
            <Row>
              <Col span={6}>
                <pre>
              <code>
                {JSON.stringify(cbState.cb, null, 2)}
              </code>
            </pre>
              </Col>
              <Col span={18}>
            {/*    <pre>*/}
            {/*  <code>*/}
            {/*    {JSON.stringify(cbState.stats, null, 2)}*/}
            {/*  </code>*/}
            {/*</pre>*/}
                <iframe src="http://localhost:5000/status" style={{width: '100%', height: '100%'}} frameborder="0"></iframe>
              </Col>
            </Row>
          </div>
        </Col>
        <Col span={6}>
          <h1>MicroService</h1>
          latency:
          <Slider defaultValue={1000} max={8000} onAfterChange={(e) => setMsLatency(e)} />
          <Button onClick={() => setMsStatus(200)}>200</Button>
          <Button onClick={() => setMsStatus(400)}>400</Button>
          <Button onClick={() => setMsStatus(404)}>404</Button>

          <h1>Network Reqeusts</h1>
          <div style={{maxHeight: '80vh', overflow: 'auto'}} id="scroll">{requestLog.map(log => <Row key={log.id}>
            <Col span={6}>{log.id}</Col>
            <Col span={6}>{log.start}</Col>
            <Col span={5}>{log.end}</Col>
            <Col span={2}>{log.status}</Col>
            <Col span={3}>{log.endAt - log.startAt}</Col>
          </Row>)}</div>
        </Col>
      </Row>
    </div>
  );
}

export default App;

