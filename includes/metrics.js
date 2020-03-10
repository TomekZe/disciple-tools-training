jQuery(document).ready(function() {
    console.log(dtTrainingMetrics)
    if( ! window.location.hash || '#overview' === window.location.hash  ) {
      jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_overview()
    }
    if( '#basic_map' === window.location.hash) {
      jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_basicmap()
    }
    if( '#heat_map_1' === window.location.hash) {
      jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_heatmap1()
    }
    if( '#heat_map_2' === window.location.hash) {
      jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_heatmap2()
    }
    if( '#heat_map_3' === window.location.hash) {
      jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_heatmap3()
    }
    if( '#heat_map_4' === window.location.hash) {
      jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_heatmap4()
    }
    if( '#heat_map_5' === window.location.hash) {
      jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_heatmap5()
    }
    if( '#heat_map_6' === window.location.hash) {
        jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_heatmap6()
    }

})

function write_training_overview() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<h2>Overview</h2>`)


}

function write_training_basicmap() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<h2>Basic Map</h2>`)

}

function write_training_heatmap1() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${obj.plugin_uri}spinner.svg" width="30px" alt="spinner" />`)

    chart.empty().html(`
    <style>
        #map-wrapper {
            position: relative;
            height: ${window.innerHeight - 100}px; 
            width:100%;
        }
        #map { 
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
            width:100%;
            height: ${window.innerHeight - 100}px; 
         }
         #legend {
            position: absolute;
            top: 50px;
            right: 20px;
            z-index: 10;
         }
         #data {
            word-wrap: break-word;
         }
        .legend {
            background-color: #fff;
            border-radius: 3px;
            width: 250px;
            
            box-shadow: 0 1px 2px rgba(0,0,0,0.10);
            font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
            padding: 10px;
        }
        .legend h4 {
            margin: 0 0 10px;
        }    
        .legend div span {
            border-radius: 50%;
            display: inline-block;
            height: 10px;
            margin-right: 5px;
            width: 10px;
        }
    </style>
    <div id="map-wrapper">
        <div id='map'></div>
        <div id='legend' class='legend'>
            <h4>Location Information</h4><hr>
        <div id="data">Sample of a points cluster map</div>
    </div>
    </div>
    `)
    //https://docs.mapbox.com/api/maps/#styles

    mapboxgl.accessToken = obj.map_key;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-98, 38.88],
        minZoom: 0,
        zoom: 0
    });
    map.addControl(new mapboxgl.FullscreenControl());


    map.on('load', function() {
// Add a new source from our GeoJSON data and
// set the 'cluster' option to true. GL-JS will
// add the point_count property to your source data.
        map.addSource('earthquakes', {
            type: 'geojson',
// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
            data:
                'https://global.zume.network.local/wp-content/plugins/disciple-tools-training/includes/trainings-geojson.php',
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'earthquakes',
            filter: ['has', 'point_count'],
            paint: {
// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
// with three steps to implement three types of circles:
//   * Blue, 20px circles when point count is less than 100
//   * Yellow, 30px circles when point count is between 100 and 750
//   * Pink, 40px circles when point count is greater than or equal to 750
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    100,
                    '#f1f075',
                    750,
                    '#f28cb1'
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    100,
                    30,
                    750,
                    40
                ]
            }
        });

        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'earthquakes',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'earthquakes',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#11b4da',
                'circle-radius': 4,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });

// inspect a cluster on click
        map.on('click', 'clusters', function(e) {
            var features = map.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });
            var clusterId = features[0].properties.cluster_id;
            map.getSource('earthquakes').getClusterExpansionZoom(
                clusterId,
                function(err, zoom) {
                    if (err) return;

                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                }
            );
        });

// When a click event occurs on a feature in
// the unclustered-point layer, open a popup at
// the location of the feature, with
// description HTML from its properties.
        map.on('click', 'unclustered-point', function(e) {

            var coordinates = e.features[0].geometry.coordinates.slice();
            var mag = e.features[0].properties.mag;
            var tsunami;

            if (e.features[0].properties.tsunami === 1) {
                tsunami = 'yes'
            } else {
                tsunami = 'no'
            }

// Ensure that if the map is zoomed out such that
// multiple copies of the feature are visible, the
// popup appears over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            jQuery('#data').empty().html("<br>magnitude: <br><h1>" + mag + "</h1><br>Was there a tsunami?: " + tsunami)
            // new mapboxgl.Popup()
            //     .setLngLat(coordinates)
            //     .setHTML("magnitude: " + mag + "<br>Was there a tsunami?: " + tsunami)
            //     .addTo(map);
        });

        map.on('mouseenter', 'clusters', function() {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', function() {
            map.getCanvas().style.cursor = '';
        });
    });

}

function write_training_heatmap2() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${obj.plugin_uri}spinner.svg" width="30px" alt="spinner" />`)

    chart.empty().html(`
        <style>
            #map-wrapper {
                position: relative;
                height: ${window.innerHeight - 100}px; 
                width:100%;
            }
            #map { 
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                width:100%;
                height: ${window.innerHeight - 100}px; 
             }
             #legend {
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 10;
             }
            .legend {
                background-color: #fff;
                border-radius: 3px;
                width: 250px;
                
                box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
                padding: 10px;
            }
            .legend h4 {
                margin: 0 0 10px;
            }
        
            .legend div span {
                border-radius: 50%;
                display: inline-block;
                height: 10px;
                margin-right: 5px;
                width: 10px;
            }
        </style>
        <div id="map-wrapper">
            <div id='map'></div>
            <div id='legend' class='legend'>
                <h4>Coordinates</h4>
            <div id="data"></div>
        </div>
        </div>
        

        
     `)

    mapboxgl.accessToken = obj.map_key;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-98, 38.88],
        minZoom: 0,
        zoom: 0
    });

    var zoomThreshold = 4;

    map.on('load', function() {

        map.addSource('world', {
            type: 'geojson',
            data: 'https://storage.googleapis.com/location-grid-mirror/collection/1.geojson'
        });
        map.addSource('100364199', {
            type: 'geojson',
            data: 'https://storage.googleapis.com/location-grid-mirror/collection/100364199.geojson'
        });
        map.addSource('100364205', {
            type: 'geojson',
            data: 'https://storage.googleapis.com/location-grid-mirror/collection/100364205.geojson'
        });
        map.addLayer({
            "id": '1' + Date.now() + Math.random(),
            "type": "fill",
            "source": 'world',
            'maxzoom': 3.7,
            "paint": {
                "fill-color": "#A25626",
                "fill-opacity": 0.4

            },
            "filter": ["==", "$type", "Polygon"]
        });
        map.addLayer({
            "id": '1' + Date.now() + Math.random(),
            "type": "fill",
            "source": '100364199',
            'minzoom': 3.7,
            'maxzoom': 6.5,
            "paint": {
                "fill-color": "#A25626",
                "fill-opacity": 0.4

            },
            "filter": ["==", "$type", "Polygon"]
        });
        map.addLayer({
            "id": '1' + Date.now() + Math.random(),
            "type": "fill",
            "source": '100364205',
            'minzoom': 6.5,
            "paint": {
                "fill-color": "#A25626",
                "fill-opacity": 0.4

            },
            "filter": ["==", "$type", "Polygon"]
        });

    });
    document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds()


    let level = 0
    map.on('zoom', function() {
        // world
        if ( map.getZoom() < 3.7 && level !== 0 ) {
            level = 0

            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds()

            let bbox = map.getBounds()
            jQuery.get('https://global.zume.network.local/wp-content/themes/disciple-tools-theme/dt-mapping/location-grid-list-api.php',
                {
                    type: 'match_within_bbox',
                    north_latitude: bbox._ne.lat,
                    south_latitude: bbox._sw.lat,
                    west_longitude: bbox._sw.lng,
                    east_longitude: bbox._ne.lng,
                    level: level,
                    nonce: '12345'
                }, null, 'json' ).done(function(data) {
                console.log(data)
            })

        }
        // country
        if ( map.getZoom() >= 3.7 && map.getZoom() < 6.5 && level !== 1 ) {
            level = 1

            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds()

            // query which states are within bounding box boundaries

            // loop through grid_id's
            // add sources
            // add layers
            // add grid_id to    list

            let bbox = map.getBounds()
            jQuery.get('https://global.zume.network.local/wp-content/themes/disciple-tools-theme/dt-mapping/location-grid-list-api.php',
                {
                    type: 'match_within_bbox',
                    north_latitude: bbox._ne.lat,
                    south_latitude: bbox._sw.lat,
                    west_longitude: bbox._sw.lng,
                    east_longitude: bbox._ne.lng,
                    level: level,
                    nonce: '12345'
                }, null, 'json' ).done(function(data) {
                console.log(data)
            })



        }
        // state
        if ( map.getZoom() >= 6.5  && level !== 2 ) {
            level = 2

            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds()

            let bbox = map.getBounds()
            jQuery.get('https://global.zume.network.local/wp-content/themes/disciple-tools-theme/dt-mapping/location-grid-list-api.php',
                {
                    type: 'match_within_bbox',
                    north_latitude: bbox._ne.lat,
                    south_latitude: bbox._sw.lat,
                    west_longitude: bbox._sw.lng,
                    east_longitude: bbox._ne.lng,
                    level: level,
                    nonce: '12345'
                }, null, 'json' ).done(function(data) {
                console.log(data)
            })

        }
    })

}

function write_training_heatmap3() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${obj.plugin_uri}spinner.svg" width="30px" alt="spinner" />`)

    chart.empty().html(`
        <style>
            #map-wrapper {
                position: relative;
                height: ${window.innerHeight - 100}px; 
                width:100%;
            }
            #map { 
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                width:100%;
                height: ${window.innerHeight - 100}px; 
             }
             #legend {
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 10;
             }
             #data {
                word-wrap: break-word;
             }
            .legend {
                background-color: #fff;
                border-radius: 3px;
                width: 250px;
                
                box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
                padding: 10px;
            }
            .legend h4 {
                margin: 0 0 10px;
            }    
            .legend div span {
                border-radius: 50%;
                display: inline-block;
                height: 10px;
                margin-right: 5px;
                width: 10px;
            }
        </style>
        <div id="map-wrapper">
            <div id='map'></div>
            <div id='legend' class='legend'>
                <h4>Location Information</h4><hr>
            <div id="data"></div>
        </div>
        </div>
     `)

    mapboxgl.accessToken = obj.map_key;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-98, 38.88],
        minZoom: 0,
        zoom: 0
    });
    map.on('load', function() {


        map.addLayer({
            'id': 'states-layer-outline',
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': 'https://storage.googleapis.com/location-grid-mirror/collection/1.geojson'
            },
            'paint': {
                'line-color': 'black',
                'line-width': 2
            }
        });

    })

    /***********************************
     * Click
     ***********************************/
    map.on('click', function (e) {
        console.log(e)

        let level = jQuery('#level').val()

        let lng = e.lngLat.lng
        let lat = e.lngLat.lat

        if (lng > 180) {
            lng = lng - 180
            lng = -Math.abs(lng)
        } else if (lng < -180) {
            lng = lng + 180
            lng = Math.abs(lng)
        }

        window.active_lnglat = [lng, lat]

        // add marker
        if (window.active_marker) {
            window.active_marker.remove()
        }
        window.active_marker = new mapboxgl.Marker()
            .setLngLat(e.lngLat)
            .addTo(map);

        jQuery.get(obj.theme_uri + 'dt-mapping/location-grid-list-api.php',
            {
                type: 'geocode',
                longitude: lng,
                latitude: lat,
                level: 'admin0',
                country_code: null,
                nonce: obj.nonce
            }, null, 'json').done(function (data) {
            if (data) {
                jQuery('#data').empty().html(`
                    <p><strong>${data.name}</strong></p>
                    <p>Population: ${data.population}</p>
                    `)
            }
            console.log(data)
        });
    })
}

function write_training_heatmap4() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${obj.plugin_uri}spinner.svg" width="30px" alt="spinner" />`)

    chart.empty().html(`
    <style>
        #map-wrapper {
            position: relative;
            height: ${window.innerHeight - 100}px; 
            width:100%;
        }
        #map { 
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
            width:100%;
            height: ${window.innerHeight - 100}px; 
         }
         #legend {
            position: absolute;
            top: 50px;
            right: 20px;
            z-index: 10;
         }
         #data {
            word-wrap: break-word;
         }
        .legend {
            background-color: #fff;
            border-radius: 3px;
            width: 250px;
            
            box-shadow: 0 1px 2px rgba(0,0,0,0.10);
            font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
            padding: 10px;
        }
        .legend h4 {
            margin: 0 0 10px;
        }    
        .legend div span {
            border-radius: 50%;
            display: inline-block;
            height: 10px;
            margin-right: 5px;
            width: 10px;
        }
    </style>
    <div id="map-wrapper">
        <div id='map'></div>
        <div id='legend' class='legend'>
            <h4>Location Information</h4><hr>
        <div id="data">Sample of a points cluster map</div>
    </div>
    </div>
    `)
    //https://docs.mapbox.com/api/maps/#styles

    mapboxgl.accessToken = obj.map_key;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-98, 38.88],
        minZoom: 0,
        zoom: 0
    });
    map.addControl(new mapboxgl.FullscreenControl());

    map.on('load', function() {
// Add a geojson point source.
// Heatmap layers also work with a vector tile source.
        map.addSource('earthquakes', {
            'type': 'geojson',
            'data':
                'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
        });

        map.addLayer(
            {
                'id': 'earthquakes-heat',
                'type': 'heatmap',
                'source': 'earthquakes',
                'maxzoom': 9,
                'paint': {
// Increase the heatmap weight based on frequency and property magnitude
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        0,
                        0,
                        6,
                        1
                    ],
// Increase the heatmap color weight weight by zoom level
// heatmap-intensity is a multiplier on top of heatmap-weight
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0,
                        1,
                        9,
                        3
                    ],
// Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
// Begin color ramp at 0-stop with a 0-transparancy color
// to create a blur-like effect.
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0,
                        'rgba(33,102,172,0)',
                        0.2,
                        'rgb(103,169,207)',
                        0.4,
                        'rgb(209,229,240)',
                        0.6,
                        'rgb(253,219,199)',
                        0.8,
                        'rgb(239,138,98)',
                        1,
                        'rgb(178,24,43)'
                    ],
// Adjust the heatmap radius by zoom level
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0,
                        2,
                        9,
                        20
                    ],
// Transition from heatmap to circle layer by zoom level
                    'heatmap-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        7,
                        1,
                        9,
                        0
                    ]
                }
            },
            'waterway-label'
        );

        map.addLayer(
            {
                'id': 'earthquakes-point',
                'type': 'circle',
                'source': 'earthquakes',
                'minzoom': 7,
                'paint': {
// Size circle radius by earthquake magnitude and zoom level
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        7,
                        ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 6, 4],
                        16,
                        ['interpolate', ['linear'], ['get', 'mag'], 1, 5, 6, 50]
                    ],
// Color circle by earthquake magnitude
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        1,
                        'rgba(33,102,172,0)',
                        2,
                        'rgb(103,169,207)',
                        3,
                        'rgb(209,229,240)',
                        4,
                        'rgb(253,219,199)',
                        5,
                        'rgb(239,138,98)',
                        6,
                        'rgb(178,24,43)'
                    ],
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1,
// Transition from heatmap to circle layer by zoom level
                    'circle-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        7,
                        0,
                        8,
                        1
                    ]
                }
            },
            'waterway-label'
        );
    });

}

function write_training_heatmap5() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${obj.plugin_uri}spinner.svg" width="30px" alt="spinner" />`)

    chart.empty().html(`
        <style>
            #map-wrapper {
                position: relative;
                height: ${window.innerHeight - 100}px; 
                width:100%;
            }
            #map { 
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                width:100%;
                height: ${window.innerHeight - 100}px; 
             }
             #legend {
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 10;
             }
             #data {
                word-wrap: break-word;
             }
            .legend {
                background-color: #fff;
                border-radius: 3px;
                width: 250px;
                
                box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
                padding: 10px;
            }
            .legend h4 {
                margin: 0 0 10px;
            }    
            .legend div span {
                border-radius: 50%;
                display: inline-block;
                height: 10px;
                margin-right: 5px;
                width: 10px;
            }
        </style>
        <div id="map-wrapper">
            <div id='map'></div>
            <div id='legend' class='legend'>
                <h4>Location Information</h4><hr>
            <div id="data"></div>
        </div>
        </div>
     `)

    mapboxgl.accessToken = obj.map_key;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-98, 38.88],
        minZoom: 0,
        zoom: 0
    });
    map.on('load', function() {


        map.addLayer({
            'id': 'states-layer-outline',
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': 'https://storage.googleapis.com/location-grid-mirror/collection/1.geojson'
            },
            'paint': {
                'line-color': 'black',
                'line-width': 2
            }
        });

    })

    window.zoom_level = 0
    map.on('zoom', function() {
        if ( map.getZoom() >= 1 && map.getZoom() < 2 && window.zoom_level !== 1 ) {
            window.zoom_level = 1
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 1</h1>'
        }
        if ( map.getZoom() >= 2 && map.getZoom() < 3 && window.zoom_level !== 2 ) {
            window.zoom_level = 2
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 2</h1>'
        }
        if ( map.getZoom() >= 3 && map.getZoom() < 4 && window.zoom_level !== 3 ) {
            window.zoom_level = 3
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 3</h1>'
        }
        if ( map.getZoom() >= 4 && map.getZoom() < 5 && window.zoom_level !== 4 ) {
            window.zoom_level = 4
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 4</h1>'
        }
        if ( map.getZoom() >= 5 && map.getZoom() < 6 && window.zoom_level !== 5 ) {
            window.zoom_level = 5
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 5</h1>'
        }
        if ( map.getZoom() >= 6 && map.getZoom() < 7 && window.zoom_level !== 6 ) {
            window.zoom_level = 6
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 6</h1>'
        }
        if ( map.getZoom() >= 7 && map.getZoom() < 8 && window.zoom_level !== 7 ) {
            window.zoom_level = 7
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 7</h1>'
        }
        if ( map.getZoom() >= 8 && map.getZoom() < 9 && window.zoom_level !== 8 ) {
            window.zoom_level = 8
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 8</h1>'
        }
        if ( map.getZoom() >= 9 && map.getZoom() < 10 && window.zoom_level !== 9 ) {
            window.zoom_level = 9
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 9</h1>'
        }
        if ( map.getZoom() >= 10 && map.getZoom() < 11 && window.zoom_level !== 10 ) {
            window.zoom_level = 10
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 10</h1>'
        }
        if ( map.getZoom() >= 11 && map.getZoom() < 12 && window.zoom_level !== 11 ) {
            window.zoom_level = 11
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 11</h1>'
        }
        if ( map.getZoom() >= 12 && map.getZoom() < 13 && window.zoom_level !== 12 ) {
            window.zoom_level = 12
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 12</h1>'
        }
        if ( map.getZoom() >= 13 && map.getZoom() < 14 && window.zoom_level !== 13 ) {
            window.zoom_level = 13
            document.getElementById('data').innerHTML = 'zoom: ' + map.getZoom() + '<br>center: ' + map.getCenter() + '<br>boundary: ' + map.getBounds() + '<h1>Level 13</h1>'
        }


    })

    /***********************************
     * Click
     ***********************************/
    map.on('click', function (e) {
        console.log(e)

        let level = 'admin0'
        if ( window.zoom_level >= 5  && window.zoom_level < 7 ) {
            level = 'admin1'
        } else if ( window.zoom_level >= 7  && window.zoom_level < 13  ) {
            level = 'admin2'
        }

        let lng = e.lngLat.lng
        let lat = e.lngLat.lat

        if (lng > 180) {
            lng = lng - 180
            lng = -Math.abs(lng)
        } else if (lng < -180) {
            lng = lng + 180
            lng = Math.abs(lng)
        }

        window.active_lnglat = [lng, lat]

        // add marker
        if (window.active_marker) {
            window.active_marker.remove()
        }
        window.active_marker = new mapboxgl.Marker()
            .setLngLat(e.lngLat)
            .addTo(map);

        jQuery.get(obj.theme_uri + 'dt-mapping/location-grid-list-api.php',
            {
                type: 'geocode',
                longitude: lng,
                latitude: lat,
                level: level,
                country_code: null,
                nonce: obj.nonce
            }, null, 'json').done(function (data) {
            if (data) {
                jQuery('#data').empty().html(`
                    <p><strong>${data.name}</strong></p>
                    <p>Population: ${data.population}</p>
                    `)
            }

            map.addLayer({
                'id': data.grid_id,
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': 'https://storage.googleapis.com/location-grid-mirror/low/'+data.grid_id+'.geojson'
                },
                'paint': {
                    'line-color': 'red',
                    'line-width': 2
                }
            });

            console.log(data)
        });
    })



}

function write_training_heatmap6() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${obj.plugin_uri}spinner.svg" width="30px" alt="spinner" />`)

    tAPI.heatmap()
        .then(data=>{
            console.log(data)

            let geojson = JSON.stringify( data )

            chart.empty().html(`
            <style>
                #map-wrapper {
                    position: relative;
                    height: ${window.innerHeight - 100}px; 
                    width:100%;
                }
                #map { 
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 1;
                    width:100%;
                    height: ${window.innerHeight - 100}px; 
                 }
                 #legend {
                    position: absolute;
                    top: 50px;
                    right: 20px;
                    z-index: 10;
                 }
                 #data {
                    word-wrap: break-word;
                 }
                .legend {
                    background-color: #fff;
                    border-radius: 3px;
                    width: 250px;
                    
                    box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                    font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
                    padding: 10px;
                }
                .legend h4 {
                    margin: 0 0 10px;
                }    
                .legend div span {
                    border-radius: 50%;
                    display: inline-block;
                    height: 10px;
                    margin-right: 5px;
                    width: 10px;
                }
            </style>
            <div id="map-wrapper">
                <div id='map'></div>
                <div id='legend' class='legend'>
                    <h4>Location Information</h4><hr>
                <div id="data">Sample of a points cluster map</div>
            </div>
            </div>
            `)

            mapboxgl.accessToken = obj.map_key;
            var map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/light-v10',
                center: [-98, 38.88],
                minZoom: 0,
                zoom: 0
            });
            map.addControl(new mapboxgl.FullscreenControl());

            map.on('load', function() {

                map.addSource('trainings', {
                    type: 'geojson',
                    data: data,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });

                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'trainings',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bbd6',
                            100,
                            '#f1f075',
                            750,
                            '#f28cb1'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            100,
                            30,
                            750,
                            40
                        ]
                    }
                });

                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'trainings',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                map.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'trainings',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': '#11b4da',
                        'circle-radius':12,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                });


                map.on('click', 'clusters', function(e) {
                    var features = map.queryRenderedFeatures(e.point, {
                        layers: ['clusters']
                    });
                    var clusterId = features[0].properties.cluster_id;
                    map.getSource('trainings').getClusterExpansionZoom(
                        clusterId,
                        function(err, zoom) {
                            if (err) return;

                            map.easeTo({
                                center: features[0].geometry.coordinates,
                                zoom: zoom
                            });
                        }
                    );
                })


                map.on('click', 'unclustered-point', function(e) {

                    var coordinates = e.features[0].geometry.coordinates.slice();
                    var name = e.features[0].properties.name;

                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    jQuery('#data').empty().html(`${name}`)

                });

                map.on('mouseenter', 'clusters', function() {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'clusters', function() {
                    map.getCanvas().style.cursor = '';
                });
            });

        }).catch(err=>{
        console.log("error")
        console.log(err)
    })

}

window.tAPI = {

    heatmap: ( data ) => makeRequest('POST', 'trainings/heatmap1', data ),

}
function makeRequest (type, url, data, base = 'dt/v1/') {
    const options = {
        type: type,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        url: url.startsWith('http') ? url : `${dtTrainingMetrics.root}${base}${url}`,
        beforeSend: xhr => {
            xhr.setRequestHeader('X-WP-Nonce', dtTrainingMetrics.nonce);
        }
    }

    if (data) {
        options.data = JSON.stringify(data)
    }

    return jQuery.ajax(options)
}
function handleAjaxError (err) {
    if (_.get(err, "statusText") !== "abortPromise" && err.responseText){
        console.trace("error")
        console.log(err)
    }
}
jQuery(document).ajaxComplete((event, xhr, settings) => {
    if (_.get(xhr, 'responseJSON.data.status') === 401) {
        console.log('401 error')
        console.log(xhr)
    }
}).ajaxError((event, xhr) => {
    handleAjaxError(xhr)
})