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


/* Controllers */

app.controller('sidebarController', function($scope,frontendService, utilService) {
    $scope.state="initial";
    var siteId=location.pathname.match(/\/website\/(\d+)/)[1];
    var categoryLayers = {};
    var categoryLayersPre = {}

    frontendService.getAllCriteria().then(function(response) {
        $scope.criteria = response.data;
        $scope.selectCriteria(response.data[4]);
        angular.forEach(response.data, function(criteria) {
            categoryLayers[criteria.uri]=[];
            categoryLayersPre[criteria.uri]=[];
        });
        $scope.categoryLayers = categoryLayers;
        $scope.categoryLayersPre = categoryLayersPre;

    });          


    $scope.selectCriteria = function(selectedCriteria) {

        hideCategoryLayers($scope.categoryLayers, $scope.currentCriteria, selectedCriteria);
        $scope.currentCriteria = selectedCriteria;
        showPreCategoryLayers($scope.categoryLayersPre, $scope.currentCriteria, $scope.categoryLayers);

        frontendService.getCriteriaCategories(selectedCriteria.uri).then(function(response) {
            $scope.state="category list";
            $scope.categories = response.data.items;
        });
    };

    $scope.selectCategory = function(category) {
        $scope.currentCategory = category;
        $scope.state="geo object list";

// Check if the category propierty exists, if it does just load, if not create it 
        console.log("GEOOBJECT IN SELEC CATEGORY", $scope.geoObjects);
        var loadedCategories = utilService.areCategoriesLoaded($scope.categoryLayers, $scope.currentCriteria.uri, category.uri);
        if (loadedCategories) {
            $scope.map.setLayerVisibility(categoryLayers[$scope.currentCriteria.uri][category.uri], true);
            frontendService.getGeoObjectsByCategory(category.id).then(function(response) {
                $scope.geoObjects = response.data;
            });

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
                $scope.categoryLayersPre[$scope.currentCriteria.uri][category.uri] = true;
                $scope.categoryLayers = categoryLayers;
                console.log("categoryLayers", categoryLayers);
            });     
        };
    };


    hideCategoryLayers = function(categoryLayers, currentCriteria, selectedCriteria) {
        if ($scope.currentCriteria != selectedCriteria && $scope.state!="initial") {
            for (var cat in categoryLayers[currentCriteria.uri]) {
                $scope.categoryLayersPre[currentCriteria.uri][cat] = categoryLayers[currentCriteria.uri][cat]["visibility"];
                console.log("CategoryLayer PRE",categoryLayersPre);
                $scope.map.setLayerVisibility(categoryLayers[currentCriteria.uri][cat], false);
            };
        };
    };

    showPreCategoryLayers = function(categoryLayersPre, currentCriteria, categoryLayers) {
        if ($scope.state != "initial") {
            for (var cat in categoryLayers[currentCriteria.uri]) {
                var visibility = $scope.categoryLayersPre[currentCriteria.uri][cat];
                $scope.map.setLayerVisibility(categoryLayers[$scope.currentCriteria.uri][cat], visibility);
            }
        }
    }


    
    $scope.switchVisibility = function(category) {
        if (!$scope.categoryLayers[$scope.currentCriteria.uri][category.uri]) {
            $scope.selectCategory(category);
            $scope.state="category list";
        } else {
            if ($scope.categoryLayers[$scope.currentCriteria.uri][category.uri]["visibility"]) {
                $scope.map.setLayerVisibility($scope.categoryLayers[$scope.currentCriteria.uri][category.uri], false);
                $scope.categoryLayersPre[$scope.currentCriteria.uri][category.uri] = false;

            } else {
                $scope.map.setLayerVisibility($scope.categoryLayers[$scope.currentCriteria.uri][category.uri], true);
            }
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

