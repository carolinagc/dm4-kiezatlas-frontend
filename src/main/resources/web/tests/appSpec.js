'use strict';
describe("Testing the controller sidebarController", function(){
    beforeEach(module('kiezatlasFrontend'));
    var kiezatlasCtrl, scope, criteria, httpBackend;

    beforeEach(inject(function($controller, $rootScope, frontendService,  $httpBackend){
        scope = $rootScope;
        httpBackend = $httpBackend;
        var frontendService = frontendService;
        var siteId=7821;
        kiezatlasCtrl = function() {
            return  $controller("sidebarController", {
                $scope: scope,
                $http: $httpBackend
            }) ;
        };
    }));


    it("on load state  should be  initial", function() {
         kiezatlasCtrl();
         expect(scope.state).toBe("initial");
     });

      it("should  get all  criteria", function(){
         criteria = httpBackend.expectGET('/site/criteria').respond(200,{
             0: {uri:"ka2.criteria.ueberregional" , value: "Überregional"},
             1: {uri:"ka2.criteria.zielgruppe" , value:  "Zielgruppe"}
         });

          kiezatlasCtrl();
          httpBackend.flush();
          expect(criteria[0].uri).toBe("ka2.criteria.zielgruppe");
          expect(criteria[0].value).toBe("Zielgruppe");
    });


    it("should  get criteria categories", function(){
        httpBackend.expectGET('/core/topic/by_type/ka2.criteria.zielgruppe').respond(200);
    });

});