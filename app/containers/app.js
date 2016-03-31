import _ from 'lodash'
import R from 'ramda'
import flyd from 'flyd'
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




///////// FRP UTILS ///////////////////
const every = (dur = 100) => {
  const s = flyd.stream()
  const timer = (first = false) => {
    if (s.end()) return
    const t = dur
    if (!first) s(t)
    setTimeout(timer, t)
  }
  timer(true)
  return s
}

const cacheUntil = trigger => stream => {
  let acc = []
  const cache = flyd.stream()

  flyd.on(x => acc.push(x), stream)

  return flyd.combine(() => {
    const newAcc = acc
    acc = []
    return newAcc.length ? newAcc : undefined
  }, [trigger])
}
//////////////////////////////




//////////// GEO UTILS //////////////////
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
//////////////////////////////



let displayedFeatures = {}
const fetchNewShapes = (map, position, displayMask) => (dispatch, getState) => {
  if (!position.marginBounds || !map) return

  const screenRect = boundsToRectangle(position.marginBounds)
  dispatch(updateDisplayMask(screenRect))
  const screenShapes = _.isEmpty(displayMask) ? screenRect : turf.erase(screenRect, displayMask)

  if (!screenShapes) return

  const streamFeatures = flyd.stream()
  const filter = flyd.combine((s) => {
    if (displayedFeatures[s().properties.id]) return undefined
    displayedFeatures[s().properties.id] = true
    return s()
  }, [streamFeatures])

  const cache = cacheUntil (every(100)) (filter)

  flyd.on((features) => {
    map.data.addGeoJson({type: "FeatureCollection", features})
  }, cache)

  screenShapes.geometry.coordinates.forEach(coords => {
    const req = buildReq(coordinatesToString((coords.length === 1) ? coords[0] : coords))
    socket.emit('fetchFeatures', req)
    socket.on('message', x => console.log(x))
    socket.on('fetchFeatures', streamFeatures)
  })
  console.log("Loading GeoJSON...")
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
