import React, { Component } from 'react'
import { createStore } from 'redux'
import { connect } from 'react-redux'

import MainAppSelector from '../selectors'
import { updatePosition } from '../actions'

import GoogleMap from 'google-map-react'

const getPolygons = shapes => shapes.features.filter(x => x.geometry.type === "Polygon")
const getPoints = shapes => shapes.features.filter(x => x.geometry.type === "Point")

export default connect (MainAppSelector) (({dispatch, position}) => {
  return (
    <div style={{width: "100vw", height: "100vw"}}>
      <GoogleMap
        bootstrapURLKeys={{
            language: 'fr',
        }}

        onGoogleApiLoaded={({map, maps}) => {
          console.log("Loading GeoJSON...")

          fetch('http://rp3.redpelicans.com:5004/projects/56cf02e2901495657b2353e1/shapes/geojson?categories=Biens_fonds,MC_DDP,CS_Eau,CS_Sans_vegetation,CS_Verte&bounds=7.399669389048768,46.21034930581624;7.402128974715424,46.208647214700676&method=NOaggregate&geoUse=intersects')
          .then(res => res.json())
          .then(shapes => {
            shapes.features = getPoints(shapes)
            map.data.addGeoJson(shapes)
          })
          .catch(err => {
            console.log("ERROR: ", err)
          })
        }}
        yesIWantToUseGoogleMapApiInternals
        zoom={position.zoom}
        center={position.center}
        onChange={position => {
          dispatch(updatePosition(position))
        }}
      >
      </GoogleMap>
    </div>
  )
})
