import _ from 'lodash'
import R from 'ramda'
import React, { Component } from 'react'
import { createStore } from 'redux'
import { connect } from 'react-redux'
import io from 'socket.io-client'

import params from '../../params'

import MainAppSelector from '../selectors'
import { updatePosition, updateMap, updateFeatures, updateDisplayMask } from '../actions'

import turf from 'turf'
import GoogleMap from 'google-map-react'

let socket = io.connect(params.query.baseUrl)

const getPolygons = features => features.filter(x => x.geometry.type === "Polygon")
const getPoints = features => features.filter(x => x.geometry.type === "Point")

const boundsToRectangle = b => {
  return turf.envelope(turf.linestring([
    [b.nw.lng, b.nw.lat],
    [b.se.lng, b.se.lat],
  ]))
}

const coordinatesToString = coords => {
  return R.dropLast(1) (_.reduce(coords, (acc, p) => {
    return acc + p[0] + "," + p[1] + ";"
  }, ""))
}

const buildUrl = (({ baseUrl, projectId, categories, method, geoUse }) => screenShape => {
  return baseUrl + "/api/projects/" + projectId
          + "/shapes/geojson?categories=" + categories
          + "&polyBounds=" + screenShape
          + "&method=" + method
          + "&geoUse=" + geoUse
})(params.query)

const buildReq = (({projectId, categories, method, geoUse}) => screenShape => {
  return {
    params: {id: projectId},
    query: {
      polyBounds: screenShape,
      geoUse,
      method,
      categories,
    },
  }
})(params.query)

const fetchNewShapes = (map, position, displayMask) => (dispatch, getState) => {
  if (!position.marginBounds || !map) return

  const screenRect = boundsToRectangle(position.marginBounds)
  dispatch(updateDisplayMask(screenRect))
  const screenShapes = _.isEmpty(displayMask) ? screenRect : turf.erase(screenRect, displayMask)

  if (!screenShapes) return

  console.log("Loading GeoJSON...")

  screenShapes.geometry.coordinates.forEach(coords => {
    const req = buildReq(coordinatesToString((coords.length === 1) ? coords[0] : coords))
    socket.emit('fetchFeatures', req)
    socket.on('fetchFeatures', feature => {
      if (feature.geometry.type === 'Polygon') {
          dispatch(updateFeatures(getState().features, feature, map))
      }
    })
  })
}

export default connect (MainAppSelector) (({dispatch, position, map, ...props}) => {
  return (
    <div style={{width: "100vw", height: "100vw"}}>
      <GoogleMap
        bootstrapURLKeys={{
            language: 'fr',
        }}

        onGoogleApiLoaded={({map, maps}) => {
          dispatch(updateMap(map))
          dispatch(fetchNewShapes(map, position, props.displayMask))
        }}
        yesIWantToUseGoogleMapApiInternals
        zoom={position.zoom}
        center={position.center}
        onChange={position => {

          dispatch(updatePosition(position))
          dispatch(fetchNewShapes(map, position, props.displayMask))
        }}
      >
      </GoogleMap>
    </div>
  )
})
