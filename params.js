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
  },
  query: {
    baseUrl: "http://rp3.redpelicans.com:5004",
    projectId: "56cf02e2901495657b2353e1",
    categories: "Biens_fonds,MC_DDP,CS_Eau,CS_Sans_vegetation,CS_Verte",
    method: "NOaggregate",
    geoUse: "intersects"
  }
}
