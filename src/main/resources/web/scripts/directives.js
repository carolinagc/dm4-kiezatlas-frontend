/* Directives */


app.directive("breadcrumb", function() {
    return {
        restrict: 'E',
        template: '<span><a href ng-click="selectCriteria(currentCriteria)">{{currentCriteria.value}}</a> >> <a href ng-click="selectCategory(currentCategory)">{{currentCategory.value}}</a><p/></span>'
    }
});

app.directive("leaflet", function() {
    return {
        restrict: 'E',
        template: '<div id="map"></div>',
        link: function(scope) {
            console.log("link function called")

            var baseLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            });
            
            var map = L.map('map', {
                center: [52.5, 13.43],
                zoom: 14,
                layers: [baseLayer]

            });

            scope.map = {
                createLayer: function() {
                    return L.layerGroup()
                },
                addMarker: function(categoryLayers, categoryUri, coord, geoObjectId) {
                    var marker = L.marker(coord).addTo(scope.markersLayer).on('click', onclick(geoObjectId));
                    function onclick(geoObjectId) {
                        return function() {
                            scope.showGeoObjectDetails(geoObjectId);
                        };
                    };

                },
                setLayerVisibility: function(categoryLayer, visibility ) {
                    if (visibility) {
                        if (!map.hasLayer(categoryLayer["layer"])) {
                            map.addLayer(categoryLayer["layer"]);
                            categoryLayer["visibility"] = true;
                        }
                    
                    } else {
                        if (map.hasLayer(categoryLayer["layer"])) {
                            map.removeLayer(categoryLayer["layer"]);
                            categoryLayer["visibility"] = false;
                            categoryLayerPre = false;;
                        }
                    }
                }
            }
        }
    };
});

