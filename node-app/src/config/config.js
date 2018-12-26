// Frontend Specific Configuration

import projectConfig from './project_config';
import exerciseConfig from './exercise_config';
import authOnlyConfig from './auth_only_config';
import adminOnlyConfig from './admin_only_config';
import staffTemplate from '../templates/staff.html';
import lectureTemplate from '../templates/lectures.html';
import documentsTemplate from '../templates/documents.html';
import policiesTemplate from  '../templates/policies.html';
import generalFaqTemplate from '../templates/generalfaq.html';
import submissionFaq from '../templates/submissionfaq.html';


// This is the path to the semester specific configuration
import semester_based_config from "/home/courses/cs3214/admin/submissions/configurationFiles/spring2018.json";

// This is a default configuration to be used if semester_based_config does not have those values
let frontent_config = {
    // this the base url for the autograder-queue api.
    judgeapiurl: "https://courses.cs.vt.edu/cs3214/autograder_api/spring2018",
    auth: {

        apiurl: "https://courses.cs.vt.edu/cs3214/autograder_api/spring2018",
        /* multiple authentication options may be enabled. */
        password: {
        },
        cas: {
            serviceurl: (url) => `https://login.vt.edu/profile/cas/login?service=${encodeURIComponent(url)}`,
        }
    },
    fullname: "CS3214 Computer Systems",
    shortname: "CS3214",

    exercisepath: "exercises/",
    lecturepath: "lectures/",

    nav_targets: {
        topbar: [
            {path: "/", label: "Home"}
        ].concat(exerciseConfig.nav_targets.topbar)
            .concat(projectConfig.nav_targets.topbar)
            .concat(authOnlyConfig.nav_targets.topbar)
            .concat(adminOnlyConfig.nav_targets.topbar),


        dropdowns: [].concat(exerciseConfig.nav_targets.dropdowns)
            .concat(projectConfig.nav_targets.dropdowns).concat([
                {
                    label: "More Info",
                    entries: [
                        {path: '/staff', label: "Staff", templateUrl: staffTemplate},
                        {path: '/lectures', label: "Lectures", templateUrl: lectureTemplate},
                        {path: '/documents', label: "Documents", templateUrl: documentsTemplate},
                        {path: '/policies', label: "Policies", templateUrl: policiesTemplate},
                        {path: '/faq', label: "General FAQ", templateUrl: generalFaqTemplate},
                        {path: '/subhelp', label: "Submission FAQ", templateUrl: submissionFaq},
                    ]
                },
            ]).concat(authOnlyConfig.nav_targets.dropdowns).concat(adminOnlyConfig.nav_targets.dropdowns)


    },
};
let config = Object.assign(frontent_config, semester_based_config);
export default config;
