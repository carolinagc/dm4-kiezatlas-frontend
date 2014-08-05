/*
ViewModel
    criteria - the criteria shown upper/left (array of topics)
    currentCriteria - name of selected criteria (string)
    criteriaCategories - the categories shown in the lower/left (array of topics)


*/



var app = angular.module('kiezatlasFrontend', []);

app.controller('sidebarController', function($scope, frontendService) {

    frontendService.getAllCriteria(function(criteria) {
	$scope.criteria = criteria;
    });

    $scope.selectCriteria = function(selectedCriteria) {
	$scope.currentCriteria = selectedCriteria.value;
	frontendService.getCriteriaCategories(selectedCriteria.uri, function(criteriaCategories) {
            $scope.criteriaCategories = criteriaCategories.items;
	});
    };

    $scope.showCategoryGeoObjects = function(category){
	frontendService.getGeoObjectsByCategory(category.id, function(geoObjects) {
	    console.log(geoObjects);
	    angular.forEach(geoObjects, function(geoObject) {
		var geoCoord = geoObject.composite["dm4.contacts.address"].composite["dm4.geomaps.geo_coordinate"].composite;
		var lon = geoCoord["dm4.geomaps.longitude"].value;
		var lat = geoCoord["dm4.geomaps.latitude"].value;
		console.log(lon, lat);
	    });
	});		
    };

});


app.directive("leaflet", function() {
    return {
	restrict: 'E',
	template: '<div id="map"></div>',
	link: function () {
	    var map = L.map('map').setView([52.52, 13.41], 16);
	    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	    }).addTo(map);
	    var marker = L.marker([52.52, 13.41]).addTo(map).bindPopup('Hello. <br> World?.')
		.openPopup();
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

});

