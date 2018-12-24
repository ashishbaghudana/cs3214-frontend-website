'use strict';

/*
 * Code related to Eric's analysis project.
 */
import angular from 'angular'
import analysispage from './analysispage.html';
import dynamicfile from './dynamicfile.html';
import analysisInfo from './analysis_info_page.html';
import '@uirouter/angularjs';
import ocLazyLoad from 'oclazyload';
import pagination from 'angular-ui-bootstrap/src/pagination';
import eshMDExplination from './EshMDExplination.html';
import shellTrace from './shellTraceExplination.html';

let analysis_module = (function () {
    return angular.module('autograder.analysis', ['ui.router', ocLazyLoad, pagination])
        .config(['$stateProvider',
            function (stateProvider) {
                stateProvider.state('analysispage', {
                    parent: 'authentication',
                    needsAuth: true,
                    url: '/getanalysispage?user&target&uuid',
                    templateUrl: analysispage,
                    resolve: {
                        lazyLoad: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
                            let deferred = $q.defer();
                            require.ensure([], function () {
                                //
                                // All the code here, plus the required modules
                                // will be bundled in a separate file.
                                let analysis_module_req = require('./analysis_implementation');
                                //
                                // OCLazyLoad's 'load' function loads the Angular module.
                                $ocLazyLoad.load({
                                    name: analysis_module_req.default.name
                                });

                                deferred.resolve(module);
                            });
                            return deferred.promise;

                        }]
                    }
                }).state('eshmd', {
                    url: '/eshmd',
                    templateUrl: eshMDExplination,
                    resolve: {
                        lazyLoad: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
                            let deferred = $q.defer();
                            require.ensure([], function () {
                                //
                                // All the code here, plus the required modules
                                // will be bundled in a separate file.
                                let analysis_module_req = require('./analysis_implementation');
                                //
                                // OCLazyLoad's 'load' function loads the Angular module.
                                $ocLazyLoad.load({
                                    name: analysis_module_req.default.name
                                });

                                deferred.resolve(module);
                            });
                            return deferred.promise;

                        }]
                    }
                })
                    .state('shelltrace', {
                        url: '/shelltrace',
                        templateUrl: shellTrace,
                        resolve: {
                            lazyLoad: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
                                let deferred = $q.defer();
                                require.ensure([], function () {
                                    //
                                    // All the code here, plus the required modules
                                    // will be bundled in a separate file.
                                    let analysis_module_req = require('./analysis_implementation');
                                    //
                                    // OCLazyLoad's 'load' function loads the Angular module.
                                    $ocLazyLoad.load({
                                        name: analysis_module_req.default.name
                                    });

                                    deferred.resolve(module);
                                });
                                return deferred.promise;

                            }]
                        }
                    })
                    .state('analysis', {
                        parent: 'authentication',
                        needsAuth: true,
                        url: '/analysis',
                        templateUrl: analysisInfo,
                        resolve: {
                            lazyLoad: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
                                let deferred = $q.defer();
                                require.ensure([], function () {
                                    //
                                    // All the code here, plus the required modules
                                    // will be bundled in a separate file.
                                    let analysis_module_req = require('./analysis_implementation');
                                    //
                                    // OCLazyLoad's 'load' function loads the Angular module.
                                    $ocLazyLoad.load({
                                        name: analysis_module_req.default.name
                                    });

                                    deferred.resolve(module);
                                });
                                return deferred.promise;

                            }]
                        }
                    })
                    .state('dynamicFile', {
                        parent: 'authentication',
                        needsAuth: true,
                        url: '/getdynamicfile?user&target&uuid&file&line',
                        templateUrl: dynamicfile,
                        resolve: {
                            lazyLoad: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
                                let deferred = $q.defer();
                                require.ensure([], function () {
                                    //
                                    // All the code here, plus the required modules
                                    // will be bundled in a separate file.
                                    let analysis_module_req = require('./analysis_implementation');
                                    //
                                    // OCLazyLoad's 'load' function loads the Angular module.
                                    $ocLazyLoad.load({
                                        name: analysis_module_req.default.name
                                    });

                                    deferred.resolve(analysis_module_req);
                                });
                                return deferred.promise;

                            }]
                        }
                    })
            }])

})().name;

export default analysis_module;