'use strict';
import angular from "angular";
import willgrind_html from './willgrind.html';

(function () {
    angular.module('autograder')
        .config(['$stateProvider',
            function (stateProvider) {
                stateProvider.state('willgrind', {
                    url: '/willgrind',
                    templateUrl: willgrind_html
                })
            }])
})();