import mongobless, { ObjectId } from 'mongobless'
import _ from 'lodash';
import HTTPError from 'node-http-error';
import async  from 'async';
import fs from 'fs';

import util from 'util';
import debug from 'debug';
debug.enable('follow');
let follow = debug('follow');

@mongobless({collection: 'shapes'})
class Shape {}

@mongobless({collection: 'steps'})
class Step {}


function geojson(shape, options = {}) {

    if(!shape || !shape._id || !shape.geometry || !shape.geometry.type || !shape.geometry.coordinates)
        return {};

    if(shape.geometry.type != "Point" && shape.geometry.type != "LineString" && shape.geometry.type != "Polygon" && shape.geometry.type != "MultiPoint" && shape.geometry.type != "MultiLineString" && shape.geometry.type != "MultiPolygon" && shape.geometry.type != "GeometryCollection") {
        return {};
    }

    let feature = {
        type: 'Feature',
        geometry: {
            type: shape.geometry.type,
            coordinates: shape.geometry.coordinates
        },
        properties: {}
    }
    if(shape.crs)
        feature.crs = shape.crs;

    if(options.properties !== false && shape.properties)
         feature.properties = shape.properties;
    if(options.categories !== false && shape.categories)
        feature.properties.categories = shape.categories;
    if(options.importId !== false && shape.importId)
        feature.properties.importId = shape.importId;
    if(options.informations !== false && shape.informations)
        feature.properties.informations = shape.informations;
    if(options.labels !== false && shape.labels)
        feature.properties.labels = shape.labels;
    if(options.icons !== false && shape.icons)
        feature.properties.icons = shape.icons;

    if(shape.createdAt)
      feature.properties.createdAt = shape.createdAt;
    if(shape.updatedAt)
      feature.properties.updatedAt = shape.updatedAt;

    if(shape.type == 'Polygon') {
        // check that end coordinate is identical to first coordinate
        for(let positions of feature.geometry.coordinates) {
            if(positions[0] != positions[positions.length-1]) positions.push(positions[0]);
        }
    }

    if((!options.bbox || options.bbox === true) && shape.bbox) {
      feature.bbox = shapeHelpers.condensedBbox(shape.bbox);
    }

    feature.properties.id = shape._id;
    return feature;
}

function geojsonList(shapes, bbox = null, full = false) {
  follow('in geojsonList');
    //shapes = shapes.slice(0, 1500);

    let geojsonOptions = {
        properties: false || full,
        categories: true || full,
        importId: false || full,
        informations: false || full,
        labels: true || full,
        icons: true || full,
        bbox: false || full
    }

    let featureCollection = {
        type: 'FeatureCollection',
        features: _.remove(_.map(shapes, (shape) => {return geojson(shape, geojsonOptions);}), i => Object.keys(i).length !== 0)
    }

    /*
    if(bbox) {
      featureCollection.bbox = shapeHelpers.condensedBbox(bbox);
    }
    */

    follow('geojson ready');
    return featureCollection;
}



export function init(app) {
  app.get('/api/projects/:id/shapes/geojson', getShapesGeoJson);

  function getShapesFromReq(req, cb) {
    follow('In GetShapesFromReq');
    let projectId = ObjectId(req.params.id);

    getShapesFromReq_getProjectShapes(projectId, req.user, (err, shapeIds, project) => {
      if(err) return cb(err);
      if(shapeIds.length == 0) return cb(new HTTPError(404, 'No Shape found'));

      let stdQuery = {_id: {$in: shapeIds}, crs: 'EPSG:3857'};

      let geoQuery = getShapesFromReq_buildGeoQuery(req.query.bounds, req.query.polyBounds, req.query.geoUse);

      follow('geoQuery', geoQuery);

      if(req.query.method == 'aggregate') {
        let includeFields = {
          _id: 1,
          geometry: 1,
          geoIndex: 1,
          categories: 1,
          labels: 1
        };

        if(req.query.full == '1') {
          includeFields.crs = 1;
          includeFields.importId = 1;
          includeFields.guid = 1;
          includeFields.informations = 1;
          includeFields.labels = 1;
          includeFields.icons = 1;
          includeFields.properties = 1;
        }

        let pipeline = [];
        // first stage of pipeline: get the shapes filtered by categories (quick due to index)
        pipeline.push({$match: stdQuery.$query});
        // second stage: keep only the fields we are interested int
        pipeline.push({$project: includeFields});
        // third stage: if we have a geoquery, apply it to the set
        if(geoQuery) pipeline.push({$match: geoQuery});

        Shape.collection.aggregate(pipeline, (err, shapes)=> {
          if(err) return cb(err);
          if(!shapes) return cb(new HTTPError(404, 'No Shape found'));
          follow('Got the Shapes with aggregate method');
          return cb(null, shapes, project.bbox);
          });
      } else if(req.query.method == 'bbox') {
          // not implemented
      } else {
        let fieldsLimit = {bbox:0, originalData:0, informations:0, crs:0, createdAt:0, updatedAt:0, properties:0}
        if(req.query.full == '1') {
          fieldsLimit = {originalData:0}
        }

        //if(geoQuery) stdQuery.$query.$and.push(geoQuery);
        _.extend(stdQuery, geoQuery)

        Shape.findAll(stdQuery, fieldsLimit , (err, shapes) => {
            if(err) return cb(err);
            if(!shapes) return cb(new HTTPError(404, 'No Shape found'));
            follow('Got the Shapes with normal query method');
            return cb(null, shapes, project.bbox);
        });

      }

    });
  }

  function getShapesFromReq_getProjectShapes(projectId, user, cb) {
    Step.findOne({_id: projectId}, (err, project) => {
      follow('Got Project');
      if(err) return cb(err);
      if(!project) return cb(new HTTPError(404, 'No Project found'));

      //Step.findAll({projectId: projectId, "attachments.type": "shape"}, {attachments: 1}, (err, steps) => {
      Step.findAll({projectId: projectId}, {attachments: 1}, (err, steps) => {
        if(err) return cb(err);
        var hshapeIds = _.reduce(steps, (res, step) => {
          _.each(step.attachments, attachment => {if(attachment.type === 'shape') res[attachment.shapeId] = attachment.shapeId});
          return res
        },
        {});

        return cb(null, _.values(hshapeIds), project);
      });
    });
  }


  function getShapesFromReq_buildGeoQuery(bounds = null, polyBounds = null, use = 'both') {
    let geoQuery = null;
    if(bounds === null && polyBounds === null) return null;
    if(bounds !== null && polyBounds !== null) bounds = null;

    let geoWithin = null;
    let geoIntersects = null;

    if(bounds) {
      let points = bounds.split(';');
      let sw = points[0].split(',');
      let ne = points[1].split(',');

      let coordinates = [ [
        [ parseFloat(sw[0]), parseFloat(sw[1]) ],
        [ parseFloat(sw[0]), parseFloat(ne[1]) ],
        [ parseFloat(ne[0]), parseFloat(ne[1]) ],
        [ parseFloat(ne[0]), parseFloat(sw[1]) ],
        [ parseFloat(sw[0]), parseFloat(sw[1]) ]
      ] ];

      geoWithin = {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: coordinates
          }
        }
      }

      geoIntersects = {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: coordinates
          }
        }
      }

    }

    if(polyBounds) {
      let points = polyBounds.split(';');
      let polygon = [];
      for(let point of points) {
        let coords = point.split(',');
        coords[0] = parseFloat(coords[0]);
        coords[1] = parseFloat(coords[1]);
        polygon.push(coords);
      }
      let firstPoint = polygon[0];
      let lastPoint = polygon[polygon.length-1];
      if(firstPoint[0] != lastPoint[0] || firstPoint[1] != lastPoint[1]) {
        polygon.push(firstPoint);
      }

      geoWithin = {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: [polygon]
          }
        }
      }

      geoIntersects = {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: [polygon]
          }
        }
      }
    }

    if(use == 'within') {
      follow('use within geo query');
      geoQuery = {geoIndex: geoWithin}
    } else if(use == 'intersects') {
      follow('user intersects geo query');
      geoQuery = {geoIndex: geoIntersects}
    } else {
      follow('use both geo queries');
      geoQuery = {$or: [
        {geoIndex: geoWithin},
        {geoIndex: geoIntersects}
        ]};
    }

    return geoQuery;

  }

  function getShapesGeoJson(req, res, next) {

    let t0 = new Date()
    let full = false;
    if(req.query.full == '1') full = true;

      getShapesFromReq(req, (err, shapes, bbox) => {
          if(err) return next(err);
          t0 = new Date()
          const xx = JSON.stringify(geojsonList(shapes, bbox, full))
          //res.json(out.geojsonList(shapes, bbox, full));
          res.send(xx)
      });
  }
}
