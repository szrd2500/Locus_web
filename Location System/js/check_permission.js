var token = "",
    account = "",
    userName = "",
    permission = 0,
    MinimumPermission = {
        index: 0,
        Member_Setting: 0,
        Timeline: 0,
        Map_Setting: 0,
        Anchor_Setting: 0,
        Alarm_Setting: 0,
        Report: 0,
        Reference: 2,
        Account_Management: 2
    };

/**
 * When web page loading.
 * First read the permission table from server
 * Second read the account_permission or get from cookie
 */

function checkTokenAlive(response) {
    if (token == "") {
        return false;
    } else if (!response) {
        return false;
    } else if (response.status == 1) {
        return true;
    } else {
        if (response.msg == "Without token access") {
            /*login overtime*/
            alert($.i18n.prop('i_loginTimeout'));
            setCookie("login_user", null); //將登入資訊清空
            location.reload();
        } else if (response.msg == "Account is not exist") {
            /*other user use the account login successfully*/
            alert($.i18n.prop('i_loginRepeat'));
            setCookie("login_user", null); //將登入資訊清空
            location.reload();
        }
        return false;
    }
}

function loadUserData() {
    var cookie = getCookie("login_user");
    var user_info = typeof (cookie) === 'undefined' ? null : JSON.parse(cookie);
    if (user_info) {
        /*有登入狀態，顯示使用者名稱和登出按鈕*/
        token = user_info.api_token || "";
        userName = user_info.cname || "";
        permission = (user_info.userType || 0) + 0; /*沒有設定權限等同訪客帳號，加0可以強制string轉number*/
        document.getElementById("login_user").innerHTML = "<span class=\"i18n\" name=\"i_welcome\">" +
            $.i18n.prop('i_welcome') + "</span><div class=\"dropdown\"><label id=\"user_btn\" class=\"btn-user\">" +
            user_info.cname + " <span class=\"caret\" style=\"color:white;\"></span></label>" +
            "<div class=\"dropdown-content\">" +
            (user_info.userType == "2" ? "<a href=\"../Account_Management.html\"" + /*如果有管理員權限則顯示管理頁面連結*/
                " class=\"i18n\" name=\"account_managementPage\">" + $.i18n.prop('account_managementPage') + "</a>" : "") +
            "<a href=\"javascript: resetLogin();\" class=\"i18n\" name=\"i_logout\">" + $.i18n.prop('i_logout') +
            "</a></div></div>";
    } else {
        /*無登入狀態(等同訪客)，顯示登入按鈕*/
        token = "";
        userName = "";
        permission = 0;
        document.getElementById("login_user").innerHTML = "<a href=\"../Login.html\" style=\"margin:0px 20px 0px 5px;\">" +
            "<span class=\"i18n\" name=\"i_login\">" + $.i18n.prop('i_login') + "</span></a>";
    }
}


function resetLogin() {
    var json_request = JSON.stringify({
        "Command_Name": ["logout"],
        "Value": [{
            "api_token": token
        }]
    });
    var jxh = createJsonXmlHttp("user");
    jxh.onreadystatechange = function () {
        if (jxh.readyState == 4 || jxh.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (revObj && revObj.Value[0].success > 0) {
                alert($.i18n.prop('i_logoutSuccess'));
            }
            token = "";
            setCookie("login_user", null);
            location.reload();
        }
    };
    jxh.send(json_request);
}

function checkPermissionOfPage(parent_page) {
    var pass = false;
    //沒有設定權限等同訪客帳號
    if (parent_page in MinimumPermission) {
        pass = permission >= MinimumPermission[parent_page] ? true : false;
    } else {
        pass = false;
        alert("Error! Please call the administrator for help.");
    }
    if (!pass) {
        switch (parent_page) {
            case "Account_Management":
            case "index":
                alert("Permission denied!");
                history.back();
                break;
            case "Member_Setting":
            case "Anchor_Setting":
            case "Timeline":
            case "Map_Setting":
            case "Alarm_Setting":
            case "Report":
            case "Reference":
                alert("Permission denied!");
                window.location.href = '../index.html';
                break;
            default:
                alert("Permission denied!");
                history.back();
                break;
        }
    }
}

function setNavBar(parent_page, child_page) {
    $(function () {
        var get = {
                FirstFloor: function () { //設定第一層導航欄(第一條白線以上)
                    var html = "",
                        title = "";
                    for (var page_name in MinimumPermission) {
                        if (permission >= MinimumPermission[page_name]) {
                            switch (page_name) {
                                case "index":
                                    title = $.i18n.prop('homePage');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../index.html\"") +
                                        " title=\"" + title + "\"><i class=\"fas fa-satellite-dish\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                case "Member_Setting":
                                    title = $.i18n.prop('member_settingPage');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../Member_Setting.html\"") +
                                        " title=\"" + title + "\"><i class=\"fas fa-user-cog\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                case "Timeline":
                                    title = $.i18n.prop('timelinePage');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../Timeline.html\"") +
                                        " title=\"" + title + "\"><i class=\"fas fa-route\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                case "Map_Setting":
                                    title = $.i18n.prop('map_settingPage');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../Map_Setting.html\"") +
                                        " title=\"" + title + "\"><i class=\"fas fa-map\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                case "Anchor_Setting":
                                    title = $.i18n.prop('anchor_settingPage');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../Anchor_Setting.html\"") +
                                        " title=\"" + title + "\"><i class=\"fas fa-anchor\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                case "Alarm_Setting":
                                    title = $.i18n.prop('alarm_settingPage');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../Alarm_Setting.html\"") +
                                        " title=\"" + title + "\"><i class=\"fas fa-bell\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                case "Report":
                                    title = $.i18n.prop('report');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../Report.html\"") +
                                        " title=\"" + title + "\"><i class=\"far fa-file-alt\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                case "Reference":
                                    title = $.i18n.prop('advance_settingPage');
                                    html += (page_name == parent_page ?
                                            "<li class=\"active\"><a href=\"#\"" : "<li><a href=\"../Reference.html\"") +
                                        " title=\"" + title + "\"><i class=\"fas fa-cogs\"></i>" +
                                        "<span>" + title + "</span></a></li>";
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                    return html;
                },
                SecondFloor: function () { //設定第二層導航欄(第二條白線以上)
                    var getChildren = { //KEY => parent_page
                        "index": function () {
                            return "<hr><li class=\"alarmlist\">" +
                                "<a href=\"javascript: alarmSidebarMove();\" title=\"" + $.i18n.prop('i_alarmList') + "\">" +
                                "<i class=\"fas fa-exclamation-circle\" id=\"alarmSideBar_icon\"></i>" +
                                "<span>" + $.i18n.prop('i_alarmList') + "</span></a></li>" +
                                "<li class=\"taglist\">" +
                                "<a href=\"javascript: tagSidebarMove();\" title=\"" + $.i18n.prop('i_tagList') + "\">" +
                                "<i class=\"fas fa-map-marker-alt\"></i>" +
                                "<span>" + $.i18n.prop('i_tagList') + "</span></a></li>";
                        },
                        "Member_Setting": function () {
                            var title = "",
                                html = "<hr>",
                                children_pages = ["Member_Setting", "Dept_Setting", "Job_Title_Setting", "User_Type_Setting", "Preview_Color_Setting"];
                            children_pages.forEach(function (page_name) {
                                switch (page_name) {
                                    case "Member_Setting":
                                        title = $.i18n.prop('i_memberSetting');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../Member_Setting.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-users\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    case "Dept_Setting":
                                        title = $.i18n.prop('i_deptSetting');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../Dept_Setting.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-sitemap\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    case "Job_Title_Setting":
                                        title = $.i18n.prop('i_titleSetting');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../Job_Title_Setting.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-id-card\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    case "User_Type_Setting":
                                        title = $.i18n.prop('i_usertypeSetting');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../User_Type_Setting.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-user-tag\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    case "Preview_Color_Setting":
                                        title = $.i18n.prop('i_previewColorSetting');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../Preview_Color_Setting.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-map-marker-alt\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    default:
                                        break;
                                }
                            });
                            return html;
                        },
                        "Reference": function () {
                            var title = "",
                                html = "<hr>",
                                children_pages = ["Reference", "Advance_cmd", "Update", "DB_Backup"];
                            children_pages.forEach(function (page_name) {
                                switch (page_name) {
                                    case "Reference":
                                        title = $.i18n.prop('i_reference');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../Reference.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-satellite-dish\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    case "Advance_cmd":
                                        title = $.i18n.prop('i_advance_cmd');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../Advance_cmd.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-code\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    case "Update":
                                        title = $.i18n.prop('i_update');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../Update.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-download\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    case "DB_Backup":
                                        title = $.i18n.prop('i_dbBackup');
                                        html += "<li class=\"setting-type" +
                                            (page_name == child_page ? " active\"><a href=\"#\"" : "\"><a href=\"../DB_Backup.html\"") +
                                            " title=\"" + title + "\"><i class=\"fas fa-database\"></i><span>" + title + "</span></a></li>";
                                        break;
                                    default:
                                        break;
                                }
                            });
                            title = $.i18n.prop('i_startPositioning');
                            return html + "<li class=\"start\">" +
                                "<a href=\"javascript: StartClick();\" id=\"btn_start\" title=\"" + title + "\">" +
                                "<i class=\"fas fa-play\"></i><span>" + title + "</span></a></li>";
                        }
                    };
                    return getChildren[parent_page] ? getChildren[parent_page]() : "";
                }
            },
            lock_stste = getCookie('lock_state') || "unlocked"; //取得儲存cookie的導航欄鎖定狀態

        $("#icon_navbar").html("<aside class=\"menu\"><div class=\"menu-left" + (lock_stste == "locked" ? " locked" : "") + "\">" +
            "<nav class=\"sidebar\"><ul class=\"nav\">" + get.FirstFloor() + get.SecondFloor() +
            "<hr><li class=\"lock\"><a href=\"javascript: lockLeftMemu();\" title=\"" + (lock_stste == "unlocked" ?
                $.i18n.prop('i_lock') + "\"><i class=\"fas fa-lock-open\"></i><span>" + $.i18n.prop('i_lock') + "</span>" :
                $.i18n.prop('i_unlock') + "\"><i class=\"fas fa-lock\"></i><span>" + $.i18n.prop('i_unlock') + "</span>") +
            "</a></li></ul></nav></div></aside>");
    });
}

function lockLeftMemu() { //控制展開/收合導航欄
    var menu_left = document.getElementsByClassName("menu-left")[0];
    var lock = document.querySelector("li.lock a");
    if (menu_left.classList.contains("locked")) { //判斷現在導航欄是否為鎖定狀態
        menu_left.classList.remove("locked"); //解除鎖定狀態
        lock.title = $.i18n.prop('i_lock');
        lock.innerHTML = "<i class=\"fas fa-lock-open\"></i><span>" + $.i18n.prop('i_lock') + "</span>";
        setCookie('lock_state', "unlocked");
    } else {
        menu_left.classList.add("locked"); //啟動鎖定狀態
        lock.title = $.i18n.prop('i_unlock');
        lock.innerHTML = "<i class=\"fas fa-lock\"></i><span>" + $.i18n.prop('i_unlock') + "</span>"
        setCookie('lock_state', "locked");
    }
}