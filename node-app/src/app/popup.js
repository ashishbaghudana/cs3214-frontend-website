// According to
// http://www.popuptest.com/goodpopups.html
// https://stackoverflow.com/questions/3252504/launching-a-legitimate-pop-up-window-on-user-click
// popups will only open with onclick handlers.
//
// we can't put a URL from a config on an onclick handler with AngularJS {{}} interpolation, 
// however - AngularJS is afraid of XSS.
//

import config from '../config/config';

export const _OpenCasWindow = function (url,name,w,h,scroll)
{
    var LeftPosition = (screen.width)?(screen.width-w)/2:100;
    var TopPosition = (screen.height)?(screen.height-h)/2:100;

    var w = 900;
    var h = 700;
    var settings = `width=${w},height=${h},top=${TopPosition},left=${LeftPosition},scrollbars=yes,location=no,directories=no,status=yes,menubar=no,toolbar=yes,resizable=yes`;

    var casurl = config.auth.cas.serviceurl(config.auth.apiurl + '/validate');
    return window.open(casurl, "_casauth", settings);
};
