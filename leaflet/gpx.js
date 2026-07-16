/**
 * Copyright (C) 2011-2012 Pavel Shramov
 * Copyright (C) 2013-2017 Maxime Petazzoni <maxime.petazzoni@bulix.org>
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without       
 * modification, are permitted provided that the following conditions are met:
 */
L.GPX = L.FeatureGroup.extend({
  options: {
    max_point_interval: 5 * 60 * 1000,
    marker_options: {
      startIconUrl: null,
      endIconUrl: null,
      wpIconUrl: null,
      shadowUrl: null,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    },
    polyline_options: {
      color: '#3388ff',
      opacity: 0.75,
      weight: 5,
      clickable: true
    },
    gpx_options: {
      parseElements: ['track', 'route', 'waypoint']
    }
  },
  initialize: function (gpx, options) {
    L.Util.setOptions(this, options);
    L.FeatureGroup.prototype.initialize.call(this, []);
    if (gpx) {
      this.addGPX(gpx);
    }
  },
  addGPX: function (gpx, options) {
    let url = gpx;
    this._gpx = gpx;
    this._parse_gpx(url, options);
  },
  _parse_gpx: function (url, options) {
    let _this = this;
    let cb = function (gpx) { _this._load_gpx(gpx); };
    this._load_xml(url, cb);
  },
  _load_xml: function (url, cb) {
    if (url.substr(0, 5) === '<?xml') {
      let parser = new DOMParser();
      cb(parser.parseFromString(url, "text/xml"));
      return;
    }
    let req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.overrideMimeType('text/xml');
    req.onreadystatechange = function () {
      if (req.readyState !== 4) return;
      if (req.status === 200) cb(req.responseXML);
    };
    req.send(null);
  },
  _load_gpx: function (gpx) {
    let layers = [];
    let elements = this.options.gpx_options.parseElements;
    if (elements.indexOf('route') > -1) {
      let rts = gpx.getElementsByTagName('rte');
      for (let i = 0; i < rts.length; i++) {
        layers = layers.concat(this._parse_segment(rts[i], 'rtept'));
      }
    }
    if (elements.indexOf('track') > -1) {
      let trks = gpx.getElementsByTagName('trk');
      for (let i = 0; i < trks.length; i++) {
        let trksegs = trks[i].getElementsByTagName('trkseg');
        for (let j = 0; j < trksegs.length; j++) {
          layers = layers.concat(this._parse_segment(trksegs[j], 'trkpt'));
        }
      }
    }
    for (let i = 0; i < layers.length; i++) {
      this.addLayer(layers[i]);
    }
    this.fire('loaded', { gpx: gpx });
  },
  _parse_segment: function (line, tag) {
    let el = line.getElementsByTagName(tag);
    if (!el.length) return [];
    let coords = [];
    for (let i = 0; i < el.length; i++) {
      let pt = el[i];
      coords.push(new L.LatLng(
        parseFloat(pt.getAttribute('lat')),
        parseFloat(pt.getAttribute('lon'))
      ));
    }
    return [new L.Polyline(coords, this.options.polyline_options)];
  }
});