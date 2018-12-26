'use strict';
import angular from "angular";
import config from "../../config/config";
import grouperAdminTemplate from './grouperadmin.html';
import _ from 'underscore';

( function () {
    angular.module('autograder')
        .controller('GrouperApp',
            ['$scope', '$resource', '$timeout', '$interval',
                function (scope, resource, $timeout, $interval) {
                    const identity = scope.identity;
                    const pid = identity.name;
                    let grouperAPIBase = config.judgeapiurl + "/cs3214/grouper";
                    const Grouper = resource(grouperAPIBase + "/show/_myself");
                    const ListPairs = resource(grouperAPIBase+"/listpairs");
                    const students = {};

                    const getNewServerState = function () {
                        scope.grouper = Grouper.get(function (g) {
                            scope.availableemails = _.map(_.pluck(g.available, "pid"), function (pid) {
                                return pid + "@vt.edu"
                            }).join(", ");
                        });
                        if (pid && identity.admin)
                            scope.allstudents = ListPairs.get(function (r) {
                                r.pairs.forEach(function (s) {
                                    students[s.pid] = s;
                                });
                            });
                        delete scope.unpairresp;
                        delete scope.pairresp;
                    };
                    scope.printName = function (pid) {
                        return students[pid] && students[pid].lastname + ", " + students[pid].firstname || "";
                    };

                    getNewServerState();

                    scope.unpairme = function () {
                        resource(grouperAPIBase + "/unpair/" + pid).save( { }, function (res) {
                            scope.unpairresp = res;
                            $timeout(getNewServerState, 1000);
                        });
                    };
                    scope.pairwith = function (peer) {
                        resource(grouperAPIBase + "/pairwith/" + pid).save(
                            { partner : peer },
                            function (resp) {
                                scope.pairresp = resp;
                                if (resp.status == 1)
                                    $timeout(getNewServerState, 1000);
                            });
                    }
                }])

})();