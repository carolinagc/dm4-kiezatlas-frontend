/*
ViewModel
    state - The state the application is in, there are 4 states: "initial", "category list", "geo object list", "geo object details"
    criteria - the criteria shown upper/left (array of topics)
    currentCriteria - selected criteria (topic)
    criteriaCategories - the categories shown in the lower/left (array of topics)
    geoObjects - the geoObjects of a specific category
    detailGeoObject - the details of a geoObject
    currentCategory - the selected category (topic)

*/


var app = angular.module('kiezatlasFrontend', []);

/* Controllers */

app.controller('sidebarController', function($scope,frontendService) {
    var siteId=location.pathname.match(/\/website\/(\d+)/)[1];

    frontendService.getAllCriteria().then(function(response) {
	    $scope.criteria = response.data;
    });

    $scope.selectCriteria = function(selectedCriteria) {
	if ($scope.currentCriteria != selectedCriteria ){$scope.map.removeMarkers();};
	$scope.currentCriteria = selectedCriteria;
	    frontendService.getCriteriaCategories(selectedCriteria.uri).then(function(response) {
	        $scope.state="category list";
	        $scope.categories = response.data.items;
	    });
    };


    $scope.selectCategory = function(category) {
	    frontendService.getGeoObjectsByCategory(category.id).then(function(response) {
	        $scope.currentCategory = category;
	        $scope.state="geo object list";
	        $scope.geoObjects = response.data;
	        console.log(response.data);
	        angular.forEach(response.data, function(geoObject) {
		        var geoCoord = geoObject.composite["dm4.contacts.address"].composite["dm4.geomaps.geo_coordinate"].composite;
		        var lon = geoCoord["dm4.geomaps.longitude"].value;
		        var lat = geoCoord["dm4.geomaps.latitude"].value;
		        console.log(lon, lat);
		        $scope.map.addMarker(lon, lat, geoObject.id);
	        });
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
	    // trust user provided HTML
	    //  	    trustUserHTML(geoObject, "ka2.beschreibung")
	    //	    trustUserHTML(geoObject, "ka2.oeffnungszeiten")
	    //
	    $scope.detailGeoObject = response.data;
	    console.log("Details description", $scope.detailGeoObject.composite["ka2.beschreibung"].value);
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
	    var markersLayer = L.layerGroup();
	    var baseLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	    });

	    var map = L.map('map', {
		center: [52.5, 13.43],
		zoom: 14,
		layers: [baseLayer, markersLayer]
	    });

	    scope.map = {
		addMarker: function (lon, lat, geoObjectId) {
		    var marker = L.marker([lat, lon]).addTo(markersLayer).on('click', function(e) {
			scope.showGeoObjectDetails(geoObjectId);
		    });
		    console.log("ADD TO markersLayer" + markersLayer);
		    console.log("currentCategory is " + scope.currentCategory.value);
		},
		removeMarkers: function(){
		    console.log("REMOVE markersLayer" + markersLayer);
		    markersLayer.clearLayers();
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