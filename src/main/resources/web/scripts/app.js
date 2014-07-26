var app = angular.module('kiezatlasFrontend', []);

app.controller('KiezAtlasController', ['$scope', function($scope){

}]);

app.directive("leaflet", function(){
    return {
	restrict: 'E',
	template: '<div id="map"></div>',
	link: function() {
	    var map = L.map('map').setView([52.52, 13.41], 16);
	    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	    }).addTo(map);
	}
    };
});
