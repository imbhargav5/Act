$(document).ready(function () {

    $.skylo({
        inchSpeed: 25,
        initialBurst: 0,
        flat: true
    });

    var usersettings = persistenceAdapter.getUserSettings();
    var wds = usersettings.workdayStart;
    var wde = usersettings.workdayEnd;
    var intro = new Ractive({
        el: "#settings",
        template: "#tile-intro-template",
        data: {
            name: persistenceAdapter.getUserInfo().name,
            disableStep: false,
            focusModeUrls: persistenceAdapter.getFocusModeUrls().join("\n"),
            workdayStart: wds.hours + ":" + wds.mins,
            workdayEnd: wde.hours + ":" + wde.mins
        }
    });

    intro.on({
        'finish-intro': function (e) {
            $.skylo('start');
            var workdayStart = getTimeFromStr(intro.get('workdayStart'));
            var workdayEnd = getTimeFromStr(intro.get('workdayEnd'));
            var settings = {
                workdayStart: workdayStart,
                workdayEnd: workdayEnd
            };
            persistenceAdapter.storeUserSettings(settings);
            $.skylo('inch', 20);
            var urls = intro.get('focusModeUrls').split("\n");
            persistenceAdapter.saveFocusModeUrls(urls);
            var userInfo = {
                name: intro.get('name')
            };
            persistenceAdapter.storeUserInfo(userInfo);
            $.skylo('end');
        }
    });

    intro.observe('name', function (name) {
        if (name == undefined || name.trim() == "") {
            intro.set('nameCorrect', false);
            return;
        }
        intro.set('nameCorrect', true);
    });

    intro.observe('workdayStart', function (ds) {
        if (ds == undefined) {
            return;
        }
        intro.set('workdayStartCorrect', false);
        var timeO = getTimeFromStr(ds);
        if (timeO == undefined || timeO.length == 0) {
            return;
        }
        intro.set('workdayStartCorrect', true);
    });

    intro.observe('workdayEnd', function (ds) {
        if (ds == undefined) {
            return;
        }
        intro.set('workdayEndCorrect', false);
        var timeO = getTimeFromStr(ds);
        if (timeO == undefined || timeO.length == 0) {
            return;
        }
        intro.set('workdayEndCorrect', true);
    });
});