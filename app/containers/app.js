import React, { Component } from 'react'
import { createStore } from 'redux'
import { connect } from 'react-redux'

import params from '../../params'

import MainAppSelector from '../selectors'
import { updatePosition, updateMap } from '../actions'

import GoogleMap from 'google-map-react'

const getPolygons = shapes => shapes.features.filter(x => x.geometry.type === "Polygon")
const getPoints = shapes => shapes.features.filter(x => x.geometry.type === "Point")

const boundsToString = b => {
  return b.nw.lng + "," + b.nw.lat + ";" + b.se.lng + "," + b.se.lat
}

const buildUrl = (({ baseUrl, projectId, categories, method, geoUse }) => bounds => {
  return baseUrl + "/api/projects/" + projectId
          + "/shapes/geojson?categories=" + categories
          + "&bounds=" + boundsToString(bounds)
          + "&method=" + method
          + "&geoUse=" + geoUse
})(params.query)

const fetchNewShapes = (map, dispatch, position) => {
  if (!position.bounds) return
  console.log("Loading GeoJSON...")
  fetch(buildUrl(position.bounds))
  .then(res => res.json())
  .then(shapes => {
    shapes.features = getPoints(shapes)
    map.data.addGeoJson(shapes)
    console.log("Loaded.")
  })
  .catch(err => {
    console.log("ERROR: ", err)
  })
}

export default connect (MainAppSelector) (({dispatch, position, map}) => {
  return (
    <div style={{width: "100vw", height: "100vw"}}>
      <GoogleMap
        bootstrapURLKeys={{
            language: 'fr',
        }}

        onGoogleApiLoaded={({map, maps}) => {
          dispatch(updateMap(map))
          fetchNewShapes(map, dispatch, position)
        }}
        yesIWantToUseGoogleMapApiInternals
        zoom={position.zoom}
        center={position.center}
        onChange={position => {
          dispatch(updatePosition(position))
          if (map) fetchNewShapes(map, dispatch, position)
        }}
      >
      </GoogleMap>
    </div>
  )
})
