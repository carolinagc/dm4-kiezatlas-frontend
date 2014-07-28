var app = angular.module('kiezatlasFrontend', []);

app.controller('criteriaController', function($scope, frontendService) {
    frontendService.getAllCriteria(function(criteria) {
	$scope.criteria = criteria;
    });

    $scope.selectCriteria = function(selectedCriteria) {
	$scope.currentCriteria = selectedCriteria.value;
    };

 
});


app.directive("leaflet", function() {
    return {
	restrict: 'E',
	template: '<div id="map"></div>',
	link:function () {
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
});


