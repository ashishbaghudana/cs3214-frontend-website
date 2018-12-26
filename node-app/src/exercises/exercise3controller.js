import angular from "angular";
import config from "../config/config";

(function () {
    angular.module('autograder')
        .controller('OutfoxedExerciseController',
            ['$scope', '$resource',
                function (scope, resource) {
                    scope.outfoxed = resource(config.judgeapiurl + '/cs3214/exercises/ex3').get();
                }])

})();