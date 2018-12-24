'use strict';   // See note about 'use strict'; below
import 'jquery';
import angular from 'angular'
// This "bakes" the config into the static assets.
// Long term, we want the config to be dynamic, I think.
import config from '../config/config'
import hljs from 'angular-highlightjs';
import '@uirouter/angularjs'
import ngCookies from 'angular-cookies';
import ngFileUpload from 'ng-file-upload';
import ngResource from 'angular-resource';
import ngSanitize from 'angular-sanitize';
import ocLazyLoad from 'oclazyload';



import 'bootstrap';
// ui bootstrap
import accordion from 'angular-ui-bootstrap/src/accordion';
import bootstrapAffix from 'angular-bootstrap-affix';

import _ from 'underscore';

// Base CSS
import style from '../css/custom_style.css'
import '../css/bootswatch.less'


import analysis_module from './analysis/analysis_module';
import trace_analysis_module from './trace_analysis/trace_analysis_module';
// add in image files to final dist
import '../images/image_requires';

// https://github.com/webpack-contrib/expose-loader
require("expose-loader?popup!./popup.js");

// Template html files for general site routing
import linkview_template from '../templates/linkView.html';
import faq_template from '../templates/faqdirective.html';
import index_template from './base_index.html';
import login_template from '../templates/login.html';

(function () {
    const autograder = angular.module('autograder', [
        ngCookies,
        ngResource,
        ngFileUpload,
        accordion,
        ngSanitize,
        'ui.router',
        hljs,
        bootstrapAffix,
        ocLazyLoad,
        analysis_module,
        trace_analysis_module
    ]);
    const TableSorter = function () {
        // toggle sort direction
        this.toggle = function (sortby) {
            if (this.sortby === sortby) {
                if (sortby.charAt(0) === '-')
                    this.sortby = sortby.substring(1);
                else
                    this.sortby = '-' + sortby;
            } else {
                this.sortby = sortby;
            }
        }
    };
    let logOutFunction; // called in module.config (where $stateProvider is available to define
                        // logout state), defined in module.run (since it needs $rootScope)
    let handleLogin = function (identity, $rootScope) {
        $rootScope.identity = identity;
        return identity
    };
    autograder.factory('identity', ['$http', '$rootScope',
        function ($http, $rootScope) {
            if (angular.isDefined($rootScope.identity)) {
                return $rootScope.identity
            }
            return $http.get(config.auth.apiurl + "/whoami")
                .then(
                    function (response) {
                        let identity = response.data;
                        return handleLogin(identity, $rootScope);
                    })
                .catch(
                    function (error) {
                        if (error.status == 403) {
                            $rootScope.identity = undefined;
                            error.redirectTo = "login";
                        }
                        throw error
                    })
        }
    ]);
    autograder.config(['$provide', '$locationProvider', '$httpProvider', '$stateProvider', 'identityProvider',
        function ($provide, locationProvider, httpProvider, stateProvider, identityProvider) {
            stateProvider.state('authentication', {
                abstract: true,
                needsAuth: true,
                // the resolve will happen before the state transition is allowed to proceed.
                resolve: {
                    identity: function () {
                        return identityProvider.$get();
                    }
                }
            }).state('home', {
                url: '/',
                templateUrl: index_template
            }).state('index', {
                url: '',
                templateUrl: index_template
            })
            .state('login', {
                url: '/login',
                templateUrl: login_template,
                controller: 'LoginController'
            }).state('logout', {
                parent: 'authentication',
                url: '/logout',
                onEnter: function () {
                    logOutFunction && logOutFunction ();
                }
            }).state('linkView', {
                parent: 'authentication',
                url: '/linkview?user&target&uuid',
                controller: function ($scope, $stateParams, $resource) {
                    $scope.user = $stateParams.user;
                    $scope.target = $stateParams.target;
                    $scope.uuid = $stateParams.uuid;
                    $scope.downloadLink = config.judgeapiurl + "/downloadsubmission/" +
                    $scope.target + "/" + $scope.uuid + '?user=' + $scope.user;
                    $resource(config.judgeapiurl + "/upload/" + $scope.target + "/" + $scope.uuid, {'user': $scope.user}).get(
                        function (result) {
                            $scope.submission = result;
                        })

                },
                templateUrl: linkview_template,
                needsAuth: true
            });
            httpProvider.defaults.withCredentials = true;
        }]).controller('PageController',
        ['$scope', '$sce', '$location',
            function (scope, sce, location) {
            }]).controller('NavController',
        ['$scope', '$sce', '$state',
            function (scope, sce, state) {
                scope.menuitems = config.nav_targets;
                // watch done have the value update in the UI
                scope.$watch('identity', function (identity) {
                    if (identity) {
                        scope.auth_user_name = identity.name;
                        scope.display_name = identity.display_name;
                    }
                });
            }])
        .controller('LinkViewController', [], function () {

        })
        .controller('LoginController',
            ['$scope', '$state', '$resource', '$rootScope', '$window',
                function ($scope, $state, $resource, $rootScope, $window) {
                    $scope.form = { }
                    $scope.signin = function () {
                        $scope.submissionInvalid = false;
                        if ($scope.form.username && $scope.form.password) {
                            $resource(config.auth.apiurl + "/login").save($scope.form,
                            function (response) {
                                $scope.form = { }
                                handleLogin(response, $rootScope);
                                if ($scope.toState) $state.go($scope.toState.name, $scope.toStateParams);
                                else $state.go('home');
                            }, function (error) {
                                $scope.submissionInvalid = true;
                            });
                        }
                    };
                    if (config.auth.cas) {
                        const casListener = (event) => {
                            if (event.data.casok) {
                                handleLogin(event.data.whoami, $rootScope);
                                if ($scope.toState) $state.go($scope.toState.name, $scope.toStateParams);
                                else $state.go('home');
                            }
                        };
                        $window.addEventListener("message", casListener, false);
                        $scope.$on("$destroy", () => {
                            $window.removeEventListener("message", casListener);
                        });
                    }

                    $scope.cancel = function () {
                        $state.go('home');
                    }
                }
            ])
        .controller('SubmissionsController',
            ['$scope', '$resource', 'Upload', '$timeout', '$interval', '$location', '$state',
                function (scope, resource, Upload, $timeout, $interval, $location, state) {
                    let identity = scope.identity;
                    const q = $location.search();
                    const userpid = q.pid;
                    scope.auth_user_name = identity.name;
                    scope.display_name = identity.display_name;
                    scope.settings = new TableSorter();
                    scope.columns = [
                        {
                            label: "Id",
                            title: 'Sort by submission target',
                            sortby: 'target'
                        },
                        {
                            label: "Submission",
                            title: 'Sort by uuid',
                            sortby: 'uuid'
                        },
                        {
                            label: "Created",
                            title: 'Sort by creation time',
                            sortby: 'created'
                        },
                        {
                            label: "Last Modified",
                            title: 'Sort by processing time',
                            sortby: 'lastmodified'
                        },
                        {
                            label: "Status",
                            sortby: 'status'
                        },
                    ];
                    scope.submissionusername = userpid || scope.auth_user_name;
                    scope.auth_user_name = scope.submissionusername;
                    let apiUrlBase = config.judgeapiurl;
                    scope.linkFunction = function (selectedSubmission) {
                        let id = selectedSubmission.uuid;
                        let user = scope.submissionusername;
                        let target = selectedSubmission.target;
                        if(!selectedSubmission.result.valid){
                            state.go('viewSubmission', {uuid: id, user: user, target: target})
                        }
                        else if (target === 'analysis') {
                            state.go('analysispage', {uuid: id, user: user, target: target})
                        }
                        else if (target === 'analysis-trace') {
                            state.go('trace-analysis', {uuid: id, user: user, target: target})
                        }
                        else {
                            state.go('viewSubmission', {uuid: id, user: user, target: target});
                        }
                    };

                    const UploadNames = resource(apiUrlBase + "/uploadnames", {user: scope.submissionusername});

                    function updateUploads() {
                        scope.submissions = [];
                        UploadNames.query(function (tuples) {
                            tuples.forEach(function (tuple) {
                                let uuid = tuple[0];
                                let id = tuple[1];
                                if (id === 'analysis' || id === 'analysis-trace') {
                                    // do not grab the resource
                                }
                                else {
                                    resource(apiUrlBase + "/upload/" + id + "/" + uuid, {user: scope.submissionusername}).get(
                                        function (result) {
                                            scope.submissions.push(result);
                                        }
                                    )
                                }
                            })
                        }, function (err) {
                            console.log(err);
                        });
                    }

                    updateUploads();
                    //$interval(updateUploads, 5000);


                    const projects = config.projecttargets;
                    scope.projects = projects;
                    // suggest closest project
                    scope.pid = _.min(_.filter(_.keys(projects),
                        function (pid) {
                            return new Date() < projects[pid].duedate;
                        }), function (pid) {
                        return projects[pid].duedate;
                    });

                    scope.uploadFile = function (pid, file) {
                        file.upload = Upload.upload({
                            url: apiUrlBase + '/upload/' + pid,
                            data: {uploadedfile: file},
                        });

                        file.upload.then(function (response) {
                            file.result = response.data;
                            if (response.data.upload === 1) {
                                updateUploads();
                            }
                            $timeout(function () {
                                if (response.data.upload === 1)
                                    delete response.data.upload;    // hide success message
                                delete file.progress;       // hide progress bar
                            }, 2000);
                        }, function (response) {
                            if (response.status > 0)
                                scope.errorMsg = response.status + ': ' + response.data;
                        }, function (evt) {
                            // Math.min is to fix IE which reports 200% sometimes
                            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                        });
                    }

                }])

        .run(function ($rootScope, $location, $resource, $cookies, $interval, $window, $timeout, identity, $stateRegistry, $state, $transitions) {
            identity.catch(function(){});
            $rootScope.frontendConfig = config;
            const matchAllStatesExceptLogin = function (state) {
                return state.name != "login"
            };
            $transitions.onStart({to: matchAllStatesExceptLogin}, function (trans) {
                // Save the return to state for if we need to redirect to login.
                $rootScope.toState = trans.to();
                $rootScope.toStateParams = trans.params();
            });
            $state.defaultErrorHandler(function() {
                // Do not log transitionTo errors
            });
            $transitions.onError({/* all transitions */}, function (current_transition) {
                /*
                    if we have an error on authentication redirect them to the login state
                        else just go back to the home state.
                 */
                //event.preventDefault();
                const stateTo = current_transition.to();
                const error = current_transition.error().detail;
                if (stateTo.needsAuth && error.redirectTo) {
                    if (stateTo.name != error.redirectTo) {
                        $state.go(error.redirectTo)
                    }
                }
                else {
                    if (stateTo.name != 'home') {
                        $state.go('home')
                    }
                }
                return false;
            });

            logOutFunction = function () {
                $resource(config.auth.apiurl + "/logout").get(function (response) {
                    $rootScope.identity = undefined;
                    $state.go('home');
                });
            };

            function addStateFromMenuItem(item, needsAuthentication) {
                let state_name = item.state || item.label.toLowerCase();    // fall back to Eric's hack
                let state =  $stateRegistry.get(state_name);
                if (!state) {
                    let state_body = {name: state_name, url: item.path, templateUrl: item.templateUrl};
                    if (needsAuthentication) {
                        state_body.parent = 'authentication';
                        state_body.needsAuth = true;
                    }
                    $stateRegistry.register(state_body);
                } else {
                    // if state is already registered, place the URL in the path attribute of the item
                    item.path = state.url.replace(/\?.*/, "");  // trim query part of URL
                }
            }

            // add the routes for the menu items listed in config.
            config.nav_targets.topbar.forEach(function (item) {
                addStateFromMenuItem(item, item.needauthentication);
            });
            config.nav_targets.dropdowns.forEach(function (dropdownmenu) {
                dropdownmenu.entries.forEach(function (item) {
                    addStateFromMenuItem(item, dropdownmenu.needauthentication || item.needauthentication);
                });
            });
        })
        // http://justinklemm.com/angularjs-filter-ordering-objects-ngrepeat/
        .filter('orderObjectBy', function() {
            return function(items, field, reverse) {
                let filtered = [];
                angular.forEach(items, function(item) {
                    filtered.push(item);
                });
                filtered.sort(function (a, b) {
                    return (a[field] > b[field] ? 1 : -1);
                });
                if(reverse) filtered.reverse();
                return filtered;
            };
        }).directive('inFaq',
            ['$timeout',           /* number based on position in uib-accordion */
                function ($timeout) {
                    return {
                        restrict: 'A',
                        link: function (scope, element, attrs, controllers) {
                            element.find("[uib-accordion-transclude='heading'] span")
                                .prepend("Q" + (1+element.index()) + ". ");
                        }
                    };
                }])
        .directive('faq',
            [           /* wrap accordion into panel and add some controls. */
                function () {
                    return {
                        restrict: 'E',
                        templateUrl: faq_template,
                        transclude: true,
                        link: function (scope, element, attrs, controllers) {
                            scope.faqheading = attrs.faqHeading;
                            // reach into accordion component (!?)
                            let acc = element.find("uib-accordion");
                            let accscope = acc.scope();
                            scope.oneAtATime = true;

                            scope.$watch("showAll", function (showAll) {
                                scope.oneAtATime = !showAll;
                                angular.forEach(accscope.accordion.groups, function (group) {
                                    group.isOpen = showAll;
                                });
                            });
                        }
                    };
                }]);
})();

// add in projects controller
require('../projects/projectsController');

// add in exercises
require('../exercises/exercise');

// add in grouper app
require('./grouper/grouperController');

// views dealing with the processing and grading of submissions
require('./grading_ui/gradingUI');
