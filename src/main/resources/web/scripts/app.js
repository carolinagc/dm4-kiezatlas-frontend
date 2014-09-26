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

