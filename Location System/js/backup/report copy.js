'use strict';
var mapList = {},
    memberList = {},
    timeDelay = {},
    selectMembers = {},
    selectNumberArray = [],
    dateArray = [],
    historyData = [];


$(function () {
    /* Check this page's permission and load navbar */
    loadUserData();
    checkPermissionOfPage("Report");
    setNavBar("Report", "");

    getMap();
    setMembersDialog();
    setDisplayRowsDialog();
    getDepts();

    $("#select_report_type").on("change", function () {
        switch ($(this).val()) {
            case "daily_report":
                $("#select_report_name").html(
                    "<option value=\"person_timeline\">個人一日軌跡</option>" +
                    "<option value=\"member_attendance\">人員出勤表</option>" +
                    "<option value=\"all_member_attend\">全部人員出勤表</option>");
                selectPage("person_timeline");
                $("#report_time").html("<label>選擇日期 :</label> <input type='date' id=\"date_one_day\" />");
                break;
            case "weekly_report":
                $("#select_report_name").html(
                    "<option value=\"member_attendance\">人員出勤表</option>" +
                    "<option value=\"all_member_attend\">全部人員出勤表</option>");
                selectPage("member_attendance");
                $("#report_time").html("<label>開始日期 :</label> <input type='date' id=\"date_aweek_start\" /><br>" +
                    "<label>結束日期 :</label> <input type='date' id=\"date_aweek_end\" readonly/>");
                $("#date_aweek_start").on("change", function () {
                    var date = new Date($(this).val());
                    date.setDate(date.getDate() + 6); //取得６天後的日期
                    $("#date_aweek_end").val(new Date(date).format("yyyy-MM-dd")); //轉換成日期元件可使用的格式
                });
                break;
            case "monthly_report":
                $("#select_report_name").html(
                    "<option value=\"member_attendance\">人員出勤表</option>" +
                    "<option value=\"all_member_attend\">全部人員出勤表</option>");
                selectPage("member_attendance");
                $("#report_time").html("<label>選擇年月 :</label> <input type='month' id=\"month_select\" value=\"\" />");
                break;
            default:
                break;
        }
    });

    $("#select_report_name").on("change", function () {
        selectPage($(this).val());
    });

    $("#btn_create_report").on("click", function () {
        switch ($("#select_report_name").val()) {
            case "person_timeline":
                if (selectNumberArray.length > 1 &&
                    !confirm("此報表為個人一日軌跡，如選擇多個人員，也只會搜尋第一個人員，確認繼續?")) {
                    return;
                } else if (selectNumberArray.length == 0) {
                    alert("請選擇人員!")
                    return;
                }
                getPersonTimeline(selectNumberArray[0]);
                break;
            case "member_attendance":
            case "all_member_attend":
                if (selectNumberArray.length == 0) {
                    alert("請選擇人員!")
                    return;
                }
                getAttendanceList();
                break;
            default:
                break;
        }
    });

    $("#btn_delete_members").on("click", function () {
        if ($("#select_report_name").val() == "all_member_attend")
            return;
        var checkbox = document.getElementsByName("select_members");
        selectNumberArray = [];
        for (var i = 0; i < checkbox.length; i++) {
            if (!checkbox[i].checked)
                selectNumberArray.push(checkbox[i].value);
        }
        $("#table_members tbody").empty();
        selectNumberArray.forEach(function (number, i) {
            $("#table_members tbody").append("<tr>" +
                "<td><input type='checkbox' name=\"select_members\" value=\"" + number + "\" /> " +
                (i + 1) + "</td>" +
                "<td>" + number + "</td>" +
                "<td>" + memberList[number].Name + "</td></tr>");
        });
        $("#count_sel_members").text(selectNumberArray.length);
        $("#chk_all_member").prop("checked", false);
    });

    $("#chk_all_search_member").on("click", function () {
        var checkboxs = document.getElementsByName("chk_members"),
            isChecked = $(this).prop("checked");
        checkboxs.forEach(function (element) {
            element.checked = isChecked;
        });
        if (isChecked)
            $("#search_member_list tbody tr").addClass("selected");
        else
            $("#search_member_list tbody tr").removeClass("selected");
    });

    $("#chk_all_member").on("click", function () {
        var checkboxs = document.getElementsByName("select_members"),
            isChecked = $(this).prop("checked");
        checkboxs.forEach(function (element) {
            element.checked = isChecked;
        });
    });

    $("#btn_export_excel").click(function () {
        switch ($("#select_report_name").val()) {
            case "person_timeline":
                var name = "person_timeline";
                var array = convertTableToArray("table_person_timeline");
                if (array.length == 0)
                    return alert($.i18n.prop('i_reportAlarm_1'));
                var arr = array.slice(0, 10000);
                //arraysToExcel.timeline(arr, "個人一日軌跡.xls", "Excel");
                $("#dvjson").excelexportjs({
                    containerid: "dvjson",
                    datatype: 'json',
                    dataset: arr,
                    columns: getColumns(arr),
                    fileName: "個人一日軌跡",
                    worksheetName: name
                });
                break;
            case "member_attendance":
            case "all_member_attend":
                if (historyData.length > 0)
                    arraysToExcel.attendance(historyData, dateArray, "人員出勤表.xls", "Excel");
                else
                    alert($.i18n.prop('i_reportAlarm_1'));
                break;
            default:
                break;
        }
    });

    //control pages buttons
    $("#btn_top").on("click", function () {
        changePage.top();
    });
    $("#btn_backword").on("click", function () {
        changePage.backword();
    });
    $("#btn_forword").on("click", function () {
        changePage.forword();
    });
    $("#btn_bottom").on("click", function () {
        changePage.bottom();
    });
    $("#current_pages").on("change", function () {
        changePage.select($(this).val());
    });
});

function getDepts() {
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success == 1) {
                $("#search_dept").val("<option value=\"\">All</option>");
                revObj.Value[0].Values.forEach(function (element) {
                    $("#search_dept").append("<option value=\"" + element.c_id + "\">" + element.children + "</option>");
                });
            }
        }
    };
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["GetDepartment_relation_list"],
        "api_token": [token]
    }));
}

function selectPage(page_name) {
    switch (page_name) {
        case "person_timeline":
            $("#report_page_member").hide();
            $("#report_page_all_member").hide();
            $("#report_page_timeline").show();
            break;
        case "member_attendance":
            $("#report_page_timeline").hide();
            $("#report_page_all_member").hide();
            $("#report_page_member").show();
            $("#report_attend_title").text("人員出勤表");
            break;
        case "all_member_attend":
            $("#report_page_timeline").hide();
            $("#report_page_all_member").hide();
            $("#report_page_member").show();
            $("#report_attend_title").text("全部人員出勤表");
            $("#table_members tbody").empty();
            var count = 0;
            selectNumberArray = []
            for (var number in memberList) {
                selectNumberArray.push(number);
                count++;
                $("#table_members tbody").append("<tr>" +
                    "<td><input type='checkbox' name=\"select_members\" value=\"" + number + "\" /> " +
                    count + "</td>" +
                    "<td>" + number + "</td>" +
                    "<td>" + memberList[number].Name + "</td></tr>");
            }
            $("#count_sel_members").text(count);
            break;
        default:
            break;
    }
}

function getMap() {
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success == 1) {
                $("#target_map").empty();
                revObj.Value[0].Values.forEach(function (element) {
                    //mapList => key: map_id | value: {map_id, map_name, map_src, map_scale}
                    mapList[element.map_id] = {
                        map_id: element.map_id,
                        map_name: element.map_name,
                        map_src: "data:image/" + element.map_file_ext + ";base64," + element.map_file,
                        map_scale: element.map_scale
                    }
                    $("#target_map").append("<option value=\"" + element.map_id + "\">" + element.map_name + "</option>");
                });
                $("#target_map").on('change', function () {
                    var mapInfo = mapList[$(this).val()];
                    loadImage(mapInfo.map_src, mapInfo.map_scale);
                    restartCanvas();
                });
            }
        }
    };
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps"],
        "api_token": [token]
    }));
}


function getPersonTimeline(number) {
    var person = memberList[number],
        interval_times = 0,
        count_times = 0,
        row_count = 0,
        date = document.getElementById("date_one_day").value,
        date_arr = date.split("-"),
        func = {
            getCount: function () {
                if (date == "")
                    return alert("請選擇日期!");
                for (var title in RowsList) {
                    if (RowsList[title]["timeline"] == true) {
                        $("#report_person_" + title).text(person[title]);
                    }
                }
                showSearching();
                document.getElementById("report_date").innerText = date_arr[0] + "年" + date_arr[1] + "月" + date_arr[2] + "日";
                $("#table_person_timeline tbody").empty();
                var request = {
                    "Command_Name": ["GetLocus_combine_with_record"],
                    "Command_Type": ["Read"],
                    "Value": {
                        "start_date": date,
                        "start_time": "00:00:00",
                        "end_date": date,
                        "end_time": "23:59:59",
                        "flag": "1",
                        "target": person.tag_id.substring(8),
                        "startnum": "0",
                        "getcnt": "1"
                    },
                    "api_token": [token]
                };
                var xmlHttp = createJsonXmlHttp("sql");
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                        if (!this.responseText) {
                            $('#progress_block').hide();
                            clearTimeout(timeDelay["model"]);
                            alert("搜尋失敗，請稍候再試一次!");
                            return;
                        }
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success == 1) {
                            var revInfo = revObj.Value[0].location || [{
                                "Status": "0"
                            }];
                            if (revInfo[0].Status == "1") {
                                var total = parseInt(revInfo[0].Values[0].count, 10);
                                interval_times += Math.ceil(total / 10000);
                                func.getDatas(revInfo[0].tag_id, "0", parseInt(total, 10));
                            }
                        }
                    }
                };
                xmlHttp.send(JSON.stringify(request));
            },
            getDatas: function (target, startnum, total) {
                if (total == 0)
                    alert($.i18n.prop('i_tagID') + ":[" + target + "]在此時段內無歷史資料");
                var request = {
                    "Command_Name": ["GetLocus_combine_with_record"],
                    "Command_Type": ["Read"],
                    "Value": {
                        "start_date": date,
                        "start_time": "00:00:00",
                        "end_date": date,
                        "end_time": "23:59:59",
                        "flag": "1",
                        "target": target,
                        "startnum": startnum,
                        "getcnt": "0"
                    },
                    "api_token": [token]
                };

                var xmlHttp = createJsonXmlHttp("sql");
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                        if (!this.responseText) {
                            $('#progress_block').hide();
                            clearTimeout(timeDelay["progress"]);
                            alert("搜尋失敗，請稍候再試一次!");
                            return;
                        }
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success == 1) {
                            var location = revObj.Value[0].location || [{
                                "Status": "0"
                            }];
                            if (location[0].Status == "1") {
                                var values = location[0].Values;
                                if (values) {
                                    values.forEach(function (element) {
                                        row_count++;
                                        $("#table_person_timeline tbody").append("<tr>" +
                                            "<td>" + row_count + "</td>" +
                                            "<td>" + timeline.time.split(" ")[1] + "</td>" +
                                            "<td>" + mapList[timeline.map_id].map_name +
                                            " ( " + timeline.coordinate_x +
                                            " , " + timeline.coordinate_y +
                                            " ) </td></tr>");
                                    });
                                }
                                count_times++;
                            }
                            $("#progress_bar").text(Math.round(count_times / interval_times * 100) + " %");
                            var count = parseInt(startnum, 10) + location[0].amount;
                            if (total != count) {
                                //以10000筆資料為基準，分批接受並傳送要求
                                func.getDatas(location[0].tag_id, count.toString(), total);
                            } else {
                                //if (interval_times <= count_times) {
                                completeSearch();
                                //}
                            }
                            /*var revInfo = revObj.Value[0].Values || [];
                            var record_sec = "";
                            revInfo.forEach(function(timeline) {
                                var sec = parseInt(timeline.time.split(" ")[1].split(":")[2], 10);
                                if (sec != record_sec) {
                                    row_count++;
                                    record_sec = sec;
                                    $("#table_person_timeline tbody").append("<tr>" +
                                        "<td>" + row_count + "</td>" +
                                        "<td>" + timeline.time.split(" ")[1] + "</td>" +
                                        "<td>" + mapList[timeline.map_id].map_name +
                                        " ( " + parseInt(timeline.coordinate_x, 10) +
                                        " , " + parseInt(timeline.coordinate_y, 10) +
                                        " ) </td></tr>");
                                }
                            });

                            if (revObj.Value[0].Status == "1") {
                                //以10000為基準，分批接受並傳送要求
                                count_times++;
                                $("#progress_bar").text(Math.round(count_times / 24 * 100) + " %");
                                timeDelay["search"].push(setTimeout(function () {
                                    sendRequest({
                                        "Command_Type": ["Read"],
                                        "Command_Name": ["GetLocus_combine_hour"],
                                        "Value": {
                                            "tag_id": revObj.Value[0].tag_id,
                                            "start_date": revObj.Value[0].start_date,
                                            "start_time": revObj.Value[0].start_time,
                                            "end_date": revObj.Value[0].end_date,
                                            "end_time": revObj.Value[0].end_time
                                        },
                                        "api_token": [token]
                                    });
                                }, 100));
                            } else {
                                count_times++;
                                $("#progress_bar").text(Math.round(count_times / 24 * 100) + " %");
                                if (count_times >= 24)
                                    completeSearch();
                            }*/
                        }
                    }
                };
                xmlHttp.send(JSON.stringify(request));
            }
        }
    return func.getCount();
}

function getAttendanceList() {
    var interval_times = 0,
        count_times = 0,
        isStop = false;

    dateArray = [];

    switch ($("#select_report_type").val()) {
        case "daily_report":
            if ($("#date_one_day").val() == "")
                return alert("請選擇日期!");
            var date = document.getElementById("date_one_day").value;
            dateArray.push(new Date(date).format("yyyy-MM-dd"));
            break;
        case "weekly_report":
            if ($("#date_aweek_start").val() == "")
                return alert("請選擇日期!");
            var start_date = document.getElementById("date_aweek_start").value;
            for (var i = 0; i < 7; i++) {
                var date = new Date(start_date);
                date.setDate(date.getDate() + i);
                dateArray.push(new Date(date).format("yyyy-MM-dd"));
            }
            break;
        case "monthly_report":
            return alert("月報表暫不提供!"); //因為搜尋時間太長了，搜尋會出錯，暫待提高出缺勤的搜尋效率;

            if ($("#month_select").val() == "")
                return alert("請選擇日期!");
            var year_month = $("#month_select").val();
            var month = new Date(year_month).getMonth();
            var m = month;
            var d = 1;
            while (1) {
                var date = new Date(year_month);
                date.setDate(d++);
                m = date.getMonth();
                if (m == month)
                    dateArray.push(new Date(date).format("yyyy-MM-dd"));
                else
                    break;
            }
            break;
        default:
            break;
    }

    if (timeDelay["search"]) {
        timeDelay["search"].forEach(function (timeout) {
            clearTimeout(timeout);
        });
    }
    timeDelay["search"] = [];
    showSearching();

    var total_search = selectNumberArray.length * dateArray.length,
        packge_percent = 100 / total_search / 24;

    selectMembers = {};

    $("#table_member_attendance tbody").empty();

    dateArray.forEach(function (date, index) {
        selectNumberArray.forEach(function (number, i) {
            var tag_id = memberList[number].tag_id.substring(8);
            if (index == 0)
                selectMembers[tag_id] = memberList[number];
            timeDelay["search"].push(setTimeout(function () {
                if (!historyData[index])
                    historyData[index] = {};
                historyData[index][tag_id] = {
                    first: null,
                    last: null
                };
                sendRequest(index, {
                    "Command_Type": ["Read"],
                    "Command_Name": ["GetLocus_combine_hour"],
                    "Value": {
                        "tag_id": tag_id,
                        "start_date": date,
                        "start_time": "00:00:00",
                        "end_date": date,
                        "end_time": "23:59:59"
                    },
                    "api_token": [token]
                });
            }), 200 * i);
        });
    });

    function sendRequest(index, request) {
        var xmlHttp = createJsonXmlHttp("sql");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                if (isStop) return;
                if (!this.responseText) {
                    $('#progress_block').hide();
                    clearTimeout(timeDelay["progress"]);
                    alert("搜尋失敗，請稍候再試一次!");
                    isStop = true;
                    return;
                }
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    var revInfo = revObj.Value[0].Values || [],
                        tag_id = revObj.Value[0].tag_id;
                    revInfo.forEach(function (timeline) {
                        if (!historyData[index][tag_id].first) {
                            historyData[index][tag_id].first = timeline;
                        } else {
                            historyData[index][tag_id].last = timeline;
                        }
                    });
                    interval_times++;
                    $("#progress_bar").text(Math.round(packge_percent * interval_times) + " %");

                    if (revObj.Value[0].Status == "1") {
                        //以1小時為基準，分批接受並傳送要求
                        timeDelay["search"].push(setTimeout(function () {
                            sendRequest(index, {
                                "Command_Type": ["Read"],
                                "Command_Name": ["GetLocus_combine_hour"],
                                "Value": {
                                    "tag_id": tag_id,
                                    "start_date": revObj.Value[0].start_date,
                                    "start_time": revObj.Value[0].start_time,
                                    "end_date": revObj.Value[0].end_date,
                                    "end_time": revObj.Value[0].end_time
                                },
                                "api_token": [token]
                            });
                        }, 100));
                    } else {
                        count_times++;

                        if (index == 0) {
                            var member_info = selectMembers[tag_id],
                                attend_from = historyData[index][tag_id].first,
                                attend_end = historyData[index][tag_id].last,
                                tr_context = "",
                                date_arr = dateArray[0].split("-");
                            tr_context += "<tr><td>" + count_times + "</td>";
                            for (var title in RowsList) {
                                if (RowsList[title]["attendance"] == true)
                                    tr_context += "<td>" + member_info[title] + "</td>";
                            }
                            tr_context += "<td>" + (attend_from ? attend_from.time.split(" ")[1] : "缺席") + "</td>" +
                                "<td>" + (attend_end ? attend_end.time.split(" ")[1] : "缺席") + "</td></tr>";
                            $("#table_member_attendance tbody").append(tr_context);
                            $("#current_pages").val(1);
                            document.getElementById("report_attend_date").innerText = date_arr[0] + "年" + date_arr[1] + "月" + date_arr[2] + "日";
                        }

                        if (total_search <= count_times) {
                            $("#progress_bar").text("100 %");
                            completeSearch();
                            $("#total_pages").text(dateArray.length);
                        }
                    }
                }
            }
        };
        xmlHttp.send(JSON.stringify(request));
    }
}

var changePage = {
    forword: function () {
        var pages = parseInt($("#current_pages").val(), 10);
        if (pages == $("#total_pages").text())
            alert("已經在最後一頁了!");
        else
            this.toPage(pages + 1);
    },
    backword: function () {
        var pages = parseInt($("#current_pages").val(), 10);
        if (pages == 1)
            alert("已經在第一頁了!");
        else
            this.toPage(pages - 1);
    },
    top: function () {
        if (dateArray.length > 0)
            this.toPage(1);
    },
    bottom: function () {
        if (dateArray.length > 0)
            this.toPage($("#total_pages").text());
    },
    select: function (pages) {
        if (dateArray.length > 0) {
            pages = parseInt(pages);
            if (pages < 1)
                this.toPage(1);
            else if (pages > dateArray.length)
                this.toPage(dateArray.length);
            else
                this.toPage(pages);
        } else {
            $("#current_pages").val(1);
        }
    },
    toPage: function (pages) {
        var count = 0,
            date_arr = dateArray[pages - 1].split("-");
        $("#current_pages").val(pages);
        $("#table_member_attendance tbody").empty();
        for (var tag_id in selectMembers) {
            var member_info = selectMembers[tag_id],
                attend_from = historyData[pages - 1][tag_id].first,
                attend_end = historyData[pages - 1][tag_id].last,
                tr_context = "";
            count++;
            tr_context += "<tr><td>" + count + "</td>";
            for (var title in RowsList) {
                if (RowsList[title]["attendance"] == true)
                    tr_context += "<td>" + member_info[title] + "</td>";
            }
            tr_context += "<td>" + (attend_from ? attend_from.time.split(" ")[1] : "缺席") + "</td>" +
                "<td>" + (attend_end ? attend_end.time.split(" ")[1] : "缺席") + "</td></tr>";
            $("#table_member_attendance tbody").append(tr_context);
        }
        document.getElementById("report_attend_date").innerText = date_arr[0] + "年" + date_arr[1] + "月" + date_arr[2] + "日";
    }
}

/**
 * Show Search Model
 */
function showSearching() {
    $("#progress_bar").text("0 %");
    $('#progress_block').show();
    timeDelay["progress"] = setTimeout(function () {
        $('#progress_block').hide();
        clearTimeout(timeDelay["progress"]);
    }, 3600000);
}

function completeSearch() {
    $('#progress_block').hide();
    clearTimeout(timeDelay["progress"]);
    alert($.i18n.prop('i_searchOver'));
}