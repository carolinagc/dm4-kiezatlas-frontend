/*
ViewModel
    state - The state the application is in, there are 4 states: "initial", "category list", "geo object list", "geo object details"
    criteria - the criteria shown upper/left (array of topics)
    currentCriteria - selected criteria (topic)
    criteriaCategories - the categories shown in the lower/left (array of topics)
    geoObjects - the geoObjects of a specific category
    detailGeoObject - the details of a geoObject

*/


var app = angular.module('kiezatlasFrontend', []);

app.controller('sidebarController', function($scope, frontendService) {

    frontendService.getAllCriteria(function(criteria) {
	$scope.state="initial";
	$scope.criteria = criteria;
    });

    $scope.selectCriteria = function(selectedCriteria) {
	$scope.currentCriteria = selectedCriteria;
	$scope.map.removeMarkers();
	frontendService.getCriteriaCategories(selectedCriteria.uri, function(criteriaCategories) {
	    $scope.state="category list";
            $scope.categories = criteriaCategories.items;
	});
    };


    $scope.selectCategory = function(category) {
	frontendService.getGeoObjectsByCategory(category.id, function(geoObjects) {
	    $scope.currentCategory = category;
	    $scope.state="geo object list";
	    $scope.geoObjects = geoObjects;
	    console.log(geoObjects);
	    angular.forEach(geoObjects, function(geoObject) {
		var geoCoord = geoObject.composite["dm4.contacts.address"].composite["dm4.geomaps.geo_coordinate"].composite;
		var lon = geoCoord["dm4.geomaps.longitude"].value;
		var lat = geoCoord["dm4.geomaps.latitude"].value;
		console.log(lon, lat);
		$scope.map.addMarker(lon, lat);
	    });
	});		
    };

    $scope.showGeoObjectDetails = function(geoObjectId) {
	$scope.state="geo object details";
	var FACET_TYPE_URIS = [
	    "ka2.kontakt.facet",
	    "ka2.website.facet",
	    "ka2.beschreibung.facet",
	    "ka2.oeffnungszeiten.facet",
	    "ka2.traeger.facet",
	    //
	    "ka2.criteria.thema.facet",
	    "ka2.criteria.angebot.facet",
	    "ka2.criteria.zielgruppe.facet",
	    "ka2.criteria.traeger.facet",
	    "ka2.criteria.ueberregional.facet"
	];


	frontendService.getFacettedGeoObjects(geoObjectId, FACET_TYPE_URIS, function(geoObject) {
	    console.log("Detail geo object", geoObject);
	    // trust user provided HTML
	    //  	    trustUserHTML(geoObject, "ka2.beschreibung")
	    //	    trustUserHTML(geoObject, "ka2.oeffnungszeiten")
	    //
	    $scope.detailGeoObject = geoObject;

	    console.log("Details description" + geoObject.composite["ka2.beschreibung"].value);
	});
    };
});


app.directive("leaflet", function() {
    return {
	restrict: 'E',
	template: '<div id="map"></div>',
	link: function(scope) {
	    console.log("link function called")
	    var markersLayer = new L.layerGroup();
	    var baseLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	    });

	    var map = L.map('map', {
		center: [52.52, 13.41],
		zoom: 13,
		layers: [baseLayer]
	    });


	    scope.map = {
		addMarker: function (lon, lat) {
		    var marker = L.marker([lat, lon]).addTo(markersLayer).bindPopup('Hello. <br> World?.')
		    .openPopup();
		    markersLayer.addTo(map);
		    console.log("ADD TO markersLayer" + markersLayer);
		},
		removeMarkers: function(){
		    console.log("REMOVE markersLayer" + markersLayer);
		    markersLayer.clearLayers();
		}
	    }
	}
    };
});



app.service("frontendService", function($http) {
    this.getAllCriteria = function(callback) {
	$http.get("/site/criteria").success(callback);
    };

    this.getCriteriaCategories = function(criteriaTypeUri, callback) {
        $http.get("/core/topic/by_type/" + criteriaTypeUri).success(callback);
    };

    this.getGeoObjectsByCategory = function (categoryId, callback){
        $http.get("/site/category/" + categoryId + "/objects").success(callback);
    };

    this.getFacettedGeoObjects = function(geoObjectId, facetTypeUris, callback){
	$http.get("/facet/topic/" + geoObjectId + "?" + queryString("facet_type_uri", facetTypeUris)).success(callback)
    };

    function queryString(paramName, values) {
	var params = [];
	angular.forEach(values, function(value) {
	    params.push(paramName + "=" + value);
	})
	return params.join("&");
    };

});

