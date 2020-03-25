var noImagePng = "../image/no_image.png";
var PIXEL_RATIO; // 獲取瀏覽器像素比
var cvsBlock, canvas, ctx;
var canvasImg = {
    isPutImg: false,
    width: 0,
    height: 0,
    scale: 1 //預設比例尺為1:1
};
var serverImg = new Image();
// View parameters
var lastX = 0; //滑鼠最後位置的X座標
var lastY = 0; //滑鼠最後位置的Y座標
var xleftView = 0; //canvas的X軸位移(負值向左，正值向右)
var ytopView = 0; //canvas的Y軸位移(負值向上，正值向下)
var Zoom = 1.0; //縮放比例
var isFitWindow = true;
var map_id = "";
var mapCollection = {};
var historyData = {};
var times = 0;
var max_times = 0;
var isContinue = false;
var timeDelay = {
    search: [],
    draw: [],
    model: ""
};
var group_color = "#ff9933";
var timeslot_array = [];
var locate_tag = "";
var MemberData = {};

$(function () {
    var h = document.documentElement.clientHeight;
    //$(".container").css("height", h - 10 + "px");
    $("#cvsBlock").css("height", h - 100 + "px");
    
    //Check this page's permission and load navbar
    loadUserData();
    checkPermissionOfPage("Timeline");
    setNavBar("Timeline", "");

    $('.timepicker').bootstrapMaterialDatePicker({
        date: false,
        clearButton: true,
        lang: 'en',
        format: 'HH:mm'
    });

    var dialog = $("#add_target_dialog");
    dialog.dialog({
        autoOpen: false,
        height: 180,
        width: 300,
        modal: true,
        buttons: {
            Confirm: function () {
                var target_id = $("#add_target_tag_id"),
                    targrt_color = $("#add_target_color");
                target_id.removeClass("ui-state-error");
                var valid = true && checkLength(target_id, $.i18n.prop('i_targetIdLangth'), 1, 16);
                if (valid) {
                    $("#table_target tbody").append("<tr><td><input type=\"checkbox\" name=\"chk_target_id\"" +
                        " value=\"" + fullOf4Byte(target_id.val()) + "\"/> " + target_id.val() + "</td>" +
                        "<td><input type=\"color\" name=\"input_target_color\" value=\"" + targrt_color.val() + "\" /></td>" +
                        "<td><button class=\"btn btn-default btn-focus\" onclick=\"locateTag(\'" + fullOf4Byte(target_id.val()) +
                        "\')\"><img class=\"icon-image\" src=\"../image/target.png\"></button></td></tr>");
                    dialog.dialog("close");
                }
            },
            Cancel: function () {
                dialog.dialog("close");
            }
        }
    });
    $("#btn_target_add").on('click', function () {
        stopTimeline();
        $("#add_target_tag_id").val("");
        $("#add_target_color").val("#00cc66");
        dialog.dialog("open");
    });
    $("#btn_target_delete").on('click', function () {
        stopTimeline();
        var save_array = [];
        $("input[name='chk_target_id']").each(function (i, tag_id) {
            if (!$(this).prop("checked"))
                save_array.push($(this).parents("tr").html());
        });
        $("#table_target tbody").empty();
        save_array.forEach(html => {
            $("#table_target tbody").append("<tr>" + html + "</tr>");
        });
    });

    $("#canvas").on("mousedown", function (e) {
        e.preventDefault();
        var canvas_left = parseInt($("#canvas").css("margin-left"));
        var canvas_top = parseInt($("#canvas").css("margin-top"));
        var downx = e.pageX;
        var downy = e.pageY;
        $("#canvas").on("mousemove", function (es) {
            xleftView = es.pageX - downx + canvas_left;
            ytopView = es.pageY - downy + canvas_top;
            $("#canvas").css("margin-left", xleftView + "px").css("margin-top", ytopView + "px");
        });
        $("#canvas").on("mouseup", function () {
            $("#canvas").off("mousemove");
        });
    });

    //調整間隔時間的滑塊條
    $("#interval_slider").slider({
        value: 100,
        min: 0,
        max: 1000,
        step: 20,
        slide: function (event, ui) {
            $("#interval").val(ui.value);
        }
    });
    $("#interval").val($("#interval_slider").slider("value"));

    $("#interval_slider").mousedown(function () {
        $(this).mousemove(function () {
            clearDrawInterval();
            if (historyData["search_type"] && historyData["search_type"] == "Tag") {
                timeDelay["draw"].push(setInterval("drawNextTimeByTag()", $("#interval").val()));
            } else {
                timeDelay["draw"].push(setInterval("drawNextTimeByGroup()", $("#interval").val()));
            }
        });
        $(this).mouseup(function () {
            $(this).unbind('mousemove');
        });
    });

    $("#target_type").on('change', function () {
        if ($(this).val() == "Tag") {
            $("#target_group").hide();
            $("#target_alarm_handle").hide();
            $("#target_tag").show();
            $("#alarmBlock").hide();
            $("#timelineBlock").show();
        } else if ($(this).val() == "Group") {
            $("#target_tag").hide();
            $("#target_alarm_handle").hide();
            $("#target_group").show();
            $("#alarmBlock").hide();
            $("#timelineBlock").show();
        } else {
            $("#target_tag").hide();
            $("#target_group").hide();
            $("#target_alarm_handle").show();
            $("#timelineBlock").hide();
            $("#alarmBlock").show();
        }
    });

    $("#btn_resst_locate_tag").on('click', function () {
        changeLocateTag("");
    });

    $("input[name=radio_is_limit]").on("change", function () {
        if ($(this).prop('checked'))
            $("#limit_count").prop('disabled', $(this).val());
    });

    $("input[type=text]").prop("disabled", false);

    setup();
});

function setup() {
    cvsBlock = document.getElementById("cvsBlock");
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    PIXEL_RATIO = (function () {
        var dpr = window.devicePixelRatio || 1,
            bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
        return dpr / bsr;
    })();
    canvas.addEventListener("DOMMouseScroll", handleMouseWheel, false); //畫面縮放(for Firefox)
    canvas.addEventListener('click', handleMouseClick, false); //點擊地圖上的tag，跳出tag的訊息框
    canvas.addEventListener("mousemove", handleMouseMove, false); //滑鼠在畫布中移動的座標
    canvas.addEventListener("mousewheel", handleMouseWheel, { //畫布縮放
        passive: true
    });
    getMemberNumber();
    /**
     * 接收並載入Server的地圖資訊
     * 取出物件所有屬性的方法，參考網址: 
     * https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
     */
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success == 1) {
                $("#target_map").empty();
                revObj.Value[0].Values.forEach(function (element) {
                    //mapCollection => key: map_id | value: {map_id, map_name, map_src, map_scale}
                    mapCollection[element.map_id] = {
                        map_id: element.map_id,
                        map_name: element.map_name,
                        map_src: "data:image/" + element.map_file_ext + ";base64," + element.map_file,
                        map_scale: element.map_scale
                    }
                    $("#target_map").append("<option value=\"" + element.map_id + "\">" + element.map_name + "</option>");
                });
                $("#target_map").on('change', function () {
                    var mapInfo = mapCollection[$(this).val()];
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

function getMemberNumber() {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetStaffs"],
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql"); //updateMemberList
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!checkTokenAlive(revObj)) {
                return;
            } else if (revObj.Value[0].success > 0) {
                var memberArray = revObj.Value[0].Values || [];
                for (var i = 0; i < memberArray.length; i++) {
                    var user_id = parseInt(memberArray[i].tag_id.substring(8), 16);
                    MemberData[user_id] = {
                        tag_id: memberArray[i].tag_id,
                        number: memberArray[i].number,
                        name: memberArray[i].Name,
                        dept: memberArray[i].department,
                        photo: "",
                        card_id: memberArray[i].card_id
                    };
                }
            } else {
                alert($.i18n.prop('i_alertError_1'));
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function getMemberData(user_id) {
    if (!MemberData[user_id]) {
        MemberData[user_id] = { //新建一個空的成員資料到其中
            tag_id: "",
            number: "",
            name: "",
            dept: "",
            photo: noImagePng,
            card_id: ""
        };
        return;
    }
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetOneStaff"],
        "Value": {
            "number": MemberData[user_id].number
        },
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                if ("Values" in revObj.Value[0]) {
                    var revInfo = revObj.Value[0].Values[0];
                    if (revInfo.file_ext == "" || revInfo.photo == "")
                        MemberData[user_id].photo = noImagePng;
                    else
                        MemberData[user_id].photo = "data:image/" + revInfo.file_ext + ";base64," + revInfo.photo;
                }
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function inputMemberPhoto(src) {
    var thumb_width = parseInt($("#thumb_img").css('max-width'), 10);
    var thumb_height = parseInt($("#thumb_img").css('max-height'), 10);
    if (src.length > 0) {
        var img = new Image();
        img.src = src;
        img.onload = function () {
            var thumbSize = thumb_width / thumb_height;
            var imgSize = img.width / img.height;
            if (imgSize > thumbSize) { //原圖比例寬邊較長
                $("#thumb_img").attr('src', src);
                $("#thumb_img").width(thumb_width).height(img.height * (thumb_width / img.width));
            } else {
                $("#thumb_img").attr('src', src);
                $("#thumb_img").width(img.width * (thumb_height / img.height)).height(thumb_height);
            }
        }
    } else {
        $("#thumb_img").attr('src', noImagePng).width(thumb_width).height(thumb_height);
    }
}

function search() {
    if ($("#target_type").val() == "AlarmHandle") {
        return getAlarmHandleByTime();
    }
    stopTimeline();

    if ($("#start_date").val() == "")
        return alert("請選擇開始日期!");
    else if ($("#start_time").val() == "")
        return alert("請選擇開始時間!");
    else if ($("#end_date").val() == "")
        return alert("請選擇結束日期!");
    else if ($("#end_time").val() == "")
        return alert("請選擇結束時間!");

    var datetime_start = Date.parse($("#start_date").val() + " " + $("#start_time").val()),
        datetime_end = Date.parse($("#end_date").val() + " " + $("#end_time").val());
    if (datetime_end - datetime_start < 60000) {
        return alert($.i18n.prop('i_alertTimeTooShort'));
    } else if (datetime_end - datetime_start > 86400000 * 7) { //86400000 = 一天的毫秒數
        if (!confirm($.i18n.prop('i_alertTimeTooLong')))
            return false;
    }
    switch ($("#target_type").val()) {
        case "Tag":
            var target_ids = document.getElementsByName("chk_target_id");
            if (target_ids.length == 0) {
                alert($.i18n.prop('i_searchNoTag'));
                return false;
            }
            historyData = {
                search_type: "Tag"
            };
            getTimelineByTags(datetime_start, datetime_end);
            break;
        case "Group":
            var group_id = $("#target_group_id").val();
            if (group_id.length == 0) {
                alert($.i18n.prop('i_searchNoGroup'));
                return false;
            }
            timeslot_array = [];
            historyData = {
                search_type: "Group"
            };
            getTimelineByGroup(datetime_start, datetime_end, group_id);
            break;
        default:
            alert($.i18n.prop('i_searchNoType'));
            return false;
    }
    showSearching();
}

function getTimelineByTags(datetime_start, datetime_end) {
    var timeslot = datetime_end - datetime_start;
    //console.log("timeslot=> " + Math.floor(timeslot / 3600000));
    var interval_times = 0;
    var count_times = 0;
    for (i in timeDelay["search"])
        clearTimeout(timeDelay["search"][i]);
    timeDelay["search"] = [];
    document.getElementsByName("chk_target_id").forEach(function (tag_id, i) {
        getMemberData(parseInt(tag_id.value, 16));
        interval_times++;
        timeDelay["search"].push(setTimeout(function () {
            sendRequest({
                "Command_Type": ["Read"],
                "Command_Name": ["GetLocus_combine_hour"],
                "Value": {
                    "tag_id": tag_id.value,
                    "start_date": $("#start_date").val(),
                    "start_time": $("#start_time").val() + ":00",
                    "end_date": $("#end_date").val(),
                    "end_time": $("#end_time").val() + ":00"
                },
                "api_token": [token]
            });
        }, 100 * i));
    });
    interval_times *= Math.floor(timeslot / 3600000) + 1; //($("#end_time").val().split(":")[1] == "00" ? 1 : 1);
    //console.log("interval_times=> " + interval_times);

    function sendRequest(request) {
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
                    var revInfo = revObj.Value[0].Values || [];
                    var tag_id = request.Value.tag_id;
                    for (i = 0; i < revInfo.length; i++) {
                        if (revInfo[i].map_id in mapCollection) {
                            var mapInfo = mapCollection[revInfo[i].map_id];
                            var datetime_arr = TimeToArray(revInfo[i].time);
                            if (!historyData[tag_id])
                                historyData[tag_id] = [];
                            historyData[tag_id].push({
                                map_id: mapInfo.map_id,
                                map_name: mapInfo.map_name,
                                x: parseInt(revInfo[i].coordinate_x, 10),
                                y: parseInt(revInfo[i].coordinate_y, 10),
                                date: datetime_arr[0],
                                time: datetime_arr[1]
                            });
                        }
                    }
                    count_times++;
                    $("#progress_bar").text(Math.round(count_times / interval_times * 100) + " %");

                    if (revObj.Value[0].Status == "1") {
                        //以1小時為基準，分批接受並傳送要求
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
                        //console.log("count_times=> " + count_times);
                    } else {
                        //console.log("End=> " + count_times);
                        if (historyData[tag_id] && historyData[tag_id].length > max_times)
                            max_times = historyData[tag_id].length;
                        //找最長的Tag歷史軌跡長度，定為一週期繪製軌跡的結束
                        if (interval_times <= count_times)
                            completeSearch();
                    }
                }
            }
        };
        xmlHttp.send(JSON.stringify(request));
    }
}

function getTimelineByGroup(datetime_start, datetime_end, group_id) {
    var timeslot = datetime_end - datetime_start;
    var interval_times = Math.ceil(timeslot / 3600000); //間隔多少分鐘(無條件進位)
    var count_times = 0;
    var tag_array = [];
    var group_map = {
        id: "",
        name: ""
    };
    var getMapGroup = createJsonXmlHttp("sql");
    getMapGroup.onreadystatechange = function () {
        if (getMapGroup.readyState == 4 || getMapGroup.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success == 1) {
                var revInfo = revObj.Value[0].Values || [];
                var index = revInfo.findIndex(function (info) {
                    return info.group_id == group_id;
                });
                if (index == -1) {
                    $('#progress_block').hide();
                    clearTimeout(timeDelay["model"]);
                    alert("此群組不存在，請輸入其他群組編號再查詢!");
                    return false;
                }
                group_map.id = revInfo[index].map_id;
                group_map.name = mapCollection[revInfo[index].map_id].map_name;
                var start_datetime = new Date(datetime_start)
                    .format("yyyy-MM-dd hh:mm:ss").split(" ");
                var end_datetime = new Date(datetime_start + 3600000) //原本切隔搜尋間隔為1分鐘，改為1小時。
                    .format("yyyy-MM-dd hh:mm:ss").split(" ");
                sendRequest({
                    "Command_Type": ["Read"],
                    "Command_Name": ["GetLocus_combine_group"],
                    "Value": {
                        "group_id": group_id,
                        "start_date": start_datetime[0],
                        "start_time": start_datetime[1],
                        "end_date": end_datetime[0],
                        "end_time": end_datetime[1]
                    },
                    "api_token": [token]
                });
            }
        }
    };
    getMapGroup.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps_Groups"],
        "api_token": [token]
    }));

    function sendRequest(request) {
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
                    var revInfo = revObj.Value[0].Values || [];
                    for (i = 0; i < revInfo.length; i++) {
                        //改成按照時間分類排序
                        var time_arr = (revInfo[i].time.split(" ")[1]).split(":");
                        var second = Math.floor(parseFloat(time_arr[2]));
                        var time = time_arr[0] + ":" + time_arr[1] + ":" +
                            (second < 10 ? "0" + second : second);
                        if (!historyData[time]) {
                            timeslot_array.push(time);
                            historyData[time] = [];
                        }
                        var index = tag_array.indexOf(revInfo[i].tag_id);
                        if (index == -1) {
                            tag_array.push(revInfo[i].tag_id);
                        }
                        var repeat = historyData[time].findIndex(function (info) {
                            return info.tag_id == revInfo[i].tag_id;
                        });
                        if (repeat == -1) {
                            var datetime_arr = TimeToArray(revInfo[i].time);
                            historyData[time].push({
                                tag_id: revInfo[i].tag_id,
                                map_id: group_map.id,
                                map_name: group_map.name,
                                x: parseInt(revInfo[i].coordinate_x, 10),
                                y: parseInt(revInfo[i].coordinate_y, 10),
                                date: datetime_arr[0],
                                time: datetime_arr[1]
                            });
                        }
                    }
                    count_times++
                    $("#progress_bar").text(Math.round(count_times / interval_times * 100) + " %");
                    if (interval_times > count_times) {
                        var start_datetime = new Date(datetime_start + 3600000 * count_times)
                            .format("yyyy-MM-dd hh:mm:ss").split(" ");
                        var end_datetime = new Date(datetime_start + 3600000 * (count_times + 1))
                            .format("yyyy-MM-dd hh:mm:ss").split(" ");
                        //以1分鐘為基準，分批接受並傳送要求
                        sendRequest({
                            "Command_Type": ["Read"],
                            "Command_Name": ["GetLocus_combine_group"],
                            "Value": {
                                "group_id": group_id,
                                "start_date": start_datetime[0],
                                "start_time": start_datetime[1],
                                "end_date": end_datetime[0],
                                "end_time": end_datetime[1]
                            },
                            "api_token": [token]
                        });
                    } else {
                        $("#table_tag_list tbody").empty();
                        tag_array.sort();
                        tag_array.forEach(tag_id => {
                            $("#table_tag_list tbody").append(
                                "<tr><td><label name=\"tag_list_id\">" + parseInt(tag_id.substring(8), 16) + "</label></td>" +
                                "<td><button class=\"btn btn-default btn-focus\" onclick=\"changeLocateTag(\'" + tag_id +
                                "\')\"><img class=\"icon-image\" src=\"../image/target.png\"></button></td></tr>"
                            );
                            getMemberData(parseInt(tag_id.substring(8), 16));
                        });
                        completeSearch();
                    }
                }
            }
        };
        xmlHttp.send(JSON.stringify(request));
    }
}

function getAlarmHandleByTime() {
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                var MemberList = {};
                var revInfo = revObj.Value[0].Values || [];
                revInfo.forEach(function (element) {
                    MemberList[element.tag_id] = element;
                });
                var xmlHttp2 = createJsonXmlHttp("alarmhandle");
                xmlHttp2.onreadystatechange = function () {
                    if (xmlHttp2.readyState == 4 || xmlHttp2.readyState == "complete") {
                        var revObj2 = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj2) && revObj2.Value[0]) {
                            var revInfo = revObj2.Value[0].Values;
                            if (revObj2.Value[0].success == 0 || !revInfo || revInfo.length == 0)
                                return alert($.i18n.prop('i_searchNoData'));
                            var type = $("#target_alarm_type").val();
                            $("#table_alarm_handle tbody").empty();
                            for (var i = 0; i < revInfo.length; i++) {
                                if (type == "all" || revInfo[i].alarmtype == type) {
                                    var tag_id = revInfo[i].tagid;
                                    var number = tag_id in MemberList ? MemberList[tag_id].number : "";
                                    var name = tag_id in MemberList ? MemberList[tag_id].Name : "";
                                    $("#table_alarm_handle tbody").prepend("<tr><td>" + (revInfo.length - i) +
                                        "</td><td>" + revInfo[i].alarmtype +
                                        "</td><td>" + parseInt(tag_id.substring(8), 16) +
                                        "</td><td>" + number +
                                        "</td><td>" + name +
                                        "</td><td>" + revInfo[i].alarmhelper +
                                        "</td><td>" + revInfo[i].endtime +
                                        "</td></tr>");
                                }
                            }
                        }
                    }
                };
                xmlHttp2.send(JSON.stringify({
                    "Command_Type": ["Read"],
                    "Command_Name": ["gethandlerecordbytime"],
                    "Value": [{
                        "start_date": $("#start_date").val(),
                        "start_time": $("#start_time").val() + ":00",
                        "end_date": $("#end_date").val(),
                        "end_time": $("#end_time").val() + ":00"
                    }],
                    "api_token": [token]
                }));
            }
        }
    };
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["GetStaffs"],
        "api_token": [token]
    }));
}


/**
 * Show Search Model
 */
function showSearching() {
    $('#progress_block').show();
    $("#progress_bar").text(0 + " %");
    timeDelay["model"] = setTimeout(function () {
        $('#progress_block').hide();
        clearTimeout(timeDelay["model"]);
    }, 3600000);
}

function completeSearch() {
    $('#progress_block').hide();
    clearTimeout(timeDelay["model"]);
    alert($.i18n.prop('i_searchOver'));
    var num = Object.keys(historyData).length;
    if (num <= 1)
        alert($.i18n.prop('i_searchNoData'));
}

function fullOf4Byte(id) {
    id = parseInt(id).toString(16).toUpperCase();
    var length = id.length;
    if (length > 0 && length < 9) {
        for (i = 0; i < 8 - length; i++) {
            id = "0" + id;
        }
        return id;
    } else {
        return "";
    }
}