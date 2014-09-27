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
    
    this.searchGeoObjects = function(searchTerm) {
        return $http.get("/site/geoobject?search=" + searchTerm)
    };

    this.searchCategories = function(searchTerm) {
        return $http.get("/site/category/objects?search=" + searchTerm)
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
