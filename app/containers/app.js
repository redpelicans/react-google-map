import _ from 'lodash'
import R from 'ramda'
import React, { Component } from 'react'
import { createStore } from 'redux'
import { connect } from 'react-redux'

import params from '../../params'

import MainAppSelector from '../selectors'
import { updatePosition, updateMap, updateFeatures, updateDisplayMask } from '../actions'

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
              2.3394012451171875,
              48.83398957668602
            ],
            [
              2.3394012451171875,
              48.86765074082236
            ],
            [
              2.36480712890625,
              48.86765074082236
            ],
            [
              2.36480712890625,
              48.83398957668602
            ],
            [
              2.3394012451171875,
              48.83398957668602
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
              2.2896194458007812,
              48.840542852103084
            ],
            [
              2.2896194458007812,
              48.86787657822752
            ],
            [
              2.3311614990234375,
              48.86787657822752
            ],
            [
              2.3311614990234375,
              48.840542852103084
            ],
            [
              2.2896194458007812,
              48.840542852103084
            ]
          ]
        ]
      }
}

const poly3 = {
"type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              2.271766662597656,
              48.85048411561242
            ],
            [
              2.271766662597656,
              48.857487002645485
            ],
            [
              2.396392822265625,
              48.857487002645485
            ],
            [
              2.396392822265625,
              48.85048411561242
            ],
            [
              2.271766662597656,
              48.85048411561242
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

const fetchNewShapes = (map, dispatch, position, currentFeatures, displayMask) => {
  if (!position.marginBounds || !map) return

  const screenRect = boundsToRectangle(position.marginBounds)
  dispatch(updateDisplayMask(screenRect))
  const screenShapes = _.isEmpty(displayMask) ? screenRect : turf.erase(screenRect, displayMask)

  if (!screenShapes) return

  console.log("Loading GeoJSON...")

  screenShapes.geometry.coordinates.forEach(coords => {
    const url = buildUrl(coordinatesToString((coords.length === 1) ? coords[0] : coords))
    fetch(url)
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
          fetchNewShapes(map, dispatch, position, props.features, props.displayMask)
        }}
        yesIWantToUseGoogleMapApiInternals
        zoom={position.zoom}
        center={position.center}
        onChange={position => {

          dispatch(updatePosition(position))
          fetchNewShapes(map, dispatch, position, props.features, props.displayMask)
        }}
      >
      </GoogleMap>
    </div>
  )
})
