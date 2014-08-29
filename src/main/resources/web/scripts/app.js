/*
ViewModel
    state - The state the application is in, there are 4 states: "initial", "category list", "geo object list", "geo object details"
    criteria - the criteria shown upper/left (array of topics)
    currentCriteria - selected criteria (topic)
    criteriaCategories - the categories shown in the lower/left (array of topics)
    geoObjects - the geoObjects of a specific category
    detailGeoObject - the details of a geoObject
    currentCategory - the selected category (topic)
    details - the details values of a geoObject (object)
    geoObjCategories - the categories of a geoObject shown in geo object details (array)
*/


var app = angular.module('kiezatlasFrontend', ['ngSanitize']);

/* Controllers */

app.controller('sidebarController', function($scope,frontendService, utilService) {
    $scope.state="initial";
    var siteId=location.pathname.match(/\/website\/(\d+)/)[1];
    var gLayers = {};    

    frontendService.getAllCriteria().then(function(response) {
        $scope.criteria = response.data;
        angular.forEach(response.data, function(criteria) {
            
            if (!gLayers.hasOwnProperty(criteria.uri)) {
                gLayers[criteria.uri]=[];
            }
           
            frontendService.getCriteriaCategories(criteria.uri).then(function(response) {
                categories = response.data.items;

                angular.forEach(response.data.items, function(category) {
                    if (!gLayers[criteria.uri].hasOwnProperty([category.value])) {
                        gLayers[criteria.uri][category.value]=[];
                    }
                    
                    
                    frontendService.getGeoObjectsByCategory(category.id).then(function(response) {
                        
 //                       geoObjects = geoObjects.data;
                        angular.forEach(response.data, function(geoObj) {
                            var geoCoord = geoObj.composite["dm4.contacts.address"].composite["dm4.geomaps.geo_coordinate"].composite;
                            var lon = geoCoord["dm4.geomaps.longitude"].value;
                            var lat = geoCoord["dm4.geomaps.latitude"].value;
//                            console.log(lat, lon);
                            gLayers[criteria.uri][category.value].push([lat, lon]);
                            gLayers[criteria.uri][category.value].push(geoObj.id);

                        });
                        $scope.map.showMarkerLayer(gLayers, criteria.uri, category.value);                        
                        $scope.map.clearLayers();                            
                    });     
                    
                });

                console.log("gLAYERS", gLayers);     
                $scope.gLayers = gLayers;
                
            });
        });
    });          


    $scope.selectCriteria = function(selectedCriteria) {
//        if ($scope.currentCriteria != selectedCriteria && $scope.state!="initial" ){$scope.map.clearLayers();};
        if ($scope.currentCriteria != selectedCriteria){$scope.map.clearLayers();};
        $scope.currentCriteria = selectedCriteria;
        
        frontendService.getCriteriaCategories(selectedCriteria.uri).then(function(response) {
            $scope.state="category list";
            $scope.categories = response.data.items;
        });
    };


    $scope.selectCategory = function(category) {
        $scope.currentCategory = category;
        $scope.state="geo object list";

/* TODO 
        $scope.geoObjects = gLayers[$scope.currentCriteria.uri];
        console.log("GEOBJECTSAA IN GEO OBJECT LIST", gLayers[$scope.currentCriteria.uri]);
*/
        $scope.map.showMarkerLayer(gLayers, $scope.currentCriteria.uri, category.value); 

        frontendService.getGeoObjectsByCategory(category.id).then(function(response) {
            $scope.geoObjects = response.data;
            console.log("GEOBJECTS IN GEO OBJECT LIST", response.data);
        });     


    };

    $scope.showGeoObjectDetails = function(geoObjectId) {
        console.log("when showDetails the STATE is: " + $scope.state);
        $scope.state="geo object details";
        frontendService.getWebsiteFacets(siteId).then(function(response) {
            console.log("geo object facets",  response.data);
            var facet_type_uris = [];
            angular.forEach(response.data.items, function(facet) {      
                facet_type_uris.push(facet.uri);
            });
            console.log("facet type uris", facet_type_uris)
            return frontendService.getFacettedGeoObject(geoObjectId, facet_type_uris)
        }).then(function(response) {
            console.log("Detail geo object", response.data);
            var details = {};
            var geoObjCategories = [];
            $scope.detailGeoObject = response.data;
            angular.forEach(response.data.composite, function(detailsGeoObject) {
                if (utilService.isArray(detailsGeoObject)) {
                    if (detailsGeoObject[0].type_uri.indexOf("criteria")>0 && detailsGeoObject[0].value != "" ) {
                        geoObjCategories.push(detailsGeoObject[0].value);
                    }
                    details[detailsGeoObject[0].type_uri]= detailsGeoObject[0].value ;
                } else { 
                    if (detailsGeoObject.type_uri == "ka2.kontakt") {
                        angular.forEach(detailsGeoObject.composite, function(kontakt) {
                            details[kontakt.type_uri]= kontakt.value ;
//                            console.log("KONTAKT Value is", kontakt.type_uri, kontakt.value)
                        });
                    } else { 
                        details[detailsGeoObject.type_uri]= detailsGeoObject.value ;
                    }
                }
            });
            
            $scope.details = details;
            $scope.geoObjCategories = geoObjCategories;
            console.log("details", $scope.details);
            console.log("CATEGORIES", geoObjCategories);

        });
    };
});


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
            var categoryLayers = L.layerGroup();
            var baseLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            });
            
            var map = L.map('map', {
                center: [52.5, 13.43],
                zoom: 14,
                layers: [baseLayer, categoryLayers]

            });

            var overlays = {};
            
            scope.map = {
                showMarkerLayer: function(gLayers, criteriaUri, categoryValue) {
                    var markersLayer = L.layerGroup();
                    for (i=0, len = gLayers[criteriaUri][categoryValue].length; i<len; i=i+2) {

                        coord = gLayers[criteriaUri][categoryValue][i];

                     
                        geoObjectId = gLayers[criteriaUri][categoryValue][i+1];
//                        console.log("Add coord to markersLayer", coord);

                        var marker = L.marker(coord).addTo(markersLayer).on('click', function(e) {
                            alert(this.getLatLng())
                            scope.showGeoObjectDetails(geoObjectId);
//                          console.log("GEOOBJECTID IN MARKER",geoObjectId);
                        });

                    };
                    

                    overlays[categoryValue] = markersLayer;
                    overlays[categoryValue].addTo(categoryLayers);

                    if (categoryValue == "Erwachsene") {
                        console.log("OVERLAYS ERWACHSENE", overlays[categoryValue]);                    
                        
                    };

                    
//                   console.log("CATEGORY LAYERS", categoryLayers);
//                    console.log("OVERLAYS", overlays);

                },
                removeLayer: function(layer) {
                    map.removeLayer(overlays[layer]);
                },
                
                addLayer: function(categoryValue) {
// TODO
//                  map.addLayer(overlays[categoryValue]);
  
                  scope.map.showMarkerLayer(scope.gLayers, scope.currentCriteria.uri, categoryValue); 

 
                },
                
                
                /*
                  addMarker: function (lon, lat, geoObjectId) {
                    var marker = L.marker([lat, lon]).addTo(markersLayer).on('click', function(e) {
                    scope.showGeoObjectDetails(geoObjectId);
                    });
                    console.log("ADD TO markersLayer" + markersLayer);
                    console.log("currentCategory is " + scope.currentCategory.value);
                    },
                */
                clearLayers: function(){
                    categoryLayers.clearLayers();
                }
            }
        }
    };
});



/* Services */

app.service("frontendService", function($http) {

    this.getAllCriteria = function() {
        return $http.get("/site/criteria");
    };
    
    this.getCriteriaCategories = function(criteriaTypeUri) {
        return $http.get("/core/topic/by_type/" + criteriaTypeUri);
    };
    
    this.getGeoObjectsByCategory = function(categoryId) {
        return $http.get("/site/category/" + categoryId + "/objects?fetch_composite=true");
    };
    
    this.getWebsiteFacets = function(websiteId) {
        return $http.get("/site/" + websiteId + "/facets");
    };
    
    this.getFacettedGeoObject = function(geoObjectId, facetTypeUris) {
        return $http.get("/facet/topic/" + geoObjectId + "?" + queryString("facet_type_uri", facetTypeUris))
    };
    
    function queryString(paramName, values) {
        var params = [];
        angular.forEach(values, function(value) {
            params.push(paramName + "=" + value);
        })
        return params.join("&");
    };
    
});

app.service("utilService", function() {
    this.isArray = function(obj) {
        return Object.prototype.toString.call(obj) == "[object Array]"
    };
});
