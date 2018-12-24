'use strict';
/*
This module will deal with the admin interface to allow manual grading of submissions.
I will also hold the controllers responsible for displaying the submissions to the users so they can verify
their submitted files before grading.
 */



import angular from "angular";
import _ from "underscore";
import moment from 'moment';
import config from "../../config/config";
import viewSubmissionHtml from './submitUI.html';
import gradeSubmissionHtml from './gradeUI.html';
import allGradeHtml from './allGrades.html';
import adminGradeHtml from './AdminGrade.html';
import adminSubmissionHtml from './AdminSubmission.html';
import allSubmissionHtml from './allSubmissions.html';
import viewUserSubmissions from './viewUserSubmissions.html';
import userGradeOverviewHtml from './userGradeOverview.html';

( function () {
    angular.module('autograder').config(['$stateProvider',
        function (stateProvider) {
            stateProvider.state('viewSubmission', {
                url: '/viewSubmission?user&target&uuid',
                parent: 'authentication',
                needsAuth: true,
                templateUrl: viewSubmissionHtml
            }).state('gradeSubmission', {
                url: '/gradeSubmission?user&target',
                parent: 'authentication',
                needsAuth: true,
                templateUrl: gradeSubmissionHtml
            }).state('allgrades', {
                url: '/allgrades?target',
                parent: 'authentication',
                needsAuth: true,
                templateUrl: allGradeHtml
            }).state('admingrades', {
                    url: '/admingrades',
                    parent: 'authentication',
                    needsAuth: true,
                    templateUrl: adminGradeHtml
            }).state('adminsubmissions',{
                url: '/adminsubmissions',
                parent: 'authentication',
                needsAuth: true,
                controller: AdminSubmissionController,
                templateUrl: adminSubmissionHtml
            }).state('allsumbissions', {
                url: '/allsubmissions?target',
                parent: 'authentication',
                needsAuth: true,
                templateUrl: allSubmissionHtml,
                controller: AllSubmissionController
            }).state('viewusersubmissions',{
                url: '/viewusersubmissions?user&target',
                parent: 'authentication',
                needsAuth: true,
                templateUrl: viewUserSubmissions,
                controller: viewSubmissionsOfUserController
            }).state('usergradeoverview', {
                url: '/gradeoverview?user',
                parent: 'authentication',
                needsAuth: true,
                templateUrl:userGradeOverviewHtml,
                controller: userGradeOverviewController
            })
        }])
        .controller('SubmissionController',
            ['$scope', '$resource', '$stateParams', function ($scope, $resource, $stateParams) {
                const identity = $scope.identity;
                let user = $stateParams.user;
                let target = $stateParams.target;
                let uuid = $stateParams.uuid;
                $scope.user = user;
                $scope.downloadLink = config.judgeapiurl + "/downloadsubmission/" +
                    target + "/" + uuid + '?user=' + user;
                $scope.submission = $resource(
                    config.judgeapiurl + "/upload/" + target + "/" + uuid, {'user': user}).get();
                /*$scope.submit = function () {
                    let updateUrl = config.judgeapiurl + '/updateresults/' + target + '/' + uuid;
                     $resource(updateUrl).save($scope.submission.result, function (result) {
                         $scope.submissionResult = result;
                    });
                    //console.log($scope.submission.result)
                };*/
                $scope.pointTotal = function () {
                    let points = $scope.submission.result.grade.points;
                    let total = 0;
                    for (let key in points){
                        let point = points[key];
                        total += (parseInt(point.value, 10) || 0);
                    }
                    return total;
                }
            }])
        .controller('GraderController',
            ['$scope', '$resource', '$stateParams', '$state', function ($scope, $resource, $stateParams, $state) {
                const identity = $scope.identity;
                let user = $stateParams.user;
                let target = $stateParams.target;
                $scope.user = user;
                $scope.target = target;
                $scope.moment = moment;
                $scope.duedate = config.projecttargets[target].duedate;
                $scope.done = false;
                const UploadNames = $resource(config.judgeapiurl + "/uploadnames", {'user': user});

                function updateUploads() {
                    if (!$scope.done) {
                        $scope.submissions = [];
                        UploadNames.query(function (tuples) {
                            tuples.forEach(function (tuple) {
                                let uuid = tuple[0];
                                let id = tuple[1];

                                if (id === target) {
                                    $resource(config.judgeapiurl + "/upload/" + id + "/" + uuid, {'user': user}).get(
                                        function (result) {
                                            $scope.submissions.push(result);
                                        }
                                    )
                                }
                                $scope.done = true;
                            })
                        }, function (err) {
                            console.log(err);
                        });
                    }
                }
                $scope.error = false;
                $scope.downloadLink = "";
                $resource(
                    config.judgeapiurl + "/getgrade/" + target + "/" + user).get(function(result){
                    $scope.downloadLink = config.judgeapiurl + "/downloadsubmission/" +
                        target + "/" + result.uuid + '?user=' + user;
                    $scope.submission = result
                }, function(error){
                        if (error.status === 404) {
                            $scope.error = true;
                            updateUploads();
                        }
                        return undefined;
                });
                $scope.errorCheck = function(){
                        updateUploads()
                };
                $scope.selectSubmission = function(submission){
                    $resource(config.judgeapiurl + "/updategrade/" + target + '/' + user).save(submission, function () {
                        $state.reload();
                    });
                };


                $scope.currentPage = 1;

                $scope.submitToPartner = {value: true};

                let submitToUser = function(submission, user){
                    console.log('Submitting to ' + user);
                    let updateUrl = config.judgeapiurl + '/updategrade/' + target + '/' + user;
                    $resource(updateUrl).save(submission, function(result){
                        $scope.submissionResult = result;
                        console.log(result)
                    });
                };

                let findPartner = function(submission) {
                    if(submission && submission.result && submission.result.grade && submission.result.grade.files) {
                        for (let file of submission.result.grade.files) {
                            if (file.name === './partner.json') {
                                let partners = angular.fromJson(file.contents);
                                for (let partner of partners) {
                                    if (partner.toLowerCase() !== user.toLowerCase()) {
                                        return partner.toLowerCase();
                                    }
                                }

                            }
                        }
                    }
                    return undefined;
                };
                $scope.findPartner = findPartner;

                $scope.submit = function (submission) {
                    submitToUser(submission, user);
                    if ($scope.submitToPartner.value){
                        let partner = findPartner(submission);
                        if (partner){
                            submitToUser(submission, partner);
                        }

                    }
                };

                $scope.pointTotal = function () {
                    let points = $scope.submission.result.grade.points;
                    let total = 0;
                    for (let key in points){
                        let point = points[key];
                        total += (parseInt(point.value, 10) || 0);
                    }
                    return total;
                };
                $scope.pointMax = function(){
                    let points = $scope.submission.result.grade.points;
                    let total = 0;
                    for (let key in points){
                        let point = points[key];
                        total += (parseInt(point.max, 10) || 0);
                    }
                    return total;
                }

            }])
        .controller('AllGradesController',
            ['$scope', '$resource', '$stateParams', function ($scope, $resource, $stateParams) {
                const identity = $scope.identity;
                let target = $stateParams.target;
                $scope.target = target;
                let pointGetTotal = function (submission) {
                    let points = submission.result.grade.points;
                    let total = 0;
                    for (let key in points){
                        let point = points[key];
                        total += (parseInt(point.value, 10) || 0);
                    }
                    return total;
                };
                $resource(config.judgeapiurl + "/getusers/" + target).query(function(users){
                    let user_objs = [];
                    for (let user of users){
                        let obj = {'user': user, 'total': ''};
                        $resource(config.judgeapiurl + "/getgrade/" + target + "/" + user).get(function(result){
                                try {
                                    obj['total'] = pointGetTotal(result)
                                }
                                catch(error){
                                    obj['total'] = undefined
                                }
                            }, function(error){
                                if (error.status === 404) {
                                    obj['total'] = undefined
                                }
                                return undefined;
                            });
                        user_objs.push(obj)
                    }
                    $scope.users = user_objs;
                });

            }])
        .controller('AdminGradeLandingController',
            ['$scope', '$resource', '$stateParams', function ($scope, $resource, $stateParams) {
                const identity = $scope.identity;
                $scope.targets = config.projecttargets;
            }]);


    let AdminSubmissionController = function ($scope) {
        $scope.targets = config.projecttargets;
    };

    let AllSubmissionController = function($scope, $resource, $stateParams){
        let target = $stateParams.target;
        $scope.target = target;
        $resource(config.judgeapiurl + "/getusers/" + target).query(function(users){
            let user_objs = [];
            for (let user of users){
                let obj = {'user': user};
                user_objs.push(obj)
            }
            $scope.users = user_objs;
        }, function (error) {
            $scope.error = error;
        });
    };
    let viewSubmissionsOfUserController= function ($scope, $resource, $stateParams) {
        let user = $stateParams.user;
        let target = $stateParams.target;
        $scope.user = user;
        $scope.target = target;
        $scope.moment = moment;
        $scope.duedate = config.projecttargets[target].duedate;

        const UploadNames = $resource(config.judgeapiurl + "/uploadnames", {'user': user});

        function updateUploads() {
            $scope.submissions = [];
            UploadNames.query(function (tuples) {
                tuples.forEach(function (tuple) {
                    let uuid = tuple[0];
                    let id = tuple[1];

                    if (id === target) {
                        $resource(config.judgeapiurl + "/upload/" + id + "/" + uuid, {'user': user}).get(
                            function (result) {
                                $scope.submissions.push(result);
                            }
                        )
                    }
                })
            }, function (err) {
                console.log(err);
            });
        }

        updateUploads();
        $scope.currentPage = 1;
    };
    let userGradeOverviewController = function($scope, $resource, $stateParams, $state){
        let user = $stateParams.user || $scope.identity.name;
        if (!$stateParams.user && user){
            $state.go('.', {user: user});
        }
        $scope.user = user;
        $scope.error = undefined;
        let pointGetTotal = function (submission) {
            let points = submission.result.grade.points;
            let total = 0;
            for (let key in points){
                let point = points[key];
                total += (parseInt(point.value, 10) || 0);
            }
            return total;
        };
        let pointGetMax = function (submission){
            let points = submission.result.grade.points;
            let total = 0;
            for (let key in points){
                let point = points[key];
                total += (parseInt(point.max, 10) || 0);
            }
            return total;
        };
        $resource(config.judgeapiurl + '/getgrades/' + user).query(
            function (result) {
                for (let grade of result){
                    grade.total = pointGetTotal(grade.grade);
                    grade.max = pointGetMax(grade.grade);
                }
                if (result.length) {
                    $scope.grades = result;
                }
                else{
                    $scope.error = {
                        data:{
                            message: "Could not find any grades for " + user
                        }
                    }
                }
            }, function(error){
                $scope.error = error
            }
        );
        $scope.exams = $resource(config.judgeapiurl + '/getexams/' + user).get();
        $scope.config = config;
    };
})();
