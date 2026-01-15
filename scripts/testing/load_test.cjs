const autocannon = require('autocannon');

const runLoadTest = () => {
  const instance = autocannon({
    url: 'http://localhost:3002/api/health',
    connections: 10, // default
    pipelining: 1, // default
    duration: 10 // default
  });

  autocannon.track(instance, { renderProgressBar: true });

  instance.on('done', (result) => {
    console.log('Load Test Result:', result);
  });
};

runLoadTest();
