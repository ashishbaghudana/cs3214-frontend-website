'use strict';

/*
 * Code related to Eric's trace analysis project.
 */
import angular from 'angular'
import tracepage from './analysis.html';
import alltrace from './allview.html';
import '@uirouter/angularjs';
import ocLazyLoad from 'oclazyload';

let trace_analysis_module = (function () {

    return angular.module('autograder.traceanalysis', ['ui.router', ocLazyLoad])
        .config(['$stateProvider',
            function (stateProvider) {
                stateProvider.state('trace-analysis', {
                    parent: 'authentication',
                    needsAuth: true,
                    url: '/gettraceanalysispage?user&target&uuid',
                    templateUrl: tracepage,
                    resolve: {
                        lazyLoad: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
                            let deferred = $q.defer();
                            require.ensure([], function () {
                                //
                                // All the code here, plus the required modules
                                // will be bundled in a separate file.
                                let analysis_module_req = require('./trace_analysis_implementation');
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
                    .state('traceFiles', {
                        parent: 'authentication',
                        needsAuth: true,
                        url: '/gettracefiles?user&target&uuid&files&dir',
                        templateUrl: alltrace,
                        resolve: {
                            lazyLoad: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
                                let deferred = $q.defer();
                                require.ensure([], function () {
                                    //
                                    // All the code here, plus the required modules
                                    // will be bundled in a separate file.
                                    let analysis_module_req = require('./trace_analysis_implementation');
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
            }])

})().name;

export default trace_analysis_module;