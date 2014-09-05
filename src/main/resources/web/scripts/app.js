/*
ViewModel
    state - The state the application is in, there are 4 states: "initial", "category list", "geo object list", "geo object details"
    categoryLayers - An object that contains the category topic, the geo object markers layer, the visibility of the layer
    criteria - the criteria shown upper/right (array of topics)
    currentCriteria - selected criteria (topic)
    criteriaCategories - the categories shown in the lower/right (array of topics)
    geoObjects - the geoObjects of a specific category shown in the lower/right
    detailGeoObject - the details of a geoObject
    currentCategory - the selected category (topic)
    details - the details values of a geoObject (object)
    geoObjCategories - the categories of a geoObject shown in geo object details (array)
    markersLayer - object with the markers of a specific category
*/


var app = angular.module('kiezatlasFrontend', ['ngSanitize']);

/* Controllers */

app.controller('sidebarController', function($scope,frontendService, utilService) {
    $scope.state="initial";
    var siteId=location.pathname.match(/\/website\/(\d+)/)[1];
    var categoryLayers = {};
    
    frontendService.getAllCriteria().then(function(response) {
        $scope.criteria = response.data;
        $scope.selectCriteria(response.data[4]);
        angular.forEach(response.data, function(criteria) {
            categoryLayers[criteria.uri]=[];
        });
        $scope.categoryLayers = categoryLayers;
    });          


    $scope.selectCriteria = function(selectedCriteria) {
        if ($scope.currentCriteria != selectedCriteria && $scope.currentCriteria) {
            hideCategoryLayers($scope.categoryLayers, $scope.currentCriteria);
        }
       
        $scope.currentCriteria = selectedCriteria;
        frontendService.getCriteriaCategories(selectedCriteria.uri).then(function(response) {
            $scope.state="category list";
            $scope.categories = response.data.items;
        });
    };

    $scope.selectCategory = function(category) {
        $scope.currentCategory = category;
        $scope.state="geo object list";

// Check if the category propierty exists, if it does just load, if not create it 

        var loadedCategories = utilService.areCategoriesLoaded($scope.categoryLayers, $scope.currentCriteria.uri, category.uri);
        if (loadedCategories) {
            $scope.map.setLayerVisibility(categoryLayers[$scope.currentCriteria.uri][category.uri], true);
        } else {
            categoryLayers[$scope.currentCriteria.uri][category.uri] = [];            
            categoryLayers[$scope.currentCriteria.uri][category.uri]["layer"] = {};
            categoryLayers[$scope.currentCriteria.uri][category.uri]["visibility"];
            categoryLayers[$scope.currentCriteria.uri][category.uri].push(category);            
            
            console.log("CATEGORY LAYERS in selectCategory", categoryLayers);
            frontendService.getGeoObjectsByCategory(category.id).then(function(response) {
                $scope.geoObjects = response.data;
                console.log("GEOBJECTS IN GEO OBJECT LIST", response.data);
                $scope.markersLayer = $scope.map.createLayer();

//Creating markers layer for the category selected

                angular.forEach(response.data, function(geoObj) {
                    var geoCoord = geoObj.composite["dm4.contacts.address"].composite["dm4.geomaps.geo_coordinate"].composite;
                    var lon = geoCoord["dm4.geomaps.longitude"].value;
                    var lat = geoCoord["dm4.geomaps.latitude"].value;
                    var coord=[lat,lon];
                    console.log("coord",  coord);
                    $scope.map.addMarker(categoryLayers, category.uri, coord, geoObj.id);
                });
                
                categoryLayers[$scope.currentCriteria.uri][category.uri]["layer"] = $scope.markersLayer;
                $scope.map.setLayerVisibility(categoryLayers[$scope.currentCriteria.uri][category.uri], true);
                $scope.categoryLayers = categoryLayers;
                console.log("categoryLayers", categoryLayers);
            });     
        };
    };



    hideCategoryLayers = function(categoryLayers, currentCriteria) {
        for (var cat in categoryLayers[currentCriteria.uri]) {
        console.log("HIDE CATEGORIES", categoryLayers[currentCriteria.uri][cat]);
            $scope.map.setLayerVisibility(categoryLayers[currentCriteria.uri][cat], false);
        }
    }


    $scope.switchVisibility = function(category) {
                if ($scope.categoryLayers[$scope.currentCriteria.uri][category.uri]["visibility"]) {
                    $scope.map.setLayerVisibility($scope.categoryLayers[$scope.currentCriteria.uri][category.uri], false);
                } else {
                    $scope.map.setLayerVisibility($scope.categoryLayers[$scope.currentCriteria.uri][category.uri], true);
                }
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
                        }
                    }
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

    this.areCategoriesLoaded = function(categoryLayers, criteriaUri, categoryUri) {
        return categoryLayers[criteriaUri][categoryUri]
    }
});
