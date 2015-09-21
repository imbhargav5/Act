var persistenceAdapter = {
    _storage: localStorage,

    _getItem: function (key) {
        return this._storage.getItem(key);
    },

    _setItem: function (key, value) {
        this._storage.setItem(key, value);
    },

    _removeItem: function (key) {
        this._storage.removeItem(key);
    },

    getMonthlyGoals: function () {
        var goals = this._getItem(MONTHLY_GOALS);
        if (goals == undefined) {
            goals = "[]";
        }
        return JSON.parse(goals);
    },

    storeMonthlyGoals: function (goals) {
        this._setItem(MONTHLY_GOALS, JSON.stringify(goals));
    },

    getWeeklyGoals: function () {
        var goals = this._getItem(WEEKLY_GOALS);
        if (goals == undefined) {
            goals = "[]";
        }
        return JSON.parse(goals);
    },

    storeWeeklyGoals: function (goals) {
        this._setItem(WEEKLY_GOALS, JSON.stringify(goals));
    },

    getDailyGoals: function () {
        var goals = this._getItem(DAILY_GOALS);
        if (goals == undefined) {
            goals = "[]";
        }
        return JSON.parse(goals);
    },

    storeDailyGoals: function (goals) {
        this._setItem(DAILY_GOALS, JSON.stringify(goals));
    },

    markIntroAsDone: function () {
        this._setItem(IS_INTRO_DONE, JSON.stringify(true));
    },

    isIntroDone: function () {
        var introDone = this._getItem(IS_INTRO_DONE);
        if (introDone == undefined || (introDone.trim().toLocaleLowerCase() != "true" && introDone.trim().toLocaleLowerCase() != "false")) {
            return false;
        }
        return JSON.parse(introDone);
    },

    storeUserSettings : function(settings) {
        this._setItem(USER_SETTINGS, JSON.stringify(settings));
    },

    getUserSettings : function() {
        var settings = this._getItem(USER_SETTINGS);
        if (settings == undefined) {
            settings = "[]";
        }
        return JSON.parse(settings);
    },

    isFocusModeOn : function() {
        var focusMode = this._getItem(IS_FOCUS_MODE_ON);
        if(focusMode == undefined || focusMode.trim() == "") {
            return false;
        }
        return JSON.parse(focusMode);
    },

    enterFocusMode: function() {
        this._setItem(IS_FOCUS_MODE_ON, JSON.stringify(true));
    },

    exitFocusMode: function() {
        this._removeItem(IS_FOCUS_MODE_ON);
    },

    getFocusModeUrls : function() {
        var focusModeUrls = this._getItem(FOCUS_MODE_URLS);
        if(focusModeUrls == undefined || focusModeUrls.trim() == ""){
            return [];
        }
        return JSON.parse(focusModeUrls);
    },

    saveFocusModeUrls : function(focusModeUrls) {
        this._setItem(FOCUS_MODE_URLS, JSON.stringify(focusModeUrls));
    },

    getUserInfo : function() {
        var userInfo = this._getItem(USER_INFO);
        if(userInfo == undefined || userInfo.trim() == ""){
            return {};
        }

        return JSON.parse(userInfo);
    },
    storeUserInfo: function(userInfo) {
        this._setItem(USER_INFO, JSON.stringify(userInfo));
    }
};