module.exports = {
  db: {
    host: 'mongodev',
    port: 27017,
    options:{
      auto_reconnect: true,
      poolSize: 10,
      w: 1,
      strict: true,
      native_parser: true
    },
    database: 'mintello-benchmarking',
  }
}
