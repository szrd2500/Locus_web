var PIXEL_RATIO, // 獲取瀏覽器像素比
    cvsBlock, canvas, ctx,
    serverImg = new Image(),
    canvasImg = {
        isPutImg: false,
        width: 0,
        height: 0,
        scale: 1 //預設比例尺為1:1,
    },
    Map_id = "",
    mapArray = [],
    anchorArray = [],
    tagArray = [],
    alarmID_array = [],
    alarmArray = [];

// View parameters
var lastX = 0, //滑鼠最後位置的X座標
    lastY = 0, //滑鼠最後位置的Y座標
    xleftView = 0, //canvas的X軸位移(負值向左，正值向右)
    ytopView = 0, //canvas的Y軸位移(負值向上，正值向下)
    zoomOriginal = 1.0,
    Zoom = zoomOriginal, //縮放比例
    fitZoom = 1,
    isFitWindow = true;

var AnchorPosition = false,
    AnchorDisplay = true,
    isStart = false, //設定Anchor座標中
    pageTimer = {}; //定義計時器全域變數

var isFocus = true,
    alarm_count = 0;

var memberArray = [],
    alarmFilterArr = [];

$(function () {
    /**
     * Check this page's permission and load navbar
     */
    var permission = getPermissionOfPage("index");
    switch (permission) {
        case "":
            alert("No permission");
            history.back();
            break;
        case "R":
            break;
        case "RW":
            break;
        default:
            alert("網頁錯誤，將跳回上一頁");
            history.back();
            break;
    }
    setNavBar("index", "");

    //https://www.minwt.com/webdesign-dev/js/16298.html
    var h = screen.availHeight;
    var w = screen.availWidth;
    console.log("Height: " + h + "\nWidth: " + w);
    $(".cvsBlock").css("height", h * 0.8 + "px");
    $(".member-table").css("max-height", h * 0.71 + "px");
    $(".alarm-table").css("max-height", h * 0.75 + "px");
    $(".search-table").css("max-height", h * 0.7 + "px");

    //預設彈跳視窗載入後隱藏
    $("#member_dialog").dialog({
        autoOpen: false
    });
    $("#alarm_dialog").dialog({
        autoOpen: false
    });
    //設置移動後的默認位置 
    $("#canvas").mousedown(function (e) {
        //獲取div的初始位置，要注意的是需要轉整型，因為獲取到值帶px 
        var canvas_left = parseInt($("#canvas").css("margin-left"));
        var canvas_top = parseInt($("#canvas").css("margin-top"));
        //獲取滑鼠按下時的坐標，區別於下面的es.pageX,es.pageY 
        var downx = e.pageX;
        var downy = e.pageY;
        //pageY的y要大寫，一定要大寫！
        $("#canvas").bind("mousemove", function (es) {
            //滑鼠按下時=>div綁定事件 
            var end_x = es.pageX - downx + canvas_left;
            var end_y = es.pageY - downy + canvas_top;
            //es.pageX,es.pageY:獲取滑鼠移動後的坐標 
            //計算div的最終位置
            $("#canvas").css("margin-left", end_x + "px").css("margin-top", end_y + "px");
            //加上單位 
        });
        $("#canvas").mouseup(function () {
            //滑鼠彈起時=>div取消事件 
            $("#canvas").unbind("mousemove");
        });
        $("#canvas").mouseleave(function () {
            //滑鼠離開canvas時=>div取消事件 
            $("#canvas").unbind("mousemove");
        });
    });
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
    canvas.addEventListener("mousemove", handleMouseMove, false); //滑鼠在畫布中移動的座標
    canvas.addEventListener("mousewheel", handleMouseWheel, false); //畫布縮放
    //canvas.addEventListener("dblclick", handleDblClick, false); // 快速放大點擊位置
    canvas.addEventListener('click', handleMouseClick, false); //點擊地圖上的tag，跳出tag的訊息框
    cvsBlock.addEventListener("mousewheel", handleMouseWheel, false); // 畫面縮放
    cvsBlock.addEventListener("DOMMouseScroll", handleMouseWheel, false); // 畫面縮放(for Firefox)

    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (revObj.success > 0) {
                var MapList = revObj.Values;
                mapArray = MapList.slice(0); //Copy array
                var html = "";
                for (i = 0; i < MapList.length; i++) {
                    html += "<li><input type=\"button\" id=\"map_btn_" + MapList[i].map_id + "\" " +
                        "value=\"" + MapList[i].map_name + "\"" +
                        "onclick=\"addMapTab(\'" + MapList[i].map_id + "\',\'" + MapList[i].map_name +
                        "\')\"></li>";
                }
                document.getElementById("loadMapButtonGroup").innerHTML = html;
                selectMapFromCookie();
            } else {
                alert($.i18n.prop('i_failed_loadMap'));
            }
        }
    };
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps"]
    })); //接收並載入Server的地圖設定到按鈕
}

function addMapTab(map_id, map_name) {
    var tab_map_id = "map_tab_" + map_id;
    $("#input_map").before("<button type=\"button\" name=\"map_tab\" class=\"btn btn-primary\" id=\"" +
        tab_map_id + "\" onclick=\"setMap(\'" + map_id + "\')\">" +
        map_name + "</button></li>");
    setMap(map_id);
    $("#map_btn_" + map_id).prop('disabled', true).css('color', 'lightgray');
}

function closeMapTag() {
    $("#map_tab_" + Map_id).remove();
    $("#map_btn_" + Map_id).prop('disabled', false).css('color', 'black');
    deleteMapToCookie(Map_id);
    if (Map_id == "")
        return;
    if ($("button[name=map_tab]").length > 0) {
        var tab_map_id = $("button[name=map_tab]").eq(0).attr("id"); //"map_tab_" + map_id
        $("#" + tab_map_id).addClass("selected");
        setMap(tab_map_id.substring(8));
    } else { //reset
        resetCanvas_Anchor();
    }
}

function setMap(map_id) {
    var index = mapArray.findIndex(function (info) {
        return info.map_id == map_id;
    });
    if (index < 0)
        return;
    var map_url = "data:image/" + mapArray[index].map_file_ext + ";base64," + mapArray[index].map_file;
    var map_scale = typeof (mapArray[index].map_scale) != 'undefined' && mapArray[index].map_scale != "" ? mapArray[index].map_scale : 1;

    $("button[name=map_tab]").removeClass("selected");
    $("#map_tab_" + map_id).addClass("selected");

    addMapToCookie(map_id);

    serverImg.src = map_url; //"data:image/" + revInfo.file_ext + ";base64," + revInfo.map_file;
    serverImg.onload = function () {
        cvsBlock.style.background = "none";
        canvasImg.isPutImg = true;
        canvasImg.width = serverImg.width;
        canvasImg.height = serverImg.height;
        canvasImg.scale = map_scale;
        document.getElementById("scale_visible").innerText = map_scale;
        setCanvas(this.src, serverImg.width, serverImg.height);
        //canvas.style.position = "absolute"; //可以不設定
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        xleftView = 0;
        ytopView = 0;
        Zoom = zoomOriginal;
        ctx.save(); //紀錄原比例

        var serImgSize = serverImg.width / serverImg.height;
        var cvsBlock_width = parseFloat($("#cvsBlock").css("width"));
        var cvsBlock_height = parseFloat($("#cvsBlock").css("height"));
        var cvsSize = cvsBlock_width / cvsBlock_height;
        if (serImgSize > cvsSize) { //原圖比例寬邊較長
            fitZoom = cvsBlock_width / serverImg.width;
            setCanvas(this.src, cvsBlock_width, serverImg.height * fitZoom);
        } else {
            fitZoom = cvsBlock_height / serverImg.height;
            setCanvas(this.src, serverImg.width * fitZoom, cvsBlock_height);
        }

        //在設定好地圖後，導入Anchors & Groups & Tags' setting
        getAnchors(map_id);
        getMemberDate();
        Start();
    };
}

function addMapToCookie(map_id) {
    var cookie = Cookies.get("recent_map");
    var currentMaps = typeof (cookie) === 'undefined' ? [] : JSON.parse(cookie);
    //从cookie中还原数组
    if (typeof (currentMaps) !== 'object') {
        Cookies.set("recent_map", JSON.stringify([]));
        Cookies.set("select_map", "");
        currentMaps = [];
    }
    var repeat = currentMaps.indexOf(map_id);
    if (repeat == -1)
        currentMaps.push(map_id); //新增地圖id
    Cookies.set("recent_map", JSON.stringify(currentMaps));
    Cookies.set("select_map", map_id);
    //将数组转换为Json字符串保存在cookie中
}

function deleteMapToCookie(map_id) {
    var cookie = Cookies.get("recent_map");
    var currentMaps = typeof (cookie) === 'undefined' ? [] : JSON.parse(cookie);
    //从cookie中还原数组
    if (typeof (currentMaps) !== 'object') {
        Cookies.set("recent_map", JSON.stringify([]));
        Cookies.set("select_map", "");
        return;
    }
    var repeat = currentMaps.indexOf(map_id);
    if (repeat > -1)
        currentMaps.splice(repeat, 1); //刪除地圖id
    Cookies.set("recent_map", JSON.stringify(currentMaps));
    Cookies.set("select_map", "");
    //将数组转换为Json字符串保存在cookie中
}

function selectMapFromCookie() {
    var selectedMap = Cookies.get("select_map");
    var cookie = Cookies.get("recent_map");
    var recentMaps = typeof (cookie) === 'undefined' ? [] : JSON.parse(cookie);
    if (typeof (recentMaps) !== 'object') {
        Cookies.set("recent_map", JSON.stringify([]));
        Cookies.set("select_map", "");
        return;
    }
    for (i in recentMaps) {
        var index = mapArray.findIndex(function (info) {
            return info.map_id == recentMaps[i];
        });
        if (index > -1) {
            addMapTab(mapArray[index].map_id, mapArray[index].map_name);
        }
    }
    setMap(selectedMap);
}

function resetCanvas_Anchor() {
    cvsBlock.style.background = '#ccc';
    canvasImg.isPutImg = false;
    canvasImg.width = 0;
    canvasImg.height = 0;
    canvasImg.scale = 1;
    setCanvas("", 1, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    xleftView = 0;
    ytopView = 0;
    Zoom = zoomOriginal;
    anchorArray = [];
    document.getElementById('scale_visible').innerText = "";
    document.getElementById('x').value = "";
    document.getElementById('y').value = "";
    Stop();
}

function getAnchors(map_id) {
    Map_id = map_id;
    anchorArray = [];
    setSize();
    var request_anc = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetAnchorsInMap"],
        "Value": {
            "map_id": map_id
        }
    };
    var ancXmlHttp = createJsonXmlHttp("sql");
    ancXmlHttp.onreadystatechange = function () {
        if (ancXmlHttp.readyState == 4 || ancXmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            var anchorList = revObj.Values;
            if (revObj.success > 0) {
                var x, y;
                for (i in anchorList) {
                    x = anchorList[i].set_x / canvasImg.scale;
                    y = canvasImg.height - anchorList[i].set_y / canvasImg.scale; //因為Server回傳的座標為左下原點
                    anchorArray.push({
                        id: anchorList[i].anchor_id,
                        type: "",
                        x: x,
                        y: y
                    });
                    drawAnchor(ctx, anchorList[i].anchor_id, "", x, y); //畫出點的設定
                }
            }
        }
    };
    ancXmlHttp.send(JSON.stringify(request_anc));

    var request_main = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetMainAnchorsInMap"],
        "Value": {
            "map_id": map_id
        }
    };
    var mainXmlHttp = createJsonXmlHttp("sql");
    mainXmlHttp.onreadystatechange = function () {
        if (mainXmlHttp.readyState == 4 || mainXmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            var anchorList = revObj.Values;
            if (revObj.success > 0) {
                var x, y;
                for (i in anchorList) {
                    x = anchorList[i].set_x / canvasImg.scale;
                    y = canvasImg.height - anchorList[i].set_y / canvasImg.scale;
                    anchorArray.push({
                        id: anchorList[i].main_anchor_id,
                        type: "main",
                        x: x,
                        y: y
                    });
                    drawAnchor(ctx, anchorList[i].main_anchor_id, "main", x, y);
                }
            }
        }
    };
    mainXmlHttp.send(JSON.stringify(request_main));
}

function getGroups(anchorList) {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetGroup_Anchors"]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            var anchor_groups = revObj.Values;
            if (revObj.success > 0) {
                inputGroups(anchor_groups, anchorList); //函式在dialog_anchor_group.js內
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function getGroupList(anchorList) {
    var requestArray = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetGroups"]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            var anchor_group_list = revObj.Values;
            if (revObj.success > 0) {
                inputGroupList(anchor_group_list, anchorList); //函式在dialog_anchor_group.js內
                var GroupArray = [];
                for (i in anchor_group_list)
                    GroupArray.push(anchor_group_list[i].group_id);
                getMapGroup(GroupArray);
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function getMapGroup(groupArray) {
    var requestArray = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps_Groups"]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            var map_group_list = revObj.Values;
            if (revObj.success > 0) {
                var map_infos = [];
                for (i in mapArray)
                    map_infos.push(mapArray[i].map_id);
                inputMapGroupList(map_group_list, map_infos, groupArray);
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function getMemberDate() {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetStaffs"]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (revObj.success > 0) {
                //member_data => tag_id number Name department jobTitle type color
                memberArray = 'Values' in revObj == true ? revObj.Values.slice(0) : [];
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function getMemberPhone(img_id, number) {
    var pictureBox = $("#" + img_id);
    pictureBox.attr('src', ""); //reset
    if (number == "")
        return;
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetOneStaff"],
        "Value": {
            "number": number
        }
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (revObj.success > 0 && "Values" in revObj) {
                var revInfo = revObj.Values[0];
                if (revInfo.file_ext != "" && revInfo.photo != "") {
                    var src = "data:image/" + revInfo.file_ext + ";base64," + revInfo.photo;
                    pictureBox.attr('src', src);
                }
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function setCanvas(img_src, width, height) {
    canvas.style.backgroundImage = "url(" + img_src + ")";
    canvas.style.backgroundSize = width + "px " + height + "px";
    canvas.width = width * PIXEL_RATIO;
    canvas.height = height * PIXEL_RATIO;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

function setSize() {
    //縮放canvas與背景圖大小
    if (canvasImg.isPutImg) {
        canvas.style.backgroundSize = (canvasImg.width * fitZoom * Zoom) + "px " + (canvasImg.height * fitZoom * Zoom) + "px";
        canvas.width = canvasImg.width * fitZoom * PIXEL_RATIO * Zoom;
        canvas.height = canvasImg.height * fitZoom * PIXEL_RATIO * Zoom;
        canvas.style.width = canvasImg.width * fitZoom * Zoom + 'px';
        canvas.style.height = canvasImg.height * fitZoom * Zoom + 'px';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(PIXEL_RATIO * fitZoom, 0, 0, PIXEL_RATIO * fitZoom, 0, 0);
        ctx.scale(Zoom, Zoom);
        ctx.translate(0, 0);
    }
}

function restoreCanvas() {
    if (!canvasImg.isPutImg)
        return;
    var cvsBlock_width = parseFloat($("#cvsBlock").css("width"));
    var cvsBlock_height = parseFloat($("#cvsBlock").css("height"));
    xleftView = 0;
    ytopView = 0;
    Zoom = zoomOriginal;
    if (isFitWindow) { //恢復原比例
        fitZoom = 1;
        ctx.restore();
        ctx.save();
        isFitWindow = false; //目前狀態:原比例
        document.getElementById("label_restore").innerHTML = "<i class=\"fas fa-expand\" style='font-size:20px;'" +
            " title=\"" + $.i18n.prop('i_fit_window') + "\"></i>";
    } else { //依比例拉伸(Fit in Window)
        if ((serverImg.width / serverImg.height) > (cvsBlock_width / cvsBlock_height)) //原圖比例寬邊較長
            fitZoom = cvsBlock_width / serverImg.width;
        else
            fitZoom = cvsBlock_height / serverImg.height;
        isFitWindow = true; //目前狀態:依比例拉伸
        document.getElementById("label_restore").innerHTML = "<i class=\"fas fa-compress\" style='font-size:20px;'" +
            " title=\"" + $.i18n.prop('i_restore_scale') + "\"></i>";
    }
    $(function () {
        $("#canvas").css("margin-left", 0 + "px").css("margin-top", 0 + "px");
        draw();
    });
}

function handleMouseWheel(event) {
    var targetX = lastX; //滑鼠目前在canvas中的位置(x坐標)
    var targetY = lastY; //滑鼠目前在canvas中的位置(y坐標)
    var scale = (event.wheelDelta < 0 || event.detail > 0) ? 0.9 : 1.1;
    Zoom *= scale; //縮放比例
    //xleftView: X軸位移(負值向左，正值向右);
    //ytopView: Y軸位移(負值向上，正值向下)
    //var x = targetX + xleftView;  // View coordinates
    //var y = targetY + ytopView;
    var loc = getPointOnCanvas(event.pageX, event.pageY);
    $(function () {
        var canvas_left = parseFloat($("#canvas").css("margin-left")); //canvas目前相對於div的位置(x坐標)
        var canvas_top = parseFloat($("#canvas").css("margin-top")); //canvas目前相對於div的位置(y坐標)
        xleftView = targetX / scale - targetX; //得出最終偏移量X
        ytopView = targetY / scale - targetY; //得出最終偏移量Y
        // scale about center of view, rather than mouse position. This is different than dblclick behavior.
        //xleftView = x - targetX;
        //ytopView = y - targetY;
        var end_x = canvas_left + xleftView; //* scale;
        var end_y = canvas_top + ytopView; //* scale;
        //end_x -= center.x * Zoom;//xleftView;
        //end_y -= center.y * Zoom;//ytopView;
        $("#canvas").css("margin-left", end_x + "px").css("margin-top", end_y + "px");
        draw();
    });
}


function handleDblClick(event) {
    var targetX = lastX; //滑鼠目前在canvas中的位置(x坐標)
    var targetY = lastY; //滑鼠目前在canvas中的位置(y坐標)
    var scale = event.shiftKey == 1 ? 0.5 : 1.5; // shrink (1.5) if shift key pressed
    Zoom *= scale; //縮放比例
    $(function () {
        var canvas_left = parseFloat($("#canvas").css("margin-left")); //canvas目前相對於div的位置(x坐標)
        var canvas_top = parseFloat($("#canvas").css("margin-top")); //canvas目前相對於div的位置(y坐標)
        xleftView = (targetX / scale - targetX); //得出最終偏移量X
        ytopView = (targetY / scale - targetY); //得出最終偏移量Y
        var end_x = canvas_left + xleftView;
        var end_y = canvas_top + ytopView;
        $("#canvas").css("margin-left", end_x + "px").css("margin-top", end_y + "px");
        draw();
    });
}

function getEventPosition(ev) { //獲取滑鼠點擊位置
    var x, y;
    if (ev.layerX || ev.layerX == 0) {
        x = ev.layerX;
        y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        x = ev.offsetX;
        y = ev.offsetY;
    }
    return {
        x: x,
        y: y
    }; //注：如果使用此方法無效的話，需要給Canvas元素的position設為absolute。
}

function clickEvent(p) { //滑鼠點擊事件
    tagArray.forEach(function (v, i) {
        drawInvisiblePoints(ctx, v.id, v.x, v.y, 5);
        if (p && ctx.isPointInPath(p.x, p.y)) {
            //如果傳入了事件坐標，就用isPointInPath判斷一下
            $(function () {
                $("#member_dialog_tag_id").text(parseInt(v.id.substring(8), 16));
                $("#member_dialog_number").text(v.number);
                $("#member_dialog_name").text(v.name);
                getMemberPhone("member_dialog_image", v.number);
                $("#member_dialog").dialog("open");
            });
        }
    });
    alarmArray.forEach(function (v) {
        drawInvisiblePoints(ctx, v.id, v.x, v.y, 7);
        if (p && ctx.isPointInPath(p.x, p.y)) {
            //如果傳入了事件坐標，就用isPointInPath判斷一下
            $(function () {
                var color = "",
                    status = "";
                switch (v.status) {
                    case "low_power":
                        color = "#72ac1b";
                        status = $.i18n.prop('i_lowPowerAlarm');
                        break;
                    case "help":
                        color = "#ff8484";
                        status = $.i18n.prop('i_helpAlarm');
                        break;
                    case "still":
                        color = "#FF6600";
                        status = $.i18n.prop('i_stillAlarm');
                        break;
                    case "active":
                        color = "#FF6600";
                        status = $.i18n.prop('i_activeAlarm');
                        break;
                    default:
                        color = "#FFFFFF"; //unknown
                        status = "";
                }
                var member_index = memberArray.findIndex(function (info) {
                    return info.tag_id == v.id;
                });
                var number = member_index > -1 ? memberArray[member_index].number : "";
                var name = member_index > -1 ? memberArray[member_index].Name : "";
                var time_arr = TimeToArray(v.time);
                $("#alarm_dialog").css('background-color', color);
                getMemberPhone("alarm_dialog_image", number);
                $("#alarm_dialog_number").text(number);
                $("#alarm_dialog_name").text(name);
                $("#alarm_dialog_id").text(parseInt(v.id.substring(8), 16));
                $("#alarm_dialog_date").text(time_arr.date);
                $("#alarm_dialog_time").text(time_arr.time);
                $("#alarm_dialog_status").text(status);
                $("#alarm_dialog_btn_unlock").unbind();
                $("#alarm_dialog_btn_unlock").click(function () {
                    releaseFocusAlarm(v.order);
                    $("#alarm_dialog").dialog("close");
                });
                $("#alarm_dialog_btn_focus").unbind();
                $("#alarm_dialog_btn_focus").click(function () {
                    changeFocusAlarm(v.order);
                });
                $("#alarm_dialog").dialog("open");
            });
        }
    });
}

function handleMouseClick(event) {
    var p = getEventPosition(event);
    clickEvent(p);
}

function handleMouseMove(event) {
    //滑鼠移動事件
    var x = event.pageX;
    var y = event.pageY;
    var loc = getPointOnCanvas(x, y);
    if (canvasImg.isPutImg) {
        lastX = loc.x;
        lastY = loc.y;
        document.getElementById('x').value = (lastX / Zoom / fitZoom * canvasImg.scale).toFixed(2);
        document.getElementById('y').value = (lastY / Zoom / fitZoom * canvasImg.scale).toFixed(2);
        //console.log("x : " + (lastX).toFixed(2) + ", y : " + (lastY).toFixed(2));
    }
}

function getPointOnCanvas(x, y) {
    //獲取滑鼠在Canvas物件上座標(座標起始點從左上換到左下)
    var BCR = canvas.getBoundingClientRect();
    var width = canvas.width;
    var height = canvas.height;
    return {
        x: x - BCR.left * (width / BCR.width),
        y: height - (y - BCR.top * (height / BCR.height))
    };
}

/******************傳送要求到Server端************************/


/*------------------------------------*/
/*            接收並處理Alarm           */
/*------------------------------------*/



function updateAlarmList() {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetAlarmTop50List"]
    };
    var xmlHttp = createJsonXmlHttp("request");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!revObj)
                return false;

            if (revObj.length > alarm_count) {
                alarm_count = revObj.length;
                isFocus = true; //happen new alarm
                changeAlarmLight();
                alarmFilterArr = [];
                var list = "";
                var items = 0;
                for (var i = 0; i < revObj.length; i++) {
                    var member_index = memberArray.findIndex(function (info) {
                        return info.tag_id == revObj[i].tag_id;
                    });
                    var number = member_index > -1 ? memberArray[member_index].number : "";
                    var name = member_index > -1 ? memberArray[member_index].Name : "";
                    list += "<tr><td>" + (i + 1) +
                        "</td><td>" + number +
                        "</td><td>" + name +
                        "</td><td>" + parseInt(revObj[i].tag_id.substring(8), 16) +
                        "</td><td>" + revObj[i].tag_alarm_type +
                        "</td><td>" + revObj[i].tag_time +
                        "</td></tr>";
                    var repeat = alarmFilterArr.findIndex(function (info) {
                        return info.id == revObj[i].tag_id;
                    });
                    if (repeat > -1 && alarmFilterArr[repeat].alarm_type == revObj[i].tag_alarm_type)
                        alarmFilterArr.splice(repeat, 1);
                    items++;
                    alarmFilterArr.push({
                        order: items,
                        id: revObj[i].tag_id,
                        alarm_type: revObj[i].tag_alarm_type,
                        time: revObj[i].tag_time
                    });
                }
                $("#table_rightbar_alarm_list tbody").html(list);

                /*
                 * Alarm Card
                 */
                $(".thumbnail_columns").empty();
                alarmFilterArr.forEach(function (element, i) {
                    var time_arr = TimeToArray(element.time);
                    var thumb_id = "alarmCard_" + i;
                    var thumb_img = "alarmCard_img_" + i;
                    var thumb_unlock_btn_id = "alarmCard_unlock_btn_" + i;
                    var thumb_focus_btn_id = "alarmCard_focus_btn_" + i;
                    var color = "",
                        status = "";
                    switch (element.alarm_type) {
                        case "low_power":
                            color = "#72ac1b";
                            status = $.i18n.prop('i_lowPowerAlarm');
                            break;
                        case "help":
                            color = "#ff8484";
                            status = $.i18n.prop('i_helpAlarm');
                            break;
                        case "still":
                            color = "#FF6600";
                            status = $.i18n.prop('i_stillAlarm');
                            break;
                        case "active":
                            color = "#FF6600";
                            status = $.i18n.prop('i_activeAlarm');
                            break;
                        default:
                            color = "#FFFFFF"; //unknown
                            status = "";
                    }
                    var member_index = memberArray.findIndex(function (info) {
                        return info.tag_id == element.id;
                    });
                    var number = member_index > -1 ? memberArray[member_index].number : "";
                    var name = member_index > -1 ? memberArray[member_index].Name : "";
                    $(".thumbnail_columns").append("<div class=\"thumbnail\" id=\"" + thumb_id + "\"" +
                        "style=\"background:" + color + "\">" +
                        "<table><tr><td>" +
                        "<img id=\"" + thumb_img + "\" class=\"member_photo\" src=\"\">" +
                        "</td><td>" +
                        "<label>" + $.i18n.prop('i_number') + " : " + number + "</label><br>" +
                        "<label>" + $.i18n.prop('i_name') + " : " + name + "</label><br>" +
                        "<label>" + $.i18n.prop('i_userID') + " : " + parseInt(element.id.substring(8), 16) + "</label><br>" +
                        "<label>" + $.i18n.prop('i_date') + " : " + time_arr.date + "</label><br>" +
                        "<label>" + $.i18n.prop('i_time') + " : " + time_arr.time + "</label>" +
                        "</td></tr></table>" +
                        "<label style=\"margin-left:10px; color:white;\">" + $.i18n.prop('i_status') + " : " + status + "</label>" +
                        "<br><div style=\"text-align:center; margin:5px;\">" +
                        "<button type=\"button\" class=\"btn btn-primary\"" +
                        " id=\"" + thumb_unlock_btn_id + "\">" + $.i18n.prop('i_releasePosition') + "</button>" +
                        "<button type=\"button\" class=\"btn btn-primary\" style=\"margin-left: 10px;\"" +
                        " id=\"" + thumb_focus_btn_id + "\">" + $.i18n.prop('i_position') +
                        " <i class=\"fas fa-map-marker-alt\"></i></button>" +
                        "</div></div>");
                    getMemberPhone(thumb_img, number);
                    $("#" + thumb_unlock_btn_id).click(function () {
                        releaseFocusAlarm(element.order);
                        $("#" + thumb_id).hide(); //警告卡片會消失
                        changeAlarmLight();
                    });
                    $("#" + thumb_focus_btn_id).click(function () {
                        changeFocusAlarm(element.order);
                        changeAlarmLight();
                    });


                    /*
                     *  Alarm Dialog
                     */
                    $("#alarm_dialog").css('background-color', color);
                    getMemberPhone("alarm_dialog_image", number);
                    $("#alarm_dialog_number").text(number);
                    $("#alarm_dialog_name").text(name);
                    $("#alarm_dialog_id").text(parseInt(element.id.substring(8), 16));
                    $("#alarm_dialog_date").text(time_arr.date);
                    $("#alarm_dialog_time").text(time_arr.time);
                    $("#alarm_dialog_status").text(status);
                    $("#alarm_dialog_btn_unlock").unbind();
                    $("#alarm_dialog_btn_unlock").click(function () {
                        unlockFocusAlarm();
                        //releaseFocusAlarm(element.order);
                        $("#alarm_dialog").dialog("close");
                    });
                    $("#alarm_dialog_btn_focus").unbind();
                    $("#alarm_dialog_btn_focus").click(function () {
                        changeFocusAlarm(element.order);
                    });
                    $("#alarm_dialog").dialog("open");
                });
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function TimeToArray(time_str) {
    if (time_str.length > 0) {
        var break_index = time_str.lastIndexOf(" ");
        return {
            date: time_str.substring(0, break_index),
            time: time_str.substring(break_index + 1, time_str.length)
        };
    }
}

function changeAlarmLight() {
    $(function () {
        if (alarmID_array.length > 0) {
            $("#alarmSideBar_icon").css("color", "red");
        } else {
            $("#alarmSideBar_icon").css("color", "white");
        }
    });
}

function updateTagList() {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetTagList"],
        "Value": {
            "Map_id": Map_id
        }
    };
    var xmlHttp = createJsonXmlHttp("requestTagList_json");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!revObj)
                return false;
            if (canvasImg.isPutImg) {
                var tbody = $("#table_rightbar_member_list tbody");
                tbody.empty();
                tagArray = [];
                for (var i = 0; i < revObj.length; i++) {
                    var member_index = memberArray.findIndex(function (info) {
                        return info.tag_id == revObj[i].tag_id;
                    });
                    var number = member_index > -1 ? memberArray[member_index].number : "";
                    var name = member_index > -1 ? memberArray[member_index].Name : "";
                    var color = member_index > -1 ? memberArray[member_index].color : "";

                    //update tag array
                    tagArray.push({
                        id: revObj[i].tag_id,
                        x: revObj[i].tag_x / canvasImg.scale, //* fitZoom * Zoom,
                        y: canvasImg.height - revObj[i].tag_y / canvasImg.scale, //* fitZoom * Zoom,
                        system_time: revObj[i].tag_time,
                        color: color,
                        number: number,
                        name: name
                    });

                    //update member list
                    tbody.append("<tr><td>" + (i + 1) +
                        "</td><td>" + parseInt(revObj[i].tag_id.substring(8), 16) +
                        "</td><td>" + number +
                        "</td><td>" + name +
                        "</td></tr>");
                }
                tableFilter("table_filter_member", "table_rightbar_member_list");

                //定時比對tagArray更新alarmArray
                alarmArray = []; //每次更新都必須重置alarmArray
                if (alarmFilterArr.length > 0) {
                    for (var j = 0; j < alarmFilterArr.length; j++) {
                        var alarmIndex = tagArray.findIndex(function (tags) {
                            return tags.id == alarmFilterArr[j].id; // 比對Alarm與Tag的ID
                        });
                        if (alarmIndex > -1) {
                            alarmArray.push({ //依序將Tag資料放入AlarmArray中
                                order: alarmFilterArr[j].order,
                                id: tagArray[alarmIndex].id,
                                x: tagArray[alarmIndex].x,
                                y: tagArray[alarmIndex].y,
                                status: alarmFilterArr[j].alarm_type,
                                time: alarmFilterArr[j].time
                            });
                        }
                    }
                }
            }
        }
    };
    xmlHttp.send(request);
}

function focusAlarmTag(x, y) {
    if (isFocus) {
        //var cvsWidth_helf = canvas.width / 2;
        //var cvsHeight_helf = canvas.height / 2; //以後應該以延展版的地圖為基準(可能還要乘上延展倍率)
        var cvsBlock_width = parseFloat($("#cvsBlock").css("width"));
        var cvsBlock_height = parseFloat($("#cvsBlock").css("height"));
        Zoom = 2.0;
        var end_x = cvsBlock_width / 2 - parseFloat(x) * Zoom;
        var end_y = cvsBlock_height / 2 - parseFloat(y) * Zoom;
        $("#canvas").css("margin-left", end_x + "px").css("margin-top", end_y + "px");
    }
}

function changeFocusAlarm(alarm_order) { //改變鎖定定位的Alarm目標
    isFocus = true;
    var index = alarmFilterArr.findIndex(function (info) { //抓取指定AlarmTag的位置
        return info.order == alarm_order;
    });
    var temp = alarmFilterArr[index];
    alarmFilterArr.splice(index, 1);
    alarmFilterArr.push(temp);
}

function releaseFocusAlarm(alarm_order) { //解除指定的alarm
    var index = alarmFilterArr.findIndex(function (info) {
        return info.order == alarm_order;
    });
    alarmFilterArr.splice(index, 1);
}

function unlockFocusAlarm() { //解除定位
    isFocus = false;
    //恢復原比例
    xleftView = 0;
    ytopView = 0;
    Zoom = zoomOriginal;
    fitZoom = 1;
    ctx.restore();
    ctx.save();
    isFitWindow = false;
    $(function () {
        $("#canvas").css("margin-left", 0 + "px").css("margin-top", 0 + "px");
    });
    setSize();
}

function draw() {
    setSize();
    anchorArray.forEach(function (v) {
        drawAnchor(ctx, v.id, v.type, v.x, v.y);
    });
    tagArray.forEach(function (v) {
        drawTags(ctx, v.id, v.x, v.y, v.color);
    });
    alarmArray.forEach(function (v) {
        drawAlarmTags(ctx, v.id, v.x, v.y, v.status);
    });
    if (alarmArray.length > 0) {
        var last = alarmArray.length - 1;
        focusAlarmTag(alarmArray[last].x, alarmArray[last].y);
    } else {
        isFocus = false;
    }
}


function autoSendRequest() {
    updateAlarmList();
    updateTagList();
    draw();
}

function Start() {
    if (canvasImg.isPutImg) {
        //設定計時器
        var delaytime = 100;
        clearInterval(pageTimer["timer1"]);
        pageTimer["timer1"] = setInterval("autoSendRequest()", delaytime);
    }
}

function Stop() {
    for (var each in pageTimer) {
        clearInterval(pageTimer[each]);
    }
}