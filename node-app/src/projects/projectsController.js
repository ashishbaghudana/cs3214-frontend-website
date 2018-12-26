'use strict';
import angular from "angular";
import moment from 'moment';
import config from "../config/config";
import proj1Plugins from "./project1PluginList.html";
import project1SubmissionHtml from './project1SubmissionInstructions.html';
import p2Scoreboard from './project2Scoreboard.html';
import p3Scoreboard from './project3Scoreboard.html';
import p4Scoreboard from './project4Scoreboard.html';

( function () {
    const TableSorter = function () {
        // toggle sort direction
        this.toggle = function (sortby) {
            if (this.sortby == sortby) {
                if (sortby.charAt(0) == '-')
                    this.sortby = sortby.substring(1);
                else
                    this.sortby = '-' + sortby;
            } else {
                this.sortby = sortby;
            }
        }
    };
    let p2ScoreboardController = function ($scope, $resource) {
        const identity = $scope.identity;
        $scope.settings = new TableSorter();
        $scope.columns = [
            {
                label:  "UID",
                sortby: 'uid'
            },
            {
                label:  "Date",
                sortby: 'date'
            },
            {
                label:  "Basic",
                sortby: 'basic'
            },
            {
                label:  "MSL/5",
                title:  "Merge Sort/Large, 5 threads",
                sortby: 'mslarge5'
            },
            {
                label:  "MSL/10",
                title:  "Merge Sort/Large, 10 threads",
                sortby: 'mslarge10'
            },
            {
                label:  "MSL/20",
                title:  "Merge Sort/Large, 20 threads",
                sortby: 'mslarge20'
            },
            {
                label:  "QS/5",
                title:  "Quick Sort/Large, 5 threads",
                sortby: 'qslarge5'
            },
            {
                label:  "QS/10",
                title:  "Quick Sort/Large, 10 threads",
                sortby: 'qslarge10'
            },
            {
                label:  "QS/20",
                title:  "Quick Sort/Large, 20 threads",
                sortby: 'qslarge20'
            },
            {
                label:  "NQ/5",
                title:  "NQueens 13, 5 threads",
                sortby: 'nqueens5'
            },
            {
                label:  "NQ/10",
                title:  "NQueens 13, 10 threads",
                sortby: 'nqueens10'
            },
            {
                label:  "NQ/20",
                title:  "NQueens 13, 20 threads",
                sortby: 'nqueens20'
            },
            {
                label:  "MSL/5",
                title:  "CPU Consumption Merge Sort/Large, 5 threads",
                sortby: 'cpumslarge5'
            },
            {
                label:  "MSL/10",
                title:  "CPU Consumption Merge Sort/Large, 10 threads",
                sortby: 'cpumslarge10'
            },
            {
                label:  "MSL/20",
                title:  "CPU Consumption Merge Sort/Large, 20 threads",
                sortby: 'cpumslarge20'
            },
            {
                label:  "QS/5",
                title:  "CPU Consumption Quick Sort/Large, 5 threads",
                sortby: 'cpuqslarge5'
            },
            {
                label:  "QS/10",
                title:  "CPU Consumption Quick Sort/Large, 10 threads",
                sortby: 'cpuqslarge10'
            },
            {
                label:  "QS/20",
                title:  "CPU Consumption Quick Sort/Large, 20 threads",
                sortby: 'cpuqslarge20'
            },
            {
                label:  "NQ/5",
                title:  "CPU Consumption NQueens 13, 5 threads",
                sortby: 'cpunqueens5'
            },
            {
                label:  "NQ/10",
                title:  "CPU Consumption NQueens 13, 10 threads",
                sortby: 'cpunqueens10'
            },
            {
                label:  "NQ/20",
                title:  "CPU Consumption NQueens 13, 20 threads",
                sortby: 'cpunqueens20'
            },
            {
                label:  "Del",
                title: "Delete this submission",
                sortby: ''
            },
        ];
        $scope.remove = function (row) {
            $resource(config.judgeapiurl + "/cs3214/projects/p2/remove").save(row.info, function (data) {
                if (data.status === 1) {
                    const idx = $scope.results.data.indexOf(row);
                    $scope.results.data.splice(idx, 1);
                } else {
                    alert("Failed to remove file: " + data.msg);
                }
            });
        };
        $scope.user = {cookie: undefined};
        $scope.loading = true;
        $scope.results = $resource(config.judgeapiurl + "/cs3214/projects/p2/getstats").get(function (results) {
            $scope.loading = false;
            let data = results.data;
            
            $scope.user['cookie'] = results.cookie;
            for (let i = 0; i < data.length; i++) {
                let row = data[i];
                row.date = new Date(row.info.date);
                row.uid = row.info.uid;

                const basic = [];
                for (let test in {basic1:1, basic2:1, basic3:1, basic4:1}) {
                    if (!(test in row)) continue;
                    for (const run in row[test]) {
                        const threads = row[test][run];
                        for (let j = 0; j < threads.length; j++) {
                            const r = threads[j];
                            if ('realtime' in r)
                                basic.push("success");
                            else if ('error' in r)
                                basic.push("fail");
                            else
                                basic.push("unknown");
                        }
                    }
                }
                row.basic = basic;

                let collecttime = function (key1, key2, func) {
                    try {
                        let threads = row[key1][key2];
                        for (let j = 0; j < threads.length; j++) {
                            func(threads[j]);
                        }
                    } catch (er) {
                        // console.dir(er);
                    }
                };

                let collectrealtime = function (key1, key2, prefix) {
                    collecttime(key1, key2, function (r) {
                        if ('realtime' in r)
                            row[prefix + r.nthreads] = r.realtime;
                    });
                };

                let collectusertime = function (key1, key2, prefix) {
                    collecttime(key1, key2, function (r) {
                        if ('ru_stime' in r)
                            row[prefix + r.nthreads] = r.ru_stime + r.ru_utime;
                    });
                };

                collectrealtime('mergesort', 'mergesort large', 'mslarge');
                collectrealtime('quicksort', 'quicksort large', 'qslarge');
                collectrealtime('nqueens', 'nqueens 13', 'nqueens');

                collectusertime('mergesort', 'mergesort large', 'cpumslarge');
                collectusertime('quicksort', 'quicksort large', 'cpuqslarge');
                collectusertime('nqueens', 'nqueens 13', 'cpunqueens');
            }
        });
    };
    let p3ScoreboardController = function($scope, $resource){
        $scope.settings = new TableSorter();
        $scope.columns = [
            {
                label:  "UID",
                sortby: 'uid'
            },
            {
                label:  "Date",
                sortby: 'date'
            },
            {
                label:  "Perf",
                title:  "Performance Index",
                sortby: '-perfindex.perfindex'
            },
            {
                label:  "Avg",
                title:  "average utilization",
                sortby: '-avg.util'
            },
            {
                label:  "AM",
                title:  "amptjp-bal.rep utilization",
                sortby: '-amptjp.util'
            },
            {
                label:  "CC",
                title:  "cccp-bal.rep utilization",
                sortby: '-cccp.util'
            },
            {
                label:  "CP",
                title:  "cp-decl-bal.rep utilization",
                sortby: '-cpdecl.util'
            },
            {
                label:  "EX",
                title:  "expr-bal.rep utilization",
                sortby: '-expr.util'
            },
            {
                label:  "CO",
                title:  "coalescing-bal.rep utilization",
                sortby: '-coalescing.util'
            },
            {
                label:  "RN",
                title:  "random-bal.rep utilization",
                sortby: '-random.util'
            },
            {
                label:  "RN2",
                title:  "random2-bal.rep utilization",
                sortby: '-random2.util'
            },
            {
                label:  "BI",
                title:  "binary-bal.rep utilization",
                sortby: '-binary.util'
            },
            {
                label:  "BI2",
                title:  "binary2-bal.rep utilization",
                sortby: '-binary2.util'
            },
            {
                label:  "RA",
                title:  "realloc-bal.rep utilization",
                sortby: '-realloc.util'
            },
            {
                label:  "RA2",
                title:  "realloc2-bal.rep utilization",
                sortby: '-realloc2.util'
            },
            {
                label:  "Avg",
                title:  "average throughput",
                sortby: '-avg.Mops'
            },
            {
                label:  "AM",
                title:  "amptjp-bal.rep throughput",
                sortby: '-amptjp.Mops'
            },
            {
                label:  "CC",
                title:  "cccp-bal.rep throughput",
                sortby: '-cccp.Mops'
            },
            {
                label:  "CP",
                title:  "cp-decl-bal.rep throughput",
                sortby: '-cpdecl.Mops'
            },
            {
                label:  "EX",
                title:  "expr-bal.rep throughput",
                sortby: '-expr.Mops'
            },
            {
                label:  "CO",
                title:  "coalescing-bal.rep throughput",
                sortby: '-coalescing.Mops'
            },
            {
                label:  "RN",
                title:  "random-bal.rep throughput",
                sortby: '-random.Mops'
            },
            {
                label:  "RN2",
                title:  "random2-bal.rep throughput",
                sortby: '-random2.Mops'
            },
            {
                label:  "BI",
                title:  "binary-bal.rep throughput",
                sortby: '-binary.Mops'
            },
            {
                label:  "BI2",
                title:  "binary2-bal.rep throughput",
                sortby: '-binary2.Mops'
            },
            {
                label:  "RA",
                title:  "realloc-bal.rep throughput",
                sortby: '-realloc.Mops'
            },
            {
                label:  "RA2",
                title:  "realloc2-bal.rep throughput",
                sortby: '-realloc2.Mops'
            },
            {
                label:  "Del",
                title: "Delete this submission",
                sortby: ''
            },
        ];
        // FIXME code clone
        $scope.remove = function (row) {
            $resource(config.judgeapiurl + "/cs3214/projects/p3/remove").save(row.info, function (data) {
                if (data.status === 1) {
                    let idx = $scope.results.data.indexOf(row);
                    $scope.results.data.splice(idx, 1);
                } else {
                    alert("Failed to remove file: " + data.msg);
                }
            });
        };
        $scope.user = {cookie: undefined};
        $scope.loading = true;
        $scope.results = $resource(config.judgeapiurl + "/cs3214/projects/p3/getstats").get(function (results) {
            $scope.loading = false;
            let data = results.data;
            $scope.user['cookie'] = results.cookie;
            for (let i = 0; i < data.length; i++) {
                let row = data[i];
                row.date = new Date(row.info.date);
                row.uid = row.info.uid;

                let secs = 0, ops = 0, util = 0;
                let n = 0;
                for (let j = 0; j < row.results.length; j++) {
                    let rr = row.results[j];
                    if (rr.valid) {
                        n++;
                        let pname = rr.trace.replace("-bal.rep", "")
                            .replace("-", "");
                        row[pname] = rr;
                        secs += rr.secs;
                        util += rr.util;
                        ops += rr.ops;
                        // rr.Mops is of type Number, so why is AngularJS sorting alphabetically?
                        rr.Mops = rr.Kops/1000.0;
                    }
                }
                row.avg = {
                    util : util/n,
                    Mops : (ops/1e6)/secs
                };
            }
        });
    };
let p4ScoreboardController = function ($scope, $resource, $timeout) {
        let scope = $scope;
        let resource = $resource;
        var needLabels = [];
        scope.settings = new TableSorter();
        scope.user = {cookie: undefined};
        scope.columns = [
            {
                label:  "UID",
                sortby: 'uid'
            },
            {
                label:  "Date",
                sortby: 'date'
            }].concat(
                makeOne("login40"),
                makeOne("login500"),
                makeOne("login10k"),
                makeOne("wwwcsvt100"),
                makeOne("doom100"),
            [{
                label:  "Del",
                title: "Delete this submission",
                sortby: ''
            }]);

        function makeOne(key) {
            needLabels.push(key);
            return [
            {
                label:  "kReq/s",
                title:  "Requests/Second in 1000s",
                sortby: '-' + key + '.reqpers'
            },
            {
                label:  "MB/s",
                title:  "Thruput in MBytes/Second",
                sortby: '-' + key + '.thruput'
            },
            {
                label:  "Errors",
                title:  "# of errors",
                sortby: '-' + key + '.errors'
            },
            {
                label:  "Lat50",
                title:  "Mean latency in microsecond (us)",
                sortby: '-' + key + '.meanlat'
            }];
        }

        // FIXME code clone
        scope.remove = function (row) {
            resource(config.judgeapiurl + "/cs3214/projects/p4/remove").save(row.info, function (data) {
                if (data.status == 1) {
                    var idx = scope.results.data.indexOf(row);
                    scope.results.data.splice(idx, 1);
                } else {
                    alert("Failed to remove file: " + data.msg);
                }
            });
        }
        scope.loading = true;
        scope.results = resource(config.judgeapiurl + "/cs3214/projects/p4/getstats").get(function (results) {
            scope.loading = false;
            var data = results.data; 
            scope.user['cookie'] = results.cookie;
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                row.date = new Date(row.info.date);
                row.uid = row.info.uid;
                for (var tlabel in row) {
                    var test = row[tlabel];
                    if (test.summary) {
                        // in kilo requests
                        test.reqpers = 1e3*test.summary.requests/test.summary.duration;
                        // in MBytes/sec
                        test.thruput = 1e6*test.summary.bytes/test.summary.duration/1024/1024;
                        var e = test.summary.errors;
                        test.errors = e.connect + e.read + e.status + e.timeout + e.write;
                        // in micro-seconds us
                        test.meanlat = test.latency.percentiles[50];
                        // in milli-seconds ms
                        test.meanlatms = Number(test.latency.percentiles[50])/1000.0;
                    }
                }
                for (var j = 0; j < needLabels.length; j++) {
                    var label = needLabels[j];
                    if (!(label in row)) {
                        row[label] = {
                            reqpers : 0,
                            thruput : 0
                        }
                    }
                }
                // console.dir(row);
            }
        });
        };
        angular.module('autograder')
        .controller('ProjectsController',
            ['$scope', '$stateParams', '$location', '$resource','$state',
                function (scope, $stateParams, location, resource, state) {
                    scope.projects = (function () {
                      let projects = [];
                      for (let pid in config.projecttargets){
                          let project = config.projecttargets[pid];
                          if (!project.project) continue;
                          project['pid'] = pid;
                          project.duedate = new Date(project.duedate);
                          project.timeleft = moment(project.duedate).fromNow();
                          projects.push(project);
                      }
                      return projects;
                    })();
                }])
        .controller('StudentPluginController',
            ['$scope', '$resource',
            function (scope, resource) {
                scope.plugins =  resource(config.judgeapiurl + '/cs3214/projects/proj1plugins').get(function (data) {
                    if (data.status == 1) {
                        data.list.forEach(function (p) {
                            p.lastmtime = new Date(p.lastmtime);
                        });
                    }
                });
            }])
        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider.state('proj1plugins', {
                url: '/proj1pluginlist',
                templateUrl: proj1Plugins
            }).state('project1submission', {
                url: '/project1submission',
                templateUrl: project1SubmissionHtml
            }).state('p2scoreboard',{
                url: '/p2scoreboard',
                templateUrl: p2Scoreboard,
                controller: p2ScoreboardController,
                parent: 'authentication',
                needsAuth: true,
            }).state('p3scoreboard',{
                url: '/p3scoreboard',
                templateUrl: p3Scoreboard,
                controller: p3ScoreboardController,
                parent: 'authentication',
                needsAuth: true,
            }).state('p4scoreboard',{
                url: '/p4scoreboard',
                templateUrl: p4Scoreboard,
                controller: p4ScoreboardController,
                parent: 'authentication',
                needsAuth: true,
            })


        }])

})();

// add in willgrind for project 2
require('./willgrind/willgrind');
