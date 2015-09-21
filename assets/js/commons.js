var showIntro = function() {
    $("#intro").show();
    $("#overview").hide();
    $("#focusmode").hide();
};

var showOverview = function() {
    $("#intro").hide();
    $("#overview").show();
    $("#focusmode").hide();
};

var showFocusMode = function() {
    $("#intro").hide();
    $("#overview").hide();
    $("#focusmode").show();
};

var hideAll = function() {
    $("#intro").hide();
    $("#overview").hide();
    $("#focusmode").hide();
};

function getTimeFromStr(ds) {
    ds = ds.trim();
    var timesplit = ds.split(":");
    if(timesplit.length != 2) {
        return;
    }

    var hours = timesplit[0];
    var mins = timesplit[1];

    if(hours == undefined || hours.trim() == "" || mins == undefined || mins.trim() == "") {
        return;
    }

    try {
        hours = parseInt(hours);
        mins = parseInt(mins);
        if(hours < 0 || hours > 23) {
            return;
        }
        if(mins < 0 || mins > 59) {
            return;
        }

        return {
            hours: hours,
            mins: mins
        }
    } catch(e) {
        return;
    }
}