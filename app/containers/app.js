import _ from 'lodash'
import R from 'ramda'
import React, { Component } from 'react'
import { createStore } from 'redux'
import { connect } from 'react-redux'

import params from '../../params'

import MainAppSelector from '../selectors'
import { updatePosition, updateMap, updateFeatures } from '../actions'

import turf from 'turf'
import GoogleMap from 'google-map-react'

const poly1 = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              2.3229217529296875,
              48.8737479930069
            ],
            [
              2.3229217529296875,
              48.897678169122194
            ],
            [
              2.3696136474609375,
              48.897678169122194
            ],
            [
              2.3696136474609375,
              48.8737479930069
            ],
            [
              2.3229217529296875,
              48.8737479930069
            ]
          ]
        ]
      }
}

const poly2 = {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              2.3129653930664062,
              48.86923158125418
            ],
            [
              2.3129653930664062,
              48.902304853438
            ],
            [
              2.3788833618164062,
              48.902304853438
            ],
            [
              2.3788833618164062,
              48.86923158125418
            ],
            [
              2.3129653930664062,
              48.86923158125418
            ]
          ]
        ]
      }
}

const getPolygons = shapes => shapes.features.filter(x => x.geometry.type === "Polygon")
const getPoints = shapes => shapes.features.filter(x => x.geometry.type === "Point")

/*
const boundsToString = b => {
  return b.nw.lng + "," + b.nw.lat + ";" + b.se.lng + "," + b.se.lat
}
*/

const rectangleToString = rect => {
  return _.reduce(rect.geometry.coordinates[0], (acc, p) => {
    return acc + p[0] + "," + p[1] + ";"
  }, "")
}

const boundsToRectangle = b => {
  return turf.envelope(turf.linestring([
    [b.nw.lng, b.nw.lat],
    [b.se.lng, b.se.lat],
  ]))
}

const boundsToString = R.compose (R.dropLast(1), rectangleToString, boundsToRectangle)

const buildUrl = (({ baseUrl, projectId, categories, method, geoUse }) => bounds => {
  return baseUrl + "/api/projects/" + projectId
          + "/shapes/geojson?categories=" + categories
          + "&polyBounds=" + boundsToString(bounds)
          + "&method=" + method
          + "&geoUse=" + geoUse
})(params.query)

const fetchNewShapes = (map, dispatch, position, currentFeatures) => {
  if (!position.marginBounds || !map) return
  console.log("Loading GeoJSON...")
  fetch(buildUrl(position.marginBounds))
  .then(res => res.json())
  .then(collection => {
    console.log(collection.features.length + " features loaded.");
    const filteredCollection = {...collection, features: getPolygons(collection)}
    dispatch(updateFeatures(currentFeatures, filteredCollection, map))
    console.log("Loaded.")
  })
  .catch(err => {
    console.log("ERROR: ", err)
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
          //map.data.addGeoJson(turf.erase(poly1, poly2))
          //console.log("HERE: ", turf.erase(poly1, poly2))
          fetchNewShapes(map, dispatch, position, props.features)
        }}
        yesIWantToUseGoogleMapApiInternals
        zoom={position.zoom}
        center={position.center}
        onChange={position => {
          console.log(JSON.stringify(boundsToRectangle(position.marginBounds)))

          dispatch(updatePosition(position))
          fetchNewShapes(map, dispatch, position, props.features)
        }}
      >
      </GoogleMap>
    </div>
  )
})
