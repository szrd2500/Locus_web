function setNavBar(parent_page, child_page) {
    $(function () {
        var navbar = new Navbar();
        navbar.setFirstFloor(parent_page);
        navbar.setSecondFloor(parent_page, child_page);
        navbar.loadNavbar();
    });
}

function Navbar() {
    var lock_stste = getCookie('lock_state') || "unlocked";
    var navbarHtml = "<aside class=\"menu\"><div class=\"menu-left" + (lock_stste == "locked" ? " locked" : "") + "\">" +
        "<nav class=\"sidebar\"><ul class=\"nav\">";

    this.setFirstFloor = function (parent_page) {
        for (var page_name in MinimumPermission) {
            if (permission >= MinimumPermission[page_name]) {
                var selected_li = "<li class=\"active\"><a href=\"#\">";
                switch (page_name) {
                    case "index":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../index.html\">") +
                            "<i class=\"fas fa-satellite-dish\"></i>" +
                            "<span>" + $.i18n.prop('homePage') + "</span></a></li>";
                        break;
                    case "Member_Setting":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../Member_Setting.html\">") +
                            "<i class=\"fas fa-user-cog\"></i>" +
                            "<span>" + $.i18n.prop('member_settingPage') + "</span></a></li>";
                        break;
                    case "Timeline":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../Timeline.html\">") +
                            "<i class=\"fas fa-route\"></i>" +
                            "<span>" + $.i18n.prop('timelinePage') + "</span></a></li>";
                        break;
                    case "Map_Setting":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../Map_Setting.html\">") +
                            "<i class=\"fas fa-map\"></i>" +
                            "<span>" + $.i18n.prop('map_settingPage') + "</span></a></li>";
                        break;
                    case "Anchor_Setting":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../Anchor_Setting.html\">") +
                            "<i class=\"fas fa-anchor\"></i>" +
                            "<span>" + $.i18n.prop('anchor_settingPage') + "</span></a></li>";
                        break;
                    case "Alarm_Setting":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../Alarm_Setting.html\">") +
                            "<i class=\"fas fa-bell\" style=\"padding-left:2px;\"></i>" +
                            "<span>" + $.i18n.prop('alarm_settingPage') + "</span></a></li>";
                        break;
                    case "Report":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../Report.html\">") +
                            "<i class=\"far fa-file-alt\" style=\"padding-left:3px;\"></i>" +
                            "<span>" + $.i18n.prop('report') + "</span></a></li>";
                        break;
                    case "Reference":
                        navbarHtml += (page_name == parent_page ? selected_li : "<li><a href=\"../Reference.html\">") +
                            "<i class=\"fas fa-cogs\"></i>" +
                            "<span>" + $.i18n.prop('advance_settingPage') + "</span></a></li>";
                        break;
                    default:
                        break;
                }
            }
        }
    };
    this.setSecondFloor = function (parent_page, child_page) {
        var selected_li = "<li class=\"setting-type active\"><a href=\"#\">",
            setChildrenOfParent = {
                "index": function () {
                    navbarHtml += "<hr><li class=\"alarmlist\"><a href=\"javascript: alarmSidebarMove();\">" +
                        "<i class=\"fas fa-exclamation-circle\" id=\"alarmSideBar_icon\"></i>" +
                        "<span>" + $.i18n.prop('i_alarmList') + "</span></a></li>" +
                        "<li class=\"taglist\"><a href=\"javascript: tagSidebarMove();\">" +
                        "<i class=\"fas fa-map-marker-alt\" style=\"padding-left:2px;\"></i>" +
                        "<span>" + $.i18n.prop('i_tagList') + "</span></a></li>";
                },
                "Member_Setting": function () {
                    navbarHtml += "<hr>";
                    var ChildPageArray = ["Member_Setting", "Dept_Setting", "Job_Title_Setting", "User_Type_Setting", "Preview_Color_Setting"];
                    ChildPageArray.forEach(function (page_name) {
                        switch (page_name) {
                            case "Member_Setting":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../Member_Setting.html\">") +
                                    "<i class=\"fas fa-users\"></i><span>" + $.i18n.prop('i_memberSetting') + "</span></a></li>";
                                break;
                            case "Dept_Setting":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../Dept_Setting.html\">") +
                                    "<i class=\"fas fa-sitemap\"></i><span>" + $.i18n.prop('i_deptSetting') + "</span></a></li>";
                                break;
                            case "Job_Title_Setting":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../Job_Title_Setting.html\">") +
                                    "<i class=\"fas fa-id-card\"></i><span>" + $.i18n.prop('i_titleSetting') + "</span></a></li>";
                                break;
                            case "User_Type_Setting":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../User_Type_Setting.html\">") +
                                    "<i class=\"fas fa-user-tag\"></i><span>" + $.i18n.prop('i_usertypeSetting') + "</span></a></li>";
                                break;
                            case "Preview_Color_Setting":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../Preview_Color_Setting.html\">") +
                                    "<i class=\"fas fa-map-marker-alt\" style=\"padding-left:2px;\"></i>" +
                                    "<span>" + $.i18n.prop('i_previewColorSetting') + "</span></a></li>";
                                break;
                            default:
                                break;
                        }
                    });
                },
                "Reference": function () {
                    navbarHtml += "<hr>";
                    var ChildPageArray = ["Reference", "Advance_cmd", "Update", "DB_Backup"];
                    ChildPageArray.forEach(function (page_name) {
                        switch (page_name) {
                            case "Reference":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../Reference.html\">") +
                                    "<i class=\"fas fa-satellite-dish\"></i><span>" + $.i18n.prop('i_reference') + "</span></a></li>";
                                break;
                            case "Advance_cmd":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../Advance_cmd.html\">") +
                                    "<i class=\"fas fa-code\"></i><span>" + $.i18n.prop('i_advance_cmd') + "</span></a></li>";
                                break;
                            case "Update":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../Update.html\">") +
                                    "<i class=\"fas fa-download\"></i><span>" + $.i18n.prop('i_update') + "</span></a></li>";
                                break;
                            case "DB_Backup":
                                navbarHtml += (page_name == child_page ?
                                        selected_li : "<li class=\"setting-type\"><a href=\"../DB_Backup.html\">") +
                                    "<i class=\"fas fa-database\"></i><span>" + $.i18n.prop('i_dbBackup') + "</span></a></li>";
                                break;
                            default:
                                break;
                        }
                    });
                    navbarHtml += "<li class=\"start\"><a href=\"javascript: StartClick();\" id=\"btn_start\">" +
                        "<i class=\"fas fa-play\" style=\"padding-left:2px;\"></i>" +
                        "<span>" + $.i18n.prop('i_startPositioning') + "</span></a></li>";
                }
            };
        if (parent_page in setChildrenOfParent)
            setChildrenOfParent[parent_page]();
    };
    this.loadNavbar = function () {
        navbarHtml += "<hr><li class=\"lock\"><a href=\"javascript: lockLeftMemu();\">";
        if (lock_stste == "unlocked")
            navbarHtml += "<i class=\"fas fa-lock-open\"></i><span>" + $.i18n.prop('i_lock') + "</span>";
        else
            navbarHtml += "<i class=\"fas fa-lock\"></i><span>" + $.i18n.prop('i_unlock') + "</span>";
        navbarHtml += "</a></li></ul></nav></div></aside>";
        document.getElementById("icon_navbar").innerHTML = navbarHtml;
    };
}