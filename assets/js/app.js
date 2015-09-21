$(document).ready(function () {
    Ractive.DEBUG = false;
    $.skylo({
        inchSpeed: 200,
        initialBurst: 0,
        flat: true
    });

    hideAll();
    $.skylo('start');

    var stepInfo = [
        {
            "title": "Hello, What is your name ?",
            "partial": "intro-name"
        },
        {
            "title": "Need more information to optimize your experience",
            "partial": "intro-settings"
        },
        {
            "title": "all done",
            "partial": ""
        }
    ];

    var intro = new Ractive({
        el: "#intro",
        template: "#tile-intro-template",
        data: {
            totalSteps: 2,
            currentStep: 0,
            stepInfo: stepInfo,
            name: "",
            disableStep: true,
            disableFinish: true,
            focusModeUrls: "reddit.com\nfacebook.com\nfb.com\nmail.google.com\ntwitter.com"
        }
    });

    intro.on({
        nextStep: function (event) {
            var cStep = intro.get('currentStep');
            var totalSteps = intro.get('totalSteps');
            if (cStep >= totalSteps) {
                return;
            }
            intro.set('currentStep', cStep + 1);
            $.skylo('set', ((cStep + 1) / totalSteps) * 100);
            if (cStep == totalSteps - 1) {
                //do some animation here
                $.skylo('end');
                persistenceAdapter.markIntroAsDone();
                showOverview();
                $.skylo('set', 0);
                $.skylo('start');
            }
        },
        'finish-intro': function (e) {
            //animate and mark done
            $.skylo('end');
            persistenceAdapter.markIntroAsDone();

            var workdayStart = getTimeFromStr(intro.get('workdayStart'));
            var workdayEnd = getTimeFromStr(intro.get('workdayEnd'));
            var settings = {
                workdayStart : workdayStart,
                workdayEnd: workdayEnd
            };
            persistenceAdapter.storeUserSettings(settings);
            var urls = intro.get('focusModeUrls').split("\n");
            persistenceAdapter.saveFocusModeUrls(urls);
            var userInfo = {
                name: intro.get('name')
            };
            persistenceAdapter.storeUserInfo(userInfo);
            updateStats();
            updateTime();
            showOverview();
        },
        'prevStep': function (event) {
            var cStep = intro.get('currentStep');
            var totalSteps = intro.get('totalSteps');
            if (cStep == 0) {
                return;
            }
            intro.set('currentStep', cStep - 1);
            $.skylo('set', ((cStep - 1) / totalSteps) * 100);
        }
    });

    intro.observe('name', function (name) {
        if (name == undefined || name.trim() == "") {
            intro.set('disableStep', true);
            return;
        }
        intro.set('disableStep', false);
    });

    intro.observe('workdayStart', function (ds) {
        if(ds == undefined) {
            return;
        }
        intro.set('workdayStartCorrect', false);
        var timeO = getTimeFromStr(ds);
        if(timeO == undefined || timeO.length == 0) {
            return;
        }
        intro.set('workdayStartCorrect', true);
    });

    intro.observe('workdayEnd', function (ds) {
        if(ds == undefined) {
            return;
        }
        intro.set('workdayEndCorrect', false);
        var timeO = getTimeFromStr(ds);
        if(timeO == undefined || timeO.length == 0) {
            return;
        }
        intro.set('workdayEndCorrect', true);
    });

    var filters = {
        completed: function (item) {
            return item.completed;
        },
        active: function (item) {
            return !item.completed;
        }
    };

    // The keycode for the 'enter' and 'escape' keys
    var ENTER_KEY = 13;
    var ESCAPE_KEY = 27;

    var dailyList = new Ractive({
        el: '#daily',
        template: '#list',

        data: {
            listName: "today",
            filter: function (item) {
                var currentFilter = this.get('currentFilter');

                if (currentFilter === 'all') {
                    return true;
                }

                return filters[currentFilter](item);
            },

            completedTasks: function () {
                return this.get('items').filter(filters.completed);
            },

            activeTasks: function () {
                return this.get('items').filter(filters.active);
            },
            currentFilter: 'all'
        },

        events: (function () {
            var makeCustomEvent = function (keyCode) {
                return function (node, fire) {
                    var keydownHandler = function (event) {
                        if (event.which === keyCode) {
                            fire({
                                node: node,
                                original: event
                            });
                        }
                    };

                    node.addEventListener('keydown', keydownHandler, false);

                    return {
                        teardown: function () {
                            node.removeEventListener('keydown', keydownHandler, false);
                        }
                    };
                };
            };

            return {
                enter: makeCustomEvent(ENTER_KEY),
                escape: makeCustomEvent(ESCAPE_KEY)
            };
        }())
    });

    dailyList.on({

        remove: function (event, index) {
            this.get('items').splice(index, 1);
        },

        newTodo: function (event) {
            var description = event.node.value.trim();

            if (!description) {
                return;
            }

            this.get('items').push({
                description: description,
                completed: false
            });
            event.node.value = '';
        },

        edit: function (event) {
            this.set(event.keypath + '.editing', true);
            this.nodes.edit.value = event.context.description;
        },

        submit: function (event) {
            var description = event.node.value.trim();

            if (!description) {
                this.get('items').splice(event.index.i, 1);
                return;
            }

            this.set(event.keypath + '.description', description);
            this.set(event.keypath + '.editing', false);
        },

        cancel: function (event) {
            this.set(event.keypath + '.editing', false);
        },

        clearCompleted: function () {
            var items = this.get('items');
            var i = items.length;

            while (i--) {
                if (items[i].completed) {
                    items.splice(i, 1);
                }
            }
        },

        toggleAll: function (event) {
            var i = this.get('items').length;
            var completed = event.node.checked;
            var changeHash = {};

            while (i--) {
                changeHash['items[' + i + '].completed'] = completed;
            }

            this.set(changeHash);
        }
    });

    var weeklyList = new Ractive({
        el: '#weekly',
        template: '#list',

        data: {
            listName: "this week",
            filter: function (item) {
                var currentFilter = this.get('currentFilter');

                if (currentFilter === 'all') {
                    return true;
                }

                return filters[currentFilter](item);
            },

            completedTasks: function () {
                return this.get('items').filter(filters.completed);
            },

            activeTasks: function () {
                return this.get('items').filter(filters.active);
            },
            currentFilter: 'all'
        },

        events: (function () {
            var makeCustomEvent = function (keyCode) {
                return function (node, fire) {
                    var keydownHandler = function (event) {
                        if (event.which === keyCode) {
                            fire({
                                node: node,
                                original: event
                            });
                        }
                    };

                    node.addEventListener('keydown', keydownHandler, false);

                    return {
                        teardown: function () {
                            node.removeEventListener('keydown', keydownHandler, false);
                        }
                    };
                };
            };

            return {
                enter: makeCustomEvent(ENTER_KEY),
                escape: makeCustomEvent(ESCAPE_KEY)
            };
        }())
    });

    weeklyList.on({

        remove: function (event, index) {
            this.get('items').splice(index, 1);
        },

        newTodo: function (event) {
            var description = event.node.value.trim();

            if (!description) {
                return;
            }

            this.get('items').push({
                description: description,
                completed: false
            });
            event.node.value = '';
        },

        edit: function (event) {
            this.set(event.keypath + '.editing', true);
            this.nodes.edit.value = event.context.description;
        },

        submit: function (event) {
            var description = event.node.value.trim();

            if (!description) {
                this.get('items').splice(event.index.i, 1);
                return;
            }

            this.set(event.keypath + '.description', description);
            this.set(event.keypath + '.editing', false);
        },

        cancel: function (event) {
            this.set(event.keypath + '.editing', false);
        },

        clearCompleted: function () {
            var items = this.get('items');
            var i = items.length;

            while (i--) {
                if (items[i].completed) {
                    items.splice(i, 1);
                }
            }
        },

        toggleAll: function (event) {
            var i = this.get('items').length;
            var completed = event.node.checked;
            var changeHash = {};

            while (i--) {
                changeHash['items[' + i + '].completed'] = completed;
            }

            this.set(changeHash);
        }
    });

    var monthlyList = new Ractive({
        el: '#monthly',
        template: '#list',

        data: {
            listName: "this month",
            filter: function (item) {
                var currentFilter = this.get('currentFilter');

                if (currentFilter === 'all') {
                    return true;
                }

                return filters[currentFilter](item);
            },

            completedTasks: function () {
                return this.get('items').filter(filters.completed);
            },

            activeTasks: function () {
                return this.get('items').filter(filters.active);
            },
            currentFilter: 'all'
        },

        events: (function () {
            var makeCustomEvent = function (keyCode) {
                return function (node, fire) {
                    var keydownHandler = function (event) {
                        if (event.which === keyCode) {
                            fire({
                                node: node,
                                original: event
                            });
                        }
                    };

                    node.addEventListener('keydown', keydownHandler, false);

                    return {
                        teardown: function () {
                            node.removeEventListener('keydown', keydownHandler, false);
                        }
                    };
                };
            };

            return {
                enter: makeCustomEvent(ENTER_KEY),
                escape: makeCustomEvent(ESCAPE_KEY)
            };
        }())
    });

    monthlyList.on({

        remove: function (event, index) {
            this.get('items').splice(index, 1);
        },

        newTodo: function (event) {
            var description = event.node.value.trim();

            if (!description) {
                return;
            }

            this.get('items').push({
                description: description,
                completed: false
            });
            event.node.value = '';
        },

        edit: function (event) {
            this.set(event.keypath + '.editing', true);
            this.nodes.edit.value = event.context.description;
        },

        submit: function (event) {
            var description = event.node.value.trim();

            if (!description) {
                this.get('items').splice(event.index.i, 1);
                return;
            }

            this.set(event.keypath + '.description', description);
            this.set(event.keypath + '.editing', false);
        },

        cancel: function (event) {
            this.set(event.keypath + '.editing', false);
        },

        clearCompleted: function () {
            var items = this.get('items');
            var i = items.length;

            while (i--) {
                if (items[i].completed) {
                    items.splice(i, 1);
                }
            }
        },

        toggleAll: function (event) {
            var i = this.get('items').length;
            var completed = event.node.checked;
            var changeHash = {};

            while (i--) {
                changeHash['items[' + i + '].completed'] = completed;
            }

            this.set(changeHash);
        }
    });

    monthlyList.set('items', persistenceAdapter.getMonthlyGoals());
    weeklyList.set('items', persistenceAdapter.getWeeklyGoals());
    dailyList.set('items', persistenceAdapter.getDailyGoals());

    var removeEditingState = function (item) {
        return {
            description: item.description,
            completed: item.completed
        };
    };

    monthlyList.observe('items', function (items) {
        persistenceAdapter.storeMonthlyGoals(items.map(removeEditingState));
    });

    weeklyList.observe('items', function (items) {
        persistenceAdapter.storeWeeklyGoals(items.map(removeEditingState));
    });

    dailyList.observe('items', function (items) {
        persistenceAdapter.storeDailyGoals(items.map(removeEditingState));
        updateProgressBars()
    });

    function updateProgressBars() {
        $.skylo('start');
        var activeTasks = dailyList.get('items').filter(filters.active).length;
        var completedTasks = dailyList.get('items').filter(filters.completed).length;
        var dailyProgress = (completedTasks / (completedTasks + activeTasks)) * 100;
        $.skylo('set', dailyProgress);
        if(dailyProgress == 100){
            $.skylo('setState', 'success');
        } else {
            $.skylo('setState', '');
        }
    }

    if (!persistenceAdapter.isIntroDone()) {
        showIntro();
    } else {
        showOverview();
        updateProgressBars();
    }

    var stats = new Ractive({
        el: "#statsdiv",
        template: "#stats",
        data: {
            dayPercent: 0,
            weekPercent: 0,
            monthPercent: 0,
            currentDateTime: {
                hours: new Date().getHours(),
                mins: new Date().getMinutes(),
                date: new Date().toDateString()
            },
            formatTimeEntity : function (number) {
                return ("0" + number).slice(-2);
            }
        }
    });

    function getWorkingMinutes(startHours, startMins, endHours, endMins) {

        var startTotalMins = startHours * 60 + startMins;
        var endTotalMins = endHours * 60 + endMins;
        var workingMinutes = endTotalMins - startTotalMins;
        if (workingMinutes < 0) {
            workingMinutes = 24 * 60 - (-1 * workingMinutes);
        }
        return workingMinutes;
    }

    function onePercentOfWorkHour() {
        var settings = persistenceAdapter.getUserSettings();
        var wds = settings.workdayStart || {hours:0, mins:0};
        var wde = settings.workdayEnd || {hours:23, mins:59};
        var workingMinutes = getWorkingMinutes(wds.hours, wds.mins, wde.hours, wde.mins);
        return (workingMinutes * 60 * 1000)/(100);
    }

    function updateStats() {
        var settings = persistenceAdapter.getUserSettings();
        var now = new Date();
        var wds = settings.workdayStart || {hours:0, mins:0};
        var wde = settings.workdayEnd || {hours:23, mins:59};

        updateDay(now, wds, wde);
        updateWeek(now);
        updateMonth(now);
    }

    function updateWeek(now) {
        var today = now.getDay();
        var numDaysInWeek = 7;
        stats.set('weekPercent', ((today/numDaysInWeek)*100).toFixed(2));
    }

    function updateDay(now, wds, wde) {
        var hours = now.getHours();
        var mins = now.getMinutes();

        if(wde.hours == hours && wde.mins < mins) {
            stats.set('dayPercent', 100);
            return;
        }

        if(wds.hours == hours && wds.mins > mins) {
            stats.set('dayPercent', 0);
            return;
        }
        var totalWorkingMinutes = getWorkingMinutes(wds.hours,wds.mins, wde.hours, wde.mins);
        var workedUpMinutes;
        var currentMins = hours * 60 + mins;
        var wdsMins = wds.hours * 60 + wds.mins;
        if(wdsMins >= currentMins) {
            workedUpMinutes = 0
        } else {
            workedUpMinutes = currentMins - wdsMins;
        }
        stats.set('dayPercent', ((workedUpMinutes/totalWorkingMinutes)*100).toFixed(2));
    }

    function updateMonth(now) {
        var today = now.getDate();
        var daysInThisMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        stats.set('monthPercent', ((today/daysInThisMonth)*100).toFixed(2));
    }

    updateStats();
    setInterval(updateStats,onePercentOfWorkHour());

    function updateTime() {
        var now = new Date();
        var currentTime = {
            hours: now.getHours(),
            mins: now.getMinutes(),
            date: now.toDateString()
        };
        stats.set('currentDateTime', currentTime);
    }

    setInterval(updateTime, 2000); //okay up to 2 sec delay in time updates

    $("#settings-page-link").attr('href',chrome.extension.getURL("options.html"));
});