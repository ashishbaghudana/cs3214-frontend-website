'use strict';

/*
 * Code related to Eric's analysis project.
 */
import angular from 'angular'
import analysispage from './analysispage.html';
import dynamicfile from './dynamicfile.html';
import config from "../../config/config";

import Prism from './prism';
import _ from "underscore";


let rAmp = /&/g;
let rLt = /</g;
let rApos = /'/g;
let rQuot = /"/g;
let hChars = /[&<>"']/;

let escape = function (str) {
    if (str == null) {
        return str;
    }

    if (typeof str !== "string") {
        str = String(str);
    }

    if (hChars.test(String(str))) {
        return str
            .replace(rAmp, '&amp;')
            .replace(rLt, '&lt;')
            .replace(rApos, '&apos;')
            .replace(rQuot, '&quot;');
    }
    else {
        return str;
    }
};

export default (function () {
    return angular.module('autograder.analysis')
        .controller('AnalysisPageController',
            ['$scope', '$stateParams', '$resource', '$timeout', '$state',
                function ($scope, $stateParams, resource, timeout, $state) {
                    let user = $stateParams.user;
                    let target = $stateParams.target;
                    let uuid = $stateParams.uuid;
                    $scope.frontendConfig = config;
                    let base_lookup_url = config.judgeapiurl + '/getfile/' + user + '/' +
                        target + '/judge-files/' + uuid + '/';
                    $scope.static_url = base_lookup_url + 'index.html';
                    $scope.toggle = function (item) {
                        item.snip = !item.snip;
                    };
                    $scope.showSnip = function (item) {
                        return item.snip;
                    };
                    $scope.fileLinkFunction = function (stackFrame) {
                        let file = stackFrame.file.baseName;
                        let line = stackFrame.file.line;
                        $state.go('dynamicFile', {uuid: uuid, user: user, target: target, file: file, line: line})
                    };
                    $scope.pid = user;
                    let dynamicResults = resource(base_lookup_url + 'dynamic_analysis_results.json');
                    $scope.dynresult = dynamicResults.query();
                }])
        .controller('AnaDynamicFileController',
            ['$scope', '$stateParams', '$location', '$resource',
                function (scope, $stateParams, location, resource) {
                    let user = $stateParams.user;
                    let target = $stateParams.target;
                    let uuid = $stateParams.uuid;
                    let file = $stateParams.file;
                    scope.line = $stateParams.line;
                    let base_lookup_url = config.judgeapiurl + '/getfile/' + user + '/' +
                        target + '/judge-files/' + uuid + '/src-files/';


                    let options = {
                        no_json: {
                            method: 'GET',
                            transformResponse: function (data) {
                                return {result: escape(data)};
                            }
                        }
                    };
                    let File = resource(base_lookup_url + file, {}, options);

                    scope.fileResult = File.no_json();

                    scope.pid = user;
                    scope.file = file;
                }])

        .controller('AnalysisInfoController',
            ['$scope', '$stateParams', '$resource', '$location', 'Upload', '$state', '$timeout',
                function (scope, $stateParams, resource, $location, Upload, state, $timeout) {
                    let identity = scope.identity;
                    const q = $location.search();
                    const userpid = q.pid;
                    scope.auth_user_name = identity.name;
                    scope.display_name = identity.display_name;
                    scope.submissionusername = userpid || scope.auth_user_name;
                    let apiUrlBase = config.judgeapiurl;
                    scope.linkFunction = function (selectedSubmission) {
                        let id = selectedSubmission.uuid;
                        let user = scope.submissionusername;
                        let target = selectedSubmission.target;
                        if (!selectedSubmission.result.valid) {
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

                    const UploadNames = resource(apiUrlBase + "/uploadnames");
                    scope.currentPage = 1;
                    scope.eshMDsubmissions = [];
                    scope.shellTrace = [];
                    scope.analyses = {
                        both: []
                    };

                    function make_all_analyses() {
                        let sortedShell = _.sortBy(scope.shellTrace, 'created').reverse();
                        let sortedMD = _.sortBy(scope.eshMDsubmissions, 'created').reverse();
                        scope.analyses.both = [];
                        scope.maxItem = Math.max(sortedShell.length, sortedMD.length);
                        for (let i = 0; i < scope.maxItem; i++) {
                            let obj = {
                                'MD': undefined,
                                'Trace': undefined,
                                created: undefined
                            };
                            if (sortedShell.length > i) {
                                obj.Trace = sortedShell[i];
                                obj.created = sortedShell[i].created;
                            }
                            if (sortedMD.length > i) {
                                obj.MD = sortedMD[i];
                                obj.created = sortedMD[i].created;
                            }
                            scope.analyses.both.push(obj);
                        }
                        $timeout(function () {
                            scope.$apply(scope.analyses.both);
                        });

                    }

                    function updateUploads() {
                        scope.submissions = [];
                        scope.eshMDsubmissions.length = 0;
                        scope.shellTrace.length = 0;
                        UploadNames.query(function (tuples) {
                            tuples.forEach(function (tuple) {
                                let uuid = tuple[0];
                                let id = tuple[1];
                                if (id === 'analysis') {
                                    resource(apiUrlBase + "/upload/" + id + "/" + uuid).get(
                                        function (result) {
                                            scope.eshMDsubmissions.push(result);
                                            make_all_analyses();
                                        }
                                    )
                                }
                                else if (id === 'analysis-trace') {
                                    resource(apiUrlBase + "/upload/" + id + "/" + uuid).get(
                                        function (result) {
                                            scope.shellTrace.push(result);
                                            make_all_analyses();
                                        }
                                    )
                                }

                            })
                        }, function (err) {
                            console.log(err);
                        });
                    }

                    updateUploads();

                    scope.uploadFile = function (pid, file) {
                        file.upload = Upload.upload({
                            url: apiUrlBase + '/upload/' + 'analysis-trace',
                            data: {uploadedfile: file},
                        }).then(function () {
                            return Upload.upload({
                                url: apiUrlBase + '/upload/' + 'analysis',
                                data: {uploadedfile: file}
                            })
                        });

                        file.upload.then(function (response) {
                            file.result = response.data;
                            if (response.data.upload === 1) {
                                updateUploads()
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

        // https://github.com/angular/angular.js/issues/339
        .directive('embedSrc', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    let current = element;
                    scope.$watch(function () {
                        return attrs.embedSrc;
                    }, function () {
                        let clone = element
                            .clone()
                            .attr('src', attrs.embedSrc);
                        current.replaceWith(clone);
                        current = clone;
                    });
                }
            };
        })
        //https://github.com/mattmilburn/ng-prism
        .directive('ngPrism', ['$compile',
            function (compile) {
                return {
                    link: link,
                    restrict: 'A',
                    transclude: true,
                    scope: {
                        language: '@ngPrism',
                        source: '@ngPrismData'
                    },
                    template: '<code></code>'
                };


                ////////////////////////////////////////////////////////////////////////////////////////////////////


                function link(scope, element, attrs, controllers, transclude) {
                    // Add the language class for prism to highlight with the correct language syntax
                    element.addClass('language-' + scope.language);

                    // Re-highlight when the 'source' data changes
                    scope.$watch('source', function (value) {
                        if (value) {
                            element.find('code').html(value);

                            Prism.highlightElement(element.find('code')[0]);
                        }
                    });

                    // Handle transcluded content
                    transclude(function (clone) {
                        if (clone.html() !== undefined) {
                            element.find('code').html(clone.html());

                            Prism.highlightElement(element.find('code')[0]);

                            $compile(element.contents())(scope.$parent);
                        }
                    });
                }
            }])

})();