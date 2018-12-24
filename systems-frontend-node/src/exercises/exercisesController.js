'use strict';
import angular from "angular";
import frontendConfig from '../config/config';
import moment from 'moment';

(function () {
    angular.module('autograder')
        .controller('ExercisesController',
            ['$scope', '$stateParams', '$location', '$resource', '$state',
                function (scope, $stateParams, location, resource, state) {
                    scope.exercises = (function () {
                        let exercises = [];
                        for (let pid in frontendConfig.projecttargets) {
                            let exercise = frontendConfig.projecttargets[pid];
                            if (!exercise.exercise) continue;
                            exercise['pid'] = pid;
                            exercise.duedate = new Date(exercise.duedate);
                            exercise.timeleft = moment(exercise.duedate).fromNow();
                            exercises.push(exercise);
                        }
                        return exercises;
                    })();
                }])

})();