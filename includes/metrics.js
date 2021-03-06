jQuery(document).ready(function() {

    if( '#cluster_map' === window.location.hash || ! window.location.hash) {
        jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_cluster_map()
    }
    if( '#area_map' === window.location.hash) {
        jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_area_map()
    }
    if( '#points_map' === window.location.hash  ) {
        jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_training_points_map()
    }
    if( '#nearest_map' === window.location.hash  ) {
        jQuery('#metrics-sidemenu').foundation('down', jQuery('#training-menu'));
        write_nearest_trainers_map()
    }
})

function write_training_cluster_map() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${_.escape(obj.plugin_uri)}spinner.svg" width="30px" alt="spinner" />`)

    tAPI.cluster_geojson()
        .then(data=>{
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
                        top: 10px;
                        left: 10px;
                        z-index: 2;
                     }
                     #data {
                        word-wrap: break-word;
                     }
                    .legend {
                        background-color: #fff;
                        border-radius: 3px;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                        font: 12px/20px 'Roboto', Arial, sans-serif;
                        padding: 10px;
                        opacity: .9;
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
                    #cross-hair {
                        position: absolute;
                        z-index: 20;
                        font-size:30px;
                        font-weight: normal;
                        top:50%;
                        left:50%;
                        display:none;
                        pointer-events: none;
                    }
                    #spinner {
                        position: absolute;
                        top:50%;
                        left:50%;
                        z-index: 20;
                        display:none;
                    }
                    .spinner-image {
                        width: 30px;
                    }
                    .info-bar-font {
                        font-size: 1.5em;
                        padding-top: 9px;
                    }
                    .border-left {
                        border-left: 1px lightgray solid;
                    }
                    #geocode-details {
                        position: absolute;
                        top: 100px;
                        right: 10px;
                        z-index: 2;
                    }
                    .geocode-details {
                        background-color: #fff;
                        border-radius: 3px;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                        font: 12px/20px 'Roboto', Arial, sans-serif;
                        padding: 10px;
                        opacity: .9;
                        width: 300px;
                        display:none;
                    }
                    .close-details {
                        cursor:pointer;
                    }
                </style>
                <div id="map-wrapper">
                    <div id='map'></div>
                    <div id='legend' class='legend'>
                        <div class="grid-x grid-margin-x grid-padding-x">
                            <div class="cell small-1 center info-bar-font">
                                Trainings 
                            </div>
                            <div class="cell small-2 center border-left">
                                <select id="status" class="small" style="width:170px;">
                                    <option value="none" disabled></option>
                                    <option value="none" disabled>Status</option>
                                    <option value="none"></option>
                                    <option value="all" selected>Status - All</option>
                                    <option value="none" disabled>-----</option>
                                    <option value="new">New</option>
                                    <option value="proposed">Proposed</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In-Progress</option>
                                    <option value="complete">Completed</option>
                                    <option value="paused">Paused</option>
                                    <option value="closed">Closed</option>
                                    <option value="none" disabled></option>
                                </select> 
                            </div>
                        </div>
                    </div>
                    <div id="spinner"><img src="${_.escape(obj.spinner_url)}" class="spinner-image" alt="spinner"/></div>
                    <div id="cross-hair">&#8982</div>
                    <div id="geocode-details" class="geocode-details">
                        Trainings<span class="close-details" style="float:right;"><i class="fi-x"></i></span>
                        <hr style="margin:10px 5px;">
                        <div id="geocode-details-content"></div>
                    </div>
                </div>
            `)

            set_info_boxes()
            function set_info_boxes() {
                let map_wrapper = jQuery('#map-wrapper')
                jQuery('.legend').css( 'width', map_wrapper.innerWidth() - 20 )
                jQuery( window ).resize(function() {
                    jQuery('.legend').css( 'width', map_wrapper.innerWidth() - 20 )
                });
            }

            mapboxgl.accessToken = obj.map_key;
            var map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/light-v10',
                center: [-98, 38.88],
                minZoom: 0,
                zoom: 0
            });

            map.on('load', function() {
                load_layer( data )
            });

            jQuery('#status').on('change', function() {
                window.current_status = jQuery('#status').val()
                tAPI.cluster_geojson( { status: window.current_status } )
                    .then(data=> {
                        clear_layer()
                        load_layer( data )
                    })
            })

            function clear_layer() {
                map.removeLayer( 'clusters' )
                map.removeLayer( 'cluster-count' )
                map.removeLayer( 'unclustered-point' )
                map.removeSource( 'trainings' )
            }

            function load_layer( geojson ) {
                map.addSource('trainings', {
                    type: 'geojson',
                    data: geojson,
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

                    let content = jQuery('#geocode-details-content')
                    content.empty()

                    jQuery('#geocode-details').show()

                    jQuery.each( e.features, function(i,v) {
                        var address = v.properties.address;
                        var post_id = v.properties.post_id;
                        var name = v.properties.name

                        content.append(`<p><a href="/trainings/${post_id}">${name}</a><br>${address}</p>`)
                    })

                });
                map.on('mouseenter', 'clusters', function() {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'clusters', function() {
                    map.getCanvas().style.cursor = '';
                });
            }

            jQuery('.close-details').on('click', function() {
                jQuery('#geocode-details').hide()
            })

        }).catch(err=>{
        console.log("error")
        console.log(err)
    })

}

function write_training_area_map() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${_.escape(obj.plugin_uri)}spinner.svg" width="30px" alt="spinner" />`)

    tAPI.grid_totals()
        .then(grid_data=>{

            window.grid_data = grid_data

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
                        top: 10px;
                        left: 10px;
                        z-index: 2;
                     }
                     #data {
                        word-wrap: break-word;
                     }
                    .legend {
                        background-color: #fff;
                        border-radius: 3px;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                        font: 12px/20px 'Roboto', Arial, sans-serif;
                        padding: 10px;
                        opacity: .9;
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
                    #cross-hair {
                        position: absolute;
                        z-index: 20;
                        font-size:30px;
                        font-weight: normal;
                        top:50%;
                        left:50%;
                        display:none;
                        pointer-events: none;
                    }
                    #spinner {
                        position: absolute;
                        top:50%;
                        left:50%;
                        z-index: 20;
                        display:none;
                    }
                    .spinner-image {
                        width: 30px;
                    }
                    .info-bar-font {
                        font-size: 1.5em;
                        padding-top: 9px;
                    }
                    .border-left {
                        border-left: 1px lightgray solid;
                    }
                    #geocode-details {
                        position: absolute;
                        top: 100px;
                        right: 10px;
                        z-index: 2;
                    }
                    .geocode-details {
                        background-color: #fff;
                        border-radius: 3px;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.10);
                        font: 12px/20px 'Roboto', Arial, sans-serif;
                        padding: 10px;
                        opacity: .9;
                        width: 300px;
                        display:none;
                    }
                    .close-details {
                        cursor:pointer;
                    }
                </style>
                <div id="map-wrapper">
                    <div id='map'></div>
                    <div id='legend' class='legend'>
                        <div class="grid-x grid-margin-x grid-padding-x">
                            <div class="cell small-1 center info-bar-font">
                                Trainings 
                            </div>
                            <div class="cell small-2 center border-left">
                                <select id="level" class="small" style="width:170px;">
                                    <option value="none" disabled></option>
                                    <option value="none" disabled>Zoom Level</option>
                                    <option value="none"></option>
                                    <option value="auto" selected>Auto Zoom</option>
                                    <option value="none" disabled>-----</option>
                                    <option value="world">World</option>
                                    <option value="admin0">Country</option>
                                    <option value="admin1">State</option>
                                    <option value="none" disabled></option>
                                </select> 
                            </div>
                            <div class="cell small-3 center border-left float-right" >
                                <div class="grid-x">
                                    <div class="cell small-3">
                                        Click
                                    </div>
                                    <div class="cell small-3">
                                        <div class="switch small center" style="margin:0 auto;">
                                          <input class="switch-input click-behavior" id="click1" type="radio" value="layer" checked name="click">
                                          <label class="switch-paddle" for="click1">
                                            <span class="show-for-sr">Layer</span>
                                          </label>
                                        </div>
                                        Layer
                                    </div>
                                    <div class="cell small-3">
                                        <div class="switch small center" style="margin:0 auto;">
                                          <input class="switch-input click-behavior" id="click2" type="radio" value="add" name="click">
                                          <label class="switch-paddle" for="click2">
                                            <span class="show-for-sr">Add</span>
                                          </label>
                                        </div>
                                        Add
                                    </div>
                                    <div class="cell small-3">
                                        <div class="switch small center" style="margin:0 auto;">
                                          <input class="switch-input click-behavior" id="click3" type="radio" value="detail" name="click">
                                          <label class="switch-paddle" for="click3">
                                            <span class="show-for-sr">Details</span>
                                          </label>
                                        </div>
                                        Details
                                    </div>
                                    
                                </div>
                           </div>
                            
                            <div class="cell small-2 center border-left">
                                <select id="status" class="small" style="width:170px;">
                                    <option value="none" disabled></option>
                                    <option value="none" disabled>Status</option>
                                    <option value="none"></option>
                                    <option value="all" selected>Status - All</option>
                                    <option value="none" disabled>-----</option>
                                    <option value="new">New</option>
                                    <option value="proposed">Proposed</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In-Progress</option>
                                    <option value="complete">Completed</option>
                                    <option value="paused">Paused</option>
                                    <option value="closed">Closed</option>
                                    <option value="none" disabled></option>
                                </select> 
                            </div>
                            <div class="cell small-3 center border-left info-bar-font">
                                
                            </div>
                            
                            <div class="cell small-1 center border-left">
                                <div class="grid-y">
                                    <div class="cell center" id="admin">World</div>
                                    <div class="cell center" id="zoom" >0</div>
                                    <div class="cell center"><a onclick="write_training_area_map()">reset</a></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="spinner"><img src="${_.escape(obj.spinner_url)}" class="spinner-image" alt="spinner"/></div>
                    <div id="cross-hair">&#8982</div>
                    <div id="geocode-details" class="geocode-details">
                        Trainings<span class="close-details" style="float:right;"><i class="fi-x"></i></span>
                        <hr style="margin:10px 5px;">
                        <div id="geocode-details-content"></div>
                    </div>
                </div>
             `)

            // set info box
            set_info_boxes()

            // init map
            mapboxgl.accessToken = obj.map_key;
            var map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/light-v10',
                // style: 'mapbox://styles/mapbox/streets-v11',
                center: [-98, 38.88],
                minZoom: 1,
                zoom: 1.5
            });

            // disable map rotation using right click + drag
            map.dragRotate.disable();

            // disable map rotation using touch rotation gesture
            map.touchZoomRotate.disableRotation();

            // cross-hair
            map.on('zoomstart', function() {
                jQuery('#cross-hair').show()
            })
            map.on('zoomend', function() {
                jQuery('#cross-hair').hide()
            })
            map.on('dragstart', function() {
                jQuery('#cross-hair').show()
            })
            map.on('dragend', function() {
                jQuery('#cross-hair').hide()
            })

            // grid memory vars
            window.previous_grid_id = 0
            window.previous_grid_list = []

            // default load state
            map.on('load', function() {
                window.previous_grid_id = '1'
                window.previous_grid_list.push('1')
                jQuery.get('https://storage.googleapis.com/location-grid-mirror/collection/1.geojson', null, null, 'json')
                    .done(function (geojson) {

                        jQuery.each(geojson.features, function (i, v) {
                            if (window.grid_data[geojson.features[i].properties.id]) {
                                geojson.features[i].properties.value = parseInt(window.grid_data[geojson.features[i].properties.id].count)
                            } else {
                                geojson.features[i].properties.value = 0
                            }
                        })
                        map.addSource('1', {
                            'type': 'geojson',
                            'data': geojson
                        });
                        map.addLayer({
                            'id': '1',
                            'type': 'fill',
                            'source': '1',
                            'paint': {
                                'fill-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['get', 'value'],
                                    0,
                                    'rgba(0, 0, 0, 0)',
                                    1,
                                    '#547df8',
                                    50,
                                    '#3754ab',
                                    100,
                                    '#22346a'
                                ],
                                'fill-opacity': 0.75
                            }
                        });
                        map.addLayer({
                            'id': '1line',
                            'type': 'line',
                            'source': '1',
                            'paint': {
                                'line-color': 'black',
                                'line-width': 1
                            }
                        });
                    })
            })

            // update info box on zoom
            map.on('zoom', function() {
                document.getElementById('zoom').innerHTML = Math.floor(map.getZoom())

                let level = get_level()
                let name = ''
                if ( level === 'world') {
                    name = 'World'
                } else if ( level === 'admin0') {
                    name = 'Country'
                } else if ( level === 'admin1' ) {
                    name = 'State'
                }
                document.getElementById('admin').innerHTML = name
            })

            // click controls
            window.click_behavior = 'layer'
            window.click_add_list = []
            jQuery('.click-behavior').on('click', function() {
                window.click_behavior = jQuery("input:radio[name=click]:checked").val()
                if ( window.click_behavior === 'add' ) {
                    close_geocode_details()
                    set_level()
                }
                if ( window.click_behavior === 'detail' ) {
                    set_level()
                }
                if ( window.click_behavior === 'layer' ) {
                    close_geocode_details()
                    clear_layers( window.previous_grid_id )
                    set_level( true )
                }
            })
            map.on('click', function( e ) {
                if ( window.click_behavior === 'detail' ) {
                    // this section increments up the result on level because
                    // it corresponds better to the viewable user intent for details
                    let level = get_level()
                    if ( level === 'world' ) {
                        level = 'admin0'
                    }
                    else if ( level === 'admin0' ) {
                        level = 'admin1'
                    }
                    else if ( level === 'admin1' ) {
                        level = 'admin2'
                    }
                    load_detail_panel( e.lngLat.lng, e.lngLat.lat, level )
                } else {
                    load_layer( e.lngLat.lng, e.lngLat.lat, 'click' )
                }
            })

            // Status
            jQuery('#status').on('change', function() {
                window.current_status = jQuery('#status').val()

                tAPI.grid_totals( { status: window.current_status } )
                    .then(grid_data=>{
                        window.previous_grid_id = 0
                        clear_layers()
                        window.grid_data = grid_data

                        let lnglat = map.getCenter()
                        load_layer( lnglat.lng, lnglat.lat )

                    })

            })
            // load new layer on event
            map.on('zoomend', function() {
                if ( window.click_behavior === 'layer' ) {
                    let lnglat = map.getCenter()
                    load_layer( lnglat.lng, lnglat.lat, 'zoom' )
                }
            } )
            map.on('dragend', function() {
                if ( window.click_behavior === 'layer' ) {
                    let lnglat = map.getCenter()
                    load_layer( lnglat.lng, lnglat.lat, 'drag' )
                }
            } )
            function load_layer( lng, lat, event_type ) {
                let spinner = jQuery('#spinner')
                spinner.show()

                // set geocode level, default to auto
                let level = get_level()

                // standardize longitude
                if (lng > 180) {
                    lng = lng - 180
                    lng = -Math.abs(lng)
                } else if (lng < -180) {
                    lng = lng + 180
                    lng = Math.abs(lng)
                }

                // geocode
                jQuery.get(obj.plugin_uri + 'includes/training-location-grid-api.php',
                    {
                        type: 'geocode',
                        longitude: lng,
                        latitude: lat,
                        level: level,
                        country_code: null,
                        nonce: obj.nonce
                    }, null, 'json')
                    .done(function (data) {

                        // default layer to world
                        if ( data.grid_id === undefined ) {
                            data.grid_id = '1'
                        }

                        // is new test
                        if ( window.previous_grid_id !== data.grid_id ) {

                            // is defined test
                            var mapLayer = map.getLayer(data.grid_id);
                            if(typeof mapLayer === 'undefined') {

                                // get geojson collection
                                jQuery.ajax({
                                    type: 'GET',
                                    contentType: "application/json; charset=utf-8",
                                    dataType: "json",
                                    url: 'https://storage.googleapis.com/location-grid-mirror/collection/' + data.grid_id + '.geojson',
                                    statusCode: {
                                        404: function() {
                                            console.log('404. Do nothing.')
                                        }
                                    }
                                })
                                    .done(function (geojson) {

                                        // add data to geojson properties
                                        jQuery.each(geojson.features, function (i, v) {
                                            if (window.grid_data[geojson.features[i].properties.id]) {
                                                geojson.features[i].properties.value = parseInt(window.grid_data[geojson.features[i].properties.id].count)
                                            } else {
                                                geojson.features[i].properties.value = 0
                                            }
                                        })

                                        // add source
                                        map.addSource(data.grid_id.toString(), {
                                            'type': 'geojson',
                                            'data': geojson
                                        });

                                        // add fill layer
                                        map.addLayer({
                                            'id': data.grid_id.toString(),
                                            'type': 'fill',
                                            'source': data.grid_id.toString(),
                                            'paint': {
                                                'fill-color': [
                                                    'interpolate',
                                                    ['linear'],
                                                    ['get', 'value'],
                                                    0,
                                                    'rgba(0, 0, 0, 0)',
                                                    1,
                                                    '#547df8',
                                                    50,
                                                    '#3754ab',
                                                    100,
                                                    '#22346a'
                                                ],
                                                'fill-opacity': 0.75
                                            }
                                        });

                                        // add border lines
                                        map.addLayer({
                                            'id': data.grid_id.toString() + 'line',
                                            'type': 'line',
                                            'source': data.grid_id.toString(),
                                            'paint': {
                                                'line-color': 'black',
                                                'line-width': 1
                                            }
                                        });

                                        remove_layer( data.grid_id, event_type )

                                    }) // end get geojson collection

                            }
                        } // end load new layer
                    spinner.hide()
                }); // end geocode

            } // end load section function
            function load_detail_panel( lng, lat, level ) {

                // standardize longitude
                if (lng > 180) {
                    lng = lng - 180
                    lng = -Math.abs(lng)
                } else if (lng < -180) {
                    lng = lng + 180
                    lng = Math.abs(lng)
                }

                if ( level === 'world' ) {
                    level = 'admin0'
                }

                let content = jQuery('#geocode-details-content')
                content.empty().html(`<img src="${_.escape(obj.spinner_url)}" class="spinner-image" alt="spinner"/>`)

                jQuery('#geocode-details').show()

                // geocode
                tAPI.geocode( { lng: lng, lat: lat, level: level } )
                    .then(details=>{
                        content.empty()

                        if ( window.grid_data[details.admin0_grid_id] ) {
                            content.append( `
                            <div>
                            ${details.admin0_name} : ${window.grid_data[details.admin0_grid_id].count}
                            </div>
                            `)
                        }
                        if ( window.grid_data[details.admin1_grid_id] ) {
                            content.append( `
                            <div>
                            ${details.admin1_name} : ${window.grid_data[details.admin1_grid_id].count}
                            </div>
                            `)
                        }
                        if ( window.grid_data[details.admin2_grid_id] ) {
                            content.append( `
                            <div>
                            ${details.admin2_name} : ${window.grid_data[details.admin2_grid_id].count}
                            </div>
                            `)
                        }


                    }); // end geocode
            }
            function get_level( ) {
                let level = jQuery('#level').val()
                if ( level === 'auto' || level === 'none' ) { // if none, then auto set
                    level = 'admin0'
                    if ( map.getZoom() <= 3 ) {
                        level = 'world'
                    }
                    else if ( map.getZoom() >= 5 ) {
                        level = 'admin1'
                    }
                }
                return level;
            }
            function set_level( auto = false) {
                if ( auto ) {
                    jQuery('#level :selected').attr('selected', false)
                    jQuery('#level').val('auto')
                } else {
                    jQuery('#level :selected').attr('selected', false)
                    jQuery('#level').val(get_level())
                }
            }
            function remove_layer( grid_id, event_type ) {
                window.previous_grid_list.push( grid_id )
                window.previous_grid_id = grid_id

                if ( event_type === 'click' && window.click_behavior === 'add' ) {
                    window.click_add_list.push( grid_id )
                }
                else {
                    clear_layers ( grid_id )
                }
            }
            function clear_layers ( grid_id = null ) {
                jQuery.each(window.previous_grid_list, function(i,v) {
                    let mapLayer = map.getLayer(v.toString());
                    if(typeof mapLayer !== 'undefined' && v !== grid_id) {
                        map.removeLayer( v.toString() )
                        map.removeLayer( v.toString() + 'line' )
                        map.removeSource( v.toString() )
                    }
                })
            }
            function set_info_boxes() {
                let map_wrapper = jQuery('#map-wrapper')
                jQuery('.legend').css( 'width', map_wrapper.innerWidth() - 20 )
                jQuery( window ).resize(function() {
                    jQuery('.legend').css( 'width', map_wrapper.innerWidth() - 20 )
                });
                // jQuery('#geocode-details').css('height', map_wrapper.innerHeight() - 125 )
            }
            function close_geocode_details() {
                jQuery('#geocode-details').hide()
            }

            jQuery('.close-details').on('click', function() {
                jQuery('#geocode-details').hide()
            })

        }).catch(err=>{
        console.log("error")
        console.log(err)
    })

}

function write_training_points_map() {
    let obj = dtTrainingMetrics
    let chart = jQuery('#chart')

    chart.empty().html(`<img src="${_.escape(obj.plugin_uri)}spinner.svg" width="30px" alt="spinner" />`)

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
                        z-index: 2;
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
                    #cross-hair {
                        position: absolute;
                        z-index: 20;
                        font-size:3em;
                        top:50%;
                        left:50%;
                        display:none;
                        pointer-events: none;
                    }
                    #spinner {
                        position: absolute;
                        top:50%;
                        left:50%;
                        z-index: 20;
                        display:none;
                    }
                </style>
                <div id="map-wrapper">
                    <div id='map'></div>
                    <div id='legend' class='legend'>
                        <div id="grid"></div>
                        <div id="info"></div>
                        <div id="data"></div>
                    </div>
                    <div id="spinner"><img src="${_.escape(obj.spinner_url)}" alt="spinner" style="width: 25px;" /></div>
                    <div id="cross-hair">&#8982</div>
                </div>
             `)


    mapboxgl.accessToken = obj.map_key;
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        // style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98, 38.88],
        minZoom: 1,
        zoom: 1
    });

    // disable map rotation using right click + drag
    map.dragRotate.disable();

    // disable map rotation using touch rotation gesture
    map.touchZoomRotate.disableRotation();

    // load sources
    map.on('load', function() {
        let spinner = jQuery('#spinner')
        spinner.show()

        tAPI.points_geojson()
            .then(points=>{
                map.addSource('points', {
                    'type': 'geojson',
                    'data': points
                });
                console.log('POINTS')
                console.log(points)
            })
        jQuery.get('https://storage.googleapis.com/location-grid-mirror/collection/1.geojson', null, null, 'json')
            .done(function (geojson) {

                tAPI.grid_country_totals()
                    .then(country_totals=>{

                        jQuery.each( geojson.features, function(i,v) {
                            if ( country_totals[geojson.features[i].properties.id] ) {
                                geojson.features[i].properties.value = parseInt( country_totals[geojson.features[i].properties.id].count )
                            } else {
                                geojson.features[i].properties.value = 0
                            }
                        })

                        map.addSource('world', {
                            'type': 'geojson',
                            'data': geojson
                        });
                        map.addLayer({
                            'id': 'world',
                            'type': 'fill',
                            'source': 'world',
                            'paint': {
                                'fill-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['get', 'value'],
                                    0,
                                    'rgba(0, 0, 0, 0)',
                                    1,
                                    '#547df8',
                                    50,
                                    '#3754ab',
                                    100,
                                    '#22346a'
                                ],
                                'fill-opacity': 0.75
                            }
                        });

                        spinner.hide()
                    })

            })

    })

    // cross-hair
    map.on('zoomstart', function() {
        jQuery('#cross-hair').show()
    })
    map.on('zoomend', function() {
        jQuery('#cross-hair').hide()
    })
    map.on('dragstart', function() {
        jQuery('#cross-hair').show()
    })
    map.on('dragend', function() {
        jQuery('#cross-hair').hide()
    })

    window.previous_grid_id = '0'
    function load_world() {
        // remove previous layer
        if ( window.previous_grid_id > '0' && window.previous_grid_id !== '1' ) {
            map.removeLayer(window.previous_grid_id.toString() + 'line' )
            map.removeLayer(window.previous_grid_id.toString() + 'points' )
            map.removeSource( window.previous_grid_id.toString() )
        }
        window.previous_grid_id = '0'

        map.setLayoutProperty('world', 'visibility', 'visible');
    }


    // load layer events
    // zoom
    map.on('zoomend', function() {
        let lnglat = map.getCenter()
        if ( map.getZoom() <= 2 ) {
            load_world()
        } else {
            load_layer( lnglat.lng, lnglat.lat )
        }
    } )
    // drag pan
    map.on('dragend', function() {
        let lnglat = map.getCenter()
        if ( map.getZoom() <= 2 ) {
            load_world()
        } else {
            load_layer( lnglat.lng, lnglat.lat )
        }
    } )

    function load_layer( lng, lat ) {
        let spinner = jQuery('#spinner')
        spinner.show()

        map.setLayoutProperty('world', 'visibility', 'none');

        // set geocode level
        let level = 'admin0'

        // standardize longitude
        if (lng > 180) {
            lng = lng - 180
            lng = -Math.abs(lng)
        } else if (lng < -180) {
            lng = lng + 180
            lng = Math.abs(lng)
        }

        // geocode
        jQuery.get(obj.plugin_uri + 'includes/training-location-grid-api.php',
            {
                type: 'geocode',
                longitude: lng,
                latitude: lat,
                level: level,
                country_code: null,
                nonce: obj.nonce
            }, null, 'json').done(function (data) {

            // default layer to world
            if ( data.grid_id === undefined ) {
                load_world()
            }

            // load layer, if new
             else if ( window.previous_grid_id !== data.grid_id ) {

                // remove previous layer
                if ( window.previous_grid_id > 0 && map.getLayer( window.previous_grid_id.toString() + 'line' ) ) {
                    map.removeLayer(window.previous_grid_id.toString() + 'line' )
                    map.removeSource( window.previous_grid_id.toString() )
                    var mapPointsLayer = map.getLayer( window.previous_grid_id.toString() + 'points' );
                    if(typeof mapPointsLayer !== 'undefined') {
                        map.removeLayer(window.previous_grid_id.toString() + 'points')
                    }
                }
                window.previous_grid_id = data.grid_id

                // add info to box
                if (data && data.grid_id !== '1' ) {
                    jQuery('#data').empty().html(`
                        <p><strong>${_.escape(data.name)}</strong></p>
                        <p>Population: ${_.escape(data.population)}</p>
                        `)
                }

                // add layer
                var mapLayer = map.getLayer(data.grid_id);
                if(typeof mapLayer === 'undefined') {

                    // get geojson collection
                    jQuery.get('https://storage.googleapis.com/location-grid-mirror/low/'+data.grid_id+'.geojson', null, null, 'json')
                        .done(function (geojson) {

                            // add source
                            map.addSource(data.grid_id.toString(), {
                                'type': 'geojson',
                                'data': geojson
                            });
                            // add border lines
                            map.addLayer({
                                'id': data.grid_id.toString() + 'line',
                                'type': 'line',
                                'source': data.grid_id.toString(),
                                'paint': {
                                    'line-color': '#22346a',
                                    'line-width': 2
                                }
                            });
                            map.addLayer({
                                id: data.grid_id.toString() + 'points',
                                type: 'circle',
                                source: 'points',
                                paint: {
                                    'circle-color': '#11b4da',
                                    'circle-radius':12,
                                    'circle-stroke-width': 1,
                                    'circle-stroke-color': '#fff'
                                },
                                filter: ["==", data.grid_id.toString(), ["get", "a0"] ]
                            });
                            map.on('click', data.grid_id.toString() + 'points', function(e) {
                                let dataDiv = jQuery('#data')
                                dataDiv.empty()

                                jQuery.each( e.features, function(i,v) {
                                    var address = v.properties.l;
                                    var post_id = v.properties.pid;
                                    var name = v.properties.n

                                    dataDiv.append(`<p><a href="/trainings/${_.escape(post_id)}">${_.escape(name)}</a><br>${_.escape(address)}</p>`)
                                })

                            });
                            map.on('mouseenter', data.grid_id.toString() + 'points', function() {
                                map.getCanvas().style.cursor = 'pointer';
                            });
                            map.on('mouseleave', data.grid_id.toString() + 'points', function() {
                                map.getCanvas().style.cursor = '';
                            });
                        }) // end get geojson collection
                } // end add layer
            } // end load new layer
            spinner.hide()
        }); // end geocode
    } // end load section function

}

window.tAPI = {

    cluster_geojson: ( data ) => makeRequest('POST', 'trainings/cluster_geojson', data ),

    points_geojson: () => makeRequest('GET', 'trainings/points_geojson' ),

    grid_totals: ( data ) => makeRequest('POST', 'trainings/grid_totals', data ),

    grid_country_totals: () => makeRequest('GET', 'trainings/grid_country_totals' ),

    geocode: ( data ) => makeRequest('GET', dtTrainingMetrics.plugin_uri + 'includes/training-location-grid-api.php?type=geocode&longitude='+data.lng+'&latitude='+data.lat+'&level='+data.level+'&nonce='+dtTrainingMetrics.nonce ),

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
jQuery(document).ajaxComplete((event, xhr, settings) => {
    if (_.get(xhr, 'responseJSON.data.status') === 401) {
        console.log('401 error')
        console.log(xhr)
    }
}).ajaxError((event, xhr) => {
    handleAjaxError(xhr)
})
function handleAjaxError (err) {
    if (_.get(err, "statusText") !== "abortPromise" && err.responseText){
    }
}