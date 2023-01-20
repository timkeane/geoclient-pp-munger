import Vector from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import {register} from 'ol/proj/proj4'
import proj4 from 'proj4'

proj4.defs([
  ['EPSG:2263', '+proj=lcc +lat_1=41.03333333333333 +lat_2=40.66666666666666 +lat_0=40.16666666666666 +lon_0=-74 +x_0=300000.0000000001 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=ft +to_meter=0.3048006096012192 +no_defs'],
  ['EPSG:6539', '+proj=lcc +lat_1=40.66666666666666 +lat_2=41.03333333333333 +lat_0=40.16666666666666 +lon_0=-74 +x_0=300000 +y_0=0 +ellps=GRS80 +units=us-ft +no_defs']
])

register(proj4)

class Munger {

  /**
  * @public
  * @constructor
  * @param {Array<Munger.GeoJsonConfig>} configs 
  */
  constructor(configs, doLogging) {
    this.configs = configs
    this.doLogging = doLogging
    configs.forEach(config => {
      const format = new GeoJSON({
        dataProjection: config.inEpsg, 
        featureProjection: 'EPSG:2263'
      })
      config.source = new Vector({
        features: format.readFeatures(config.geoJsonFeatureCollection)
      })
    })
  }

  getCoordinate(geoclientResponse) {
    if (geoclientResponse.internalLabelXCoordinate !== undefined) {
      const x = geoclientResponse.internalLabelXCoordinate
      const y = geoclientResponse.internalLabelYCoordinate
      return [
        (x && y ? x : geoclientResponse.xCoordinate) * 1,
        (x && y ? y : geoclientResponse.yCoordinate) * 1
      ]
    }
    if (geoclientResponse.fromXCoordinate !== undefined) {
      const x = geoclientResponse.internalLabelXCoordinate
      const y = geoclientResponse.internalLabelYCoordinate
      return [
        (x && y ? x : geoclientResponse.xCoordinate) * 1,
        (x && y ? y : geoclientResponse.yCoordinate) * 1
      ]
    }
    return [
      geoclientResponse.xCoordinate * 1,
      geoclientResponse.yCoordinate * 1
    ]
  }

  munge(geoclientResponse) {
    const coordinate = this.getCoordinate(geoclientResponse)
    this.configs.forEach(config => {
      const old = geoclientResponse[config.geoClientProp]
      if (old !== undefined) {
        const features = config.source.getFeaturesAtCoordinate(coordinate)
        if (features.length === 1) {
          const id = features[0].get(config.idProp)
          geoclientResponse[config.geoClientProp] = id
          if (config.doLogging)
            console.log({
              message: `Found one "${config.idProp}" feature. Munging "${config.geoClientProp}".`,
              before: `"${config.geoClientProp}" = "${old}"`,
              after: `"${config.geoClientProp}" = "${id}"`,
              geoclientResponse,
              config,
              features
            })
        } else if (config.doLogging) {
          console.warn({
            message: `${features.length} ${config.idProp} features found for ${geoclientResponse.request}. "${config.geoClientProp}" will not be changed`,
            before: `"${config.geoClientProp}" = "${old}"`,
            after: `"${config.geoClientProp}" = "${old}"`,
            geoclientResponse,
            config,
            features
          })
        }
      } else if (config.doLogging) {
        console.warn({
          message: `"${config.geoClientProp}" not found in geoclient response`,
          geoclientResponse,
          config
        })
      }
    })
  }

}

/**
 * @public
 * @typedef {Object}
 * @property {Object} geoJsonFeatureCollection GeoJSON FeatureCollection
 * @property {string} inEspg The projection in which the GeoJSON will be returned
 * @property {string} idProp The feature property to use as an identifier
 * @property {string} geoClientProp The geoclient result field to replace with the idProp
 * @property {boolean} [doLogging=false]
 */
Munger.GeoJsonConfig

/**
 * @public
 * @typedef {Object}
 * @property {Object} url GeoJSON URL
 * @property {string} inEspg The projection in which the GeoJSON will be returned
 * @property {string} idProp The feature property to use as an identifier
 * @property {string} geoClientProp The geoclient result field to replace with the idProp
 * @property {boolean} [doLogging=false]
 */
Munger.UrlConfig

/**
 * @public
 * @static
 * @method
 * @param {Array<Munger.UrlConfig>} configs
 * @return {Promise}
 */
Munger.createInstance = configs => {
  return new Promise((resolve, reject) => {
    try {
      let count = 0
      configs.forEach(config => {
        fetch(config.url).then(response => {
          response.json().then(geoJsonFeatureCollection => {
            config.geoJsonFeatureCollection = geoJsonFeatureCollection
            count = count + 1
            if (count === configs.length) {
              resolve(new Munger(configs))
            }
          })
        })
      })
    } catch (error) {
      reject(error)
    }
  })
}

export default Munger
