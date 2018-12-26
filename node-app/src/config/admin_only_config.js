import grouperAdminTemplate from '../app/grouper/grouperadmin.html';

let adminOnlyConfig = {
    nav_targets: {
        topbar: [],
        dropdowns : [
            {
                label : "Admin",
                needauthentication: true,
                adminonly: true,
                entries: [
                    { path: '/grouperadmin', label: "Grouper App (Admin)", templateUrl: grouperAdminTemplate },
                    {label: 'Grades (Admin)', state: 'admingrades'},
                    {label: "Submissions (Admin)", state: 'adminsubmissions'}
                ]
            },
        ]
    },
};

export default adminOnlyConfig;