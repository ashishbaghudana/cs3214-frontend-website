'use strict';

/*
 * Code related to Eric's trace analysis project.
 */
import angular from 'angular'
import config from "../../config/config";
import Viz from 'viz.js/viz-lite.js';


let transform_custom_to_dot = function (custom_string, extra_properties) {
    let result = extra_properties;
    let state = 1;
    let isChildFork = function(rest){
      return rest.trim() === "fork()=0";
    };
    let addEdge = function(u,v){
        if (!edges[u]){
            edges[u] = [];
        }
        edges[u].push(v);
    };
    let edges = {};
    custom_string = custom_string.split("\n");
    for (let line of custom_string) {
        if (line === "") {
            continue;
        }
        if (state === 1) {
            if (line.indexOf('States:') !== -1) {
                state = 2;
            }
            else {
                // an edge
                let components = line.split(" ");
                let edge = components[0] + "->" + components[1] + ';';
                addEdge(components[0], components[1]);
                result = result + edge;
            }
        }
        else {
            let [number, ...rest] = line.split(" ");
            rest = rest.join(" ");
            let node = "";
            if (rest.includes('Error:')) {
                node = number + " [label=\"" + rest + "\" color=\"red\"];";
            }
            else{
                node = number + " [label=\"" + rest + "\"];";
            }
            result = result + node;
            if (isChildFork(rest)){
                console.log('found it');
                let extra = "";
                let marked = {};
                let dfs = function(node){
                    if (marked[node]){
                        return;
                    }
                    marked[node] = true;
                    extra += node + " [fillcolor=\"grey\" style=\"filled,solid\"];";
                    if(edges[node]) {
                        for (let child of edges[node]) {
                            dfs(child);
                        }
                    }
                };
                dfs(number);
                result = result + extra;
            }
        }
    }
    return "digraph {" + result + "}"
};



const toOrdinal = function (i) {
    const n = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const s = ["zeroth", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
        "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth"];
    const p = ["twent", "thirt", "fourt", "fift", "sixt", "sevent", "eight", "ninet"];
    const c = ["hundred", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion"];
    const b = Math.floor(Math.log10(i));
    if (i < 20) return s[i]; // Special case for sub-20
    if (b === 1) { // Between 21 and 99
        if (i % 10 === 0) return p[Math.floor(i / 10) - 2] + "ieth"; // On the tens, return p+"ieth"
        return p[Math.floor(i / 10) - 2] + "y-" + s[i % 10]; // Otherwise, return hyphenated
    }
    if (b === 2) { // Between 100 and 999
        const e = Math.floor(i / Math.pow(10, b)); // The first number
        return n[e - 1] + "-" + c[0] + " " + toOrdinal(i - (e * Math.pow(10, b)));
    }
    // Greater than 1000 we break into groups of 10^3 followed by a multiplier
    const m = b % 3 + 1; // Take the first m digits off
    const cm = Math.floor(b / 3);
    const x = Math.floor(i / Math.pow(10, b - m + 1));
    const numberToString = function (y) { // Converts a number less than 1000 to its string representation as a multiplier
        if (y < 20) return n[y - 1];
        if (y < 100) return p[Math.floor(y / 10) - 2] + "y-" + n[y % 10 - 1];
        return n[Math.floor(y / 100) - 1] + " " + c[0] + " " + numberToString(y - (Math.floor(y / 100) * 100));
    };
    return numberToString(x) + " " + c[cm] + " " + toOrdinal(i - (x * Math.pow(10, b - m + 1)));
};


export default (function () {
    return angular.module('autograder.traceanalysis')
        .controller('TraceAnalysisPageController',
            ['$scope', '$stateParams', '$resource', '$timeout', '$state',
                function ($scope, $stateParams, resource, timeout, $state) {
                    let user = $stateParams.user;
                    let target = $stateParams.target;
                    let uuid = $stateParams.uuid;
                    $scope.frontendConfig = config;
                    let base_lookup_url = config.judgeapiurl + '/getfile/' + user + '/' +
                        target + '/judge-files/' + uuid + '/';
                    $scope.toggle = function (item) {
                        item.snip = !item.snip;
                    };
                    $scope.showSnip = function (item) {
                        return item.snip;
                    };
                    $scope.pid = user;
                    let dynamicResults = resource(base_lookup_url + 'dynamic_analysis_results.json');
                    dynamicResults.query().$promise.then(function (entries) {
                        let mappedEntries = [];
                        for (let entry of entries) {
                            let test = entry.test;
                            let dir = entry.directory;
                            let result = entry.result;
                            let error = entry.errors;
                            let error_str = "";
                            let base = base_lookup_url + dir + '/';
                            let files = [];
                            for (let file of entry.files) {
                                files.push(base + file);
                            }
                            let dot_str_proms = {data: undefined};
                            if (error.file) {
                                let options = {
                                    no_json: {
                                        method: 'GET',
                                        transformResponse: function (data) {
                                            return {result: data};
                                        }
                                    }
                                };
                                let dot_str_prom = resource(base + error.file, {}, options).no_json().$promise
                                    .then(function (result) {
                                        let extra_str = "";
                                        switch (error.type) {
                                            case "Extra":
                                                extra_str = error.node_num + " [color=\"red\"];";
                                                break;
                                            case "Not present":
                                                extra_str = "ADDED [label=\"" + error.node_str +
                                                    "\"];ADDED [color=\"red\"];" + error.parent_test_node + "->ADDED;";

                                                break;
                                        }
                                        return transform_custom_to_dot(result.result, extra_str)
                                    });
                                dot_str_prom.then(function (dot_str) {
                                    dot_str_proms.data = btoa(Viz(dot_str));
                                })
                            }

                            switch (error.type) {
                                case "Extra":
                                    error_str = "Your shell calls " + error.node_str + " unnecessarily";
                                    break;
                                case "Not present":
                                    error_str = "You shell does not contain a " + error.node_str + " when it should";
                                    break;
                                case "MISC":
                                    error_str = error.message;
                                    break;
                            }
                            if (error.type !== "MISC" && error_str !== "") {
                                error_str += " (click to view trace graph containing error)";
                            }

                            let resultData = {data: ""};
                            let options = {
                                no_json: {
                                    method: 'GET',
                                    transformResponse: function (data) {
                                        return {result: data};
                                    }
                                }
                            };
                            resource(base + 'outputtest.txt', {}, options).no_json(function(result){
                               resultData.data = result.result;
                            });

                            let obj = {
                                'test': test,
                                'result': result,
                                'error': error_str,
                                'files': files,
                                'dir': dir,
                                'dot_str': dot_str_proms,
                                'output': resultData

                            };
                            mappedEntries.push(obj);
                        }
                        $scope.dynresult = mappedEntries;
                    });
                    $scope.viewFiles = function (result) {
                        let dir = result.dir;
                        let files = result.files;
                        $state.go('traceFiles', {uuid: uuid, user: user, target: target, files: files, dir: dir})
                    }
                }])
        .controller('TraceFilesController',
            ['$scope', '$stateParams', '$location', '$resou' +
            'rce',
                function (scope, $stateParams, location, resource) {
                    let user = $stateParams.user;
                    let target = $stateParams.target;
                    let uuid = $stateParams.uuid;
                    let files = $stateParams.files;
                    let dir = $stateParams.dir;
                    let base_lookup_url = config.judgeapiurl + '/getfile/' + user + '/' +
                        target + '/judge-files/' + uuid + '/' + dir + '/';

                    let options = {
                        no_json: {
                            method: 'GET',
                            transformResponse: function (data) {
                                return {result: data};
                            }
                        }
                    };
                    let first = true;
                    let child = 1;
                    let file_results = [];
                    for (let file of files) {
                        let dot_str_proms = {data: undefined};
                        let dot_str_prom = resource(file, {}, options).no_json().$promise
                            .then(function (result) {
                                let extra_str = "";
                                return transform_custom_to_dot(result.result, extra_str)
                            });
                        dot_str_prom.then(function (dot_str) {
                            dot_str_proms.data = btoa(Viz(dot_str));
                        });
                        let name= 'test..';
                        if (first){
                            name = "Parent (Shell Process)";
                            first = false;
                        }
                        else {
                            name = toOrdinal(child) + ' Child';
                            child += 1;
                        }
                        let obj = {'file': file, 'dot_str': dot_str_proms, 'name': name};
                        file_results.push(obj);
                    }
                    scope.files = file_results;
                    scope.pid = user;
                    scope.test = dir;
                }])



})();