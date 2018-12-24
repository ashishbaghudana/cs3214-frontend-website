'use strict';
import angular from "angular";
import seedrandom  from 'seedrandom';

import queue_stat from './queuestatus.html';
import varanalyzers from './varanalyzers.html';
import varview from './varsysview.html';
import varfailure from './varsysfailed.html';

(function () {


    /*
     * Code related to Lance's varsys project.
     */

    const SERVER_URL = "https://wendy.cs.vt.edu/head";
    //const SERVER_URL = "api";
    const FILES_URL = `${SERVER_URL}/getanalysisfile`;
    const VIEW_URL = `${SERVER_URL}/view`;
    const RESULT_URL = `${SERVER_URL}/results/:pid`;
    const QUEUE_STATUS_URL = `${SERVER_URL}/queuestatus`;
    const UPLOAD_PASSWORD = "hhq:GC>t$yk&2,G";
    const UPLOAD_URL = `${SERVER_URL}/uploader`;
    (function () {

        // http://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
        function makeRandomGenerator(m_w) {
            var m_z = 987654321;
            var mask = 0xffffffff;

            // Returns number between 0 (inclusive) and 1.0 (exclusive),
            // just like Math.random().
            return function () {
                m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
                m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
                var result = ((m_z << 16) + m_w) & mask;
                result /= 4294967296;
                return result + 0.5;
            }
        }

        angular.module('autograder')
            .config(['$stateProvider',
                function (stateProvider) {
                    stateProvider.state('getvaranalysispage', {
                        parent: 'authentication',
                        needsAuth: true,
                        url: '/getvaranalysispage',
                        templateUrl: varview
                    }).state('getvaranalysisfailure', {
                        parent: 'authentication',
                        needsAuth: true,
                        url: '/getvaranalysisfailure',
                        templateUrl: varfailure
                    }).state('getqueuestatuspage', {
                        parent: 'authentication',
                        needsAuth: true,
                        url: '/getqueuestatuspage',
                        templateUrl: queue_stat
                    })
                }])
            .controller('VarsysListController',
                ['$scope', '$filter', '$location', '$resource', '$timeout', 'Upload', '$window', '$rootScope',
                    function (scope, $filter, $location, resource, $timeout, Upload, $window, $rootScope) {
                        let identity = scope.identity;
                        let q = $location.search();
                        let pid = q.pid || identity.name;

                        const RESULT_URL = `${SERVER_URL}/results/:pid`;
                        scope.pid = pid;
                        const Analysis = resource(RESULT_URL, {pid: scope.pid});
                        (function poll() {
                                scope.analyses = Analysis.query(function () {
                                    $timeout(poll, 5000);
                                });
                            }
                        )();

                        scope.sendGA = function (options) {
                            /*options.forEach(function (option) {
                                if (option.checked) {
                                    $window.ga('send', 'event', "Selected", option.id);
                                } else {
                                    $window.ga('send', 'event', "Default", option.id, option.chosen);
                                }
                            });*/
                            // ga removed in intial porting.
                        };
                        scope.categorical = [
                            //    {value: 'Mode', id : 'Project Mode', checked : false,
                            //        tip: 'Choose Project mode', options : ['malloclab', 'threadlab'],
                            //     chosen : 'malloclab' },
                            {
                                value: 'Compiler', id: 'Compiler', checked: false,
                                tip: 'GCC vs Clang', options: ['gcc', 'clang'],
                                chosen: 'gcc'
                            },
                            {
                                value: 'TestName', id: 'Test Name', checked: false,
                                tip: 'Name of the test to run',
                                options: ["quicksort", "mergesort", "nqueens", "psum", "fibonacci"],
                                chosen: 'quicksort'
                            },

                            {
                                value: 'Size', id: 'Test Size', checked: false,
                                tip: 'Size of the test to run. It is suggested to run medium and large tests with more threads',
                                options: ['small', 'medium', 'large'],
                                chosen: 'small'
                            },

                            {
                                value: 'Affinity', id: 'Processor affinity', checked: false,
                                tip: 'No pinning vs Pin every thread to a different CPU core',
                                options: ['No_pinning', 'Pin_every_thread_to_different_CPU_core'],
                                chosen: 'No_pinning'
                            },
                            //  {value: 'Class', id : 'Scheduling class', checked : false,
                            //   tip: 'SCHED_RR (realtime) vs CFS scheduler (SCHED_OTHER)',
                            //   options : ['sched_other', 'sched_rr'],
                            //   chosen : 'sched_other' },
                            // {value: 'Hyperthreading', id : 'Hyperthreading', checked : false,
                            //  tip: 'Hyperthreading enabled vs disabled',
                            //  options : ['enabled', 'disabled'],
                            //  chosen : 'enabled' }
                        ];

                        scope.ordinal = [
                            {
                                value: 'Priority', id: 'Process Niceness', checked: false,
                                tip: 'Nice value from -20 (least nice) to 19 (most nice)',
                                options: ['-20', '-10', '0', '9', '19'], chosen: '0'
                            },
                            {
                                value: 'Hz', id: 'CPU frequency', checked: false,
                                tip: 'CPU frequency scaling',
                                options: ['1200000', '1400000', '1600000', '1800000', '2000000'],
                                chosen: '2000000'
                            },
                            {
                                value: 'Schedperiod', id: 'Scheduling period', checked: false,
                                tip: `When running under CFS, this is the value of sysctl.kernel.sched_latency_ns, which affects
                              the timeslice of a process`,
                                options: ['0.25', '0.5', '1', '2', '4'],
                                chosen: '1'
                            },
                            {
                                value: 'Threadcount', id: 'Thread Count', checked: false,
                                tip: 'Number of threads which the analysis will run with',
                                options: ['1', '2', '4', '8', '16'],
                                chosen: '4'
                            }
                        ];

                        const name = identity.name;
                        //Seeds Math.random()
                            //http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html#more
                            seedrandom(name, { global: true });
                            scope.shuffled_cat = $filter('orderBy')(scope.categorical, Math.random);
                            scope.shuffled_ord = $filter('orderBy')(scope.ordinal, Math.random);

                        scope.options = scope.categorical.concat(scope.ordinal);

                        scope.elem_checked = function (value) {
                            let i;
                            for (i = 0; i < scope.options.length; i++) {
                                const elem = scope.options[i];
                                if (elem.value == value && elem.checked) {
                                    return true;
                                }
                            }
                            return false;
                        };

                        scope.contradicting = function (curr_elem) {
                            const contradict = false;
                            if ((curr_elem.value == 'Priority' || curr_elem.value == 'Schedperiod') && scope.elem_checked('Class')) {
                                return true;
                            }

                            if (curr_elem.value == 'Class' && (scope.elem_checked('Priority') || scope.elem_checked('Schedperiod'))) {
                                return true;
                            }
                            return false;

                        };
                        scope.selected = function (options) {
                            var i, selectedCount = 0;
                            for (i = 0; i < options.length; i++) {
                                if (options[i].checked) {
                                    selectedCount++;
                                }
                            }
                            return selectedCount;
                        };

                        scope.total_selected = function () {
                            return scope.selected(scope.categorical) + scope.selected(scope.ordinal);
                        };

                        scope.uploadFile = function (pid, file, options) {
                            const flags = [];
                            const defaults = {};
                            for (let i = 0; i < options.length; i++) {
                                if (options[i].checked)
                                    flags.push(options[i].value);
                                else
                                    defaults[options[i].value] = options[i].chosen;
                            }
                            const data = {};
                            data['pid'] = pid;
                            data['flags'] = flags;
                            data['defaults'] = defaults;
                            data['password'] = UPLOAD_PASSWORD;
                            file.upload = Upload.upload({
                                url: UPLOAD_URL,
                                method: 'POST',
                                data: {uploadedfile: file, data: Upload.json(data)},
                                //Send this as multiple entries with same key format
                                arrayKey: ''
                            });

                            file.upload.then(function (response) {
                                file.result = response.data;
                                if (response.data.upload == 1) {
                                    scope.analyses = resource(RESULT_URL, {pid: scope.pidt.pid}).query();
                                }
                                $timeout(function () {
                                    if (response.data.upload == 1)
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
                        };
                    }])
            .controller('VarsysPageController',
                ['$scope', '$location', '$resource', '$timeout',
                    function (scope, $location, resource, timeout) {
                        let identity = scope.identity;
                        let q = $location.search();
                        scope.pid = q.pid || identity.name;
                        scope.id = q.id;
                        scope.plottype = q.plottype;
                        scope.jid = q.jid;

                        const url = `${FILES_URL}/${q.pid}/${q.id}/OPTIONS`;

                        resource(url).get(function (data) {
                            scope.options = data;
                        });

                    }])
            .controller('VarsysQueueController',
                ['$scope', '$resource', '$timeout',
                    function (scope, resource, timeout) {
                        scope.queue = resource(QUEUE_STATUS_URL).query();
                    }])
            .directive('renderView', ['$location', '$resource',
                function (location, resource) {
                    return {
                        restrict: 'A',
                        transclude: false,
                        scope: {
                            view: '@',
                        },
                        link: function (scope, element, attrs) {
                            //Create the chart
                            var graph = null;

                            let q = location.search();

                            const plot_url = `${VIEW_URL}/${scope.view}/${q.pid}/${q.id}`;

                            if (q.plottype == 'JSON') {
                                var viewdata = resource(plot_url).get(function (data) {

                                    //This is a Scatter 3D plot. Render it with vis.js
                                    var viewdata = data;

                                    // Function for creating 3D plot based on JSON returned by API call.
                                    function create_options(x_axis, y_axis, z_axis) {
                                        // Generate an "options" object for visualizing the 3D scatter plot
                                        var options = {
                                            //align: 'center',
                                            width: '100%',
                                            height: '300px',
                                            yCenter: '40%',
                                            style: "dot",
                                            backgroundColor: {
                                                fill: 'transparent', stroke: 'transparent', strokeWidth: 0
                                            },
                                            cameraPosition: {
                                                horizontal: 4.17, vertical: 0.11, distance: 1.8
                                            },
                                            dotSizeRatio: 0.015,
                                            keepAspectRatio: false,
                                            //verticalRatio: 0.8,
                                            // showShadow: false,
                                            xValueLabel: function (value) {
                                                return (value.toExponential(1));
                                            },
                                            yValueLabel: function (value) {
                                                return (value.toExponential(1));
                                            },
                                            zValueLabel: function (value) {
                                                return (value.toExponential(1));
                                            },
                                            xLabel: x_axis,
                                            yLabel: y_axis,
                                            zLabel: z_axis,
                                            // Option tooltip can be true, false, or a function returning a string with HTML contents
                                            tooltip: function (point) {
                                                // parameter point contains properties x, y, z
                                                return ('(' + (point.x).toFixed(0) + ',' +
                                                    (point.y).toFixed(0) + '):  ' +
                                                    (point.z).toExponential(1));
                                            }
                                        };
                                        return options;
                                    };

                                    var options = create_options(viewdata.x_axis, viewdata.y_axis, viewdata.z_axis);
                                    var viewdataset = new vis.DataSet();
                                    for (var i = 0; i < viewdata.points.length; i += 1) {
                                        viewdataset.add({
                                            x: viewdata.points[i][0],
                                            y: viewdata.points[i][1],
                                            z: viewdata.points[i][2]
                                        })
                                    }
                                    //Create the visualization
                                    var div = document.createElement("div");
                                    var p = document.createElement("p");
                                    p.style.textAlign = "center";
                                    var text = document.createTextNode(`${viewdata.z_axis} by ${viewdata.x_axis} vs ${viewdata.y_axis} ( ${scope.view} ) `);
                                    p.appendChild(text);
                                    element[0].appendChild(p);
                                    element[0].appendChild(div);

                                    //var graph3d = new vis.Graph3d(element[0], viewdataset, options);
                                    var graph3d = new vis.Graph3d(div, viewdataset, options);
                                });
                            } else {
                                //This is a value by variable plot. Get SVG from Thomas's server
                                if (plot_url != "") {
                                    var svg = document.createElement("embed");
                                    svg.src = plot_url;
                                    element[0].appendChild(svg);
                                }
                            }
                        }
                    };
                }])
            .directive('tooltip', function () {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        $(element).hover(function () {
                            // on mouseenter
                            $(element).tooltip('show');
                        }, function () {
                            // on mouseleave
                            $(element).tooltip('hide');
                        });
                    }
                };
            });

    })();


})();