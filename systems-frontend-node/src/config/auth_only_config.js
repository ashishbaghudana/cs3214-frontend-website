
import  grouperTemplate from '../app/grouper/grouper.html';
import userSubmissionTemplate from '../templates/usersubmissions.html';

let authOnlyConfig = {
    nav_targets: {
        topbar: [],
        dropdowns : [
            {
                label : "Auth Only",
                needauthentication: true,
                entries: [
                    { path: '/grouper', label: "Grouper App", templateUrl: grouperTemplate },
                    { state: 'usergradeoverview', label: "My Grades"},
                    {path: 'analysis', label: 'Analysis', templateUrl: ""},
                    {
                        path: "/submissions",
                        label: "Submissions",
                        needauthentication: true,
                        templateUrl: userSubmissionTemplate
                    }
                ]
            },
        ]
    },
};

export default authOnlyConfig;