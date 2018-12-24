import angular from "angular";
import config from '../config/config';


(function () {
    angular.module('autograder')
        .controller('Exercise1Controller',
            ['$scope', '$resource',
                function (scope, resource) {
                    scope.exercise1 = resource(config.judgeapiurl + '/cs3214/exercises/ex1').get();
                }])

})();