require('dotenv').config();

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
  headers: {
    'x-honeycomb-team': process.env.HONEYCOMB_API_KEY,
    'x-honeycomb-dataset': 'marsoverse-dev', // or your dataset name
  },
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((err) => console.error('Error initializing tracing', err));

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Marsoverse backend running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Clean shutdown for tracing
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((err) => console.error('Error terminating tracing', err))
    .finally(() => process.exit(0));
});


// require('dotenv').config();
// require('./tracing'); // <-- this imports tracing.js and starts telemetry

// // your express server and other logic here
// const express = require('express');
// const app = express();
// const { NodeSDK } = require('@opentelemetry/sdk-node');
// const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

// const traceExporter = new OTLPTraceExporter({
//   url: 'https://api.honeycomb.io/v1/traces',
//   headers: {
//     'x-honeycomb-team': process.env.HONEYCOMB_API_KEY,
//     'x-honeycomb-dataset': 'marsoverse-dev',  // use your dataset name, probably "dev"
//   },
// });

// const sdk = new NodeSDK({
//   traceExporter,
//   instrumentations: [getNodeAutoInstrumentations()],
// });

// sdk.start()
//   .then(() => console.log('Tracing initialized'))
//   .catch((error) => console.log('Error initializing tracing', error));

// process.on('SIGTERM', () => {
//   sdk.shutdown()
//     .then(() => console.log('Tracing terminated'))
//     .catch((error) => console.log('Error terminating tracing', error))
//     .finally(() => process.exit(0));
// });
