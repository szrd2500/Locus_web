var map_id = "",
    mapArray = [],
    anchorGroupArray = [],
    groupArray = [],
    fenceArray = [],
    fenceDotArray = [],
    addFenceDotArray = [],
    addFenceContainGroup = [],
    pageTimer = {}, //定義計時器全域變數
    PIXEL_RATIO, // 獲取瀏覽器像素比
    cvsBlock, canvas, ctx,
    canvasImg = {
        isPutImg: false,
        width: 0,
        height: 0,
        scale: 1
    }, //預設比例尺為1:1
    lastX = 0, //滑鼠最後位置的X座標
    lastY = 0, //滑鼠最後位置的Y座標
    mouseDown = false,
    // View parameters
    xleftView = 0,
    ytopView = 0,
    Zoom = 1.0, //actual width and height of zoomed and panned display
    fitZoom = 1,
    isFitWindow = true,
    isPosition = false,
    serverImg = new Image();

function setupCanvas() {
    cvsBlock = document.getElementById("mapBlock");
    canvas = document.getElementById("canvas_map");
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
    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("mousewheel", handleMouseWheel, false);
    cvsBlock.addEventListener("mousewheel", handleMouseWheel, false); // mousewheel duplicates dblclick function
    cvsBlock.addEventListener("DOMMouseScroll", handleMouseWheel, false); // for Firefox  

    $("#menu_fence_info").on('click', function () {
        resetBlockDisplay();
        $("#label_fence_info").addClass("opened");
        $("#block_fence_info").show();
    });
    $("#menu_fence_alarm_group").on('click', function () {
        resetBlockDisplay();
        $("#label_fence_alarm_group").addClass("opened");
        $("#block_fence_alarm_group").show();
    });
    $("#menu_fence_info").click();
    $("#menu_resize").on('click', resizeCanvas);
    $("#select_map").on('change', function () {
        setMapById($(this).val());
    });
    $("#btn_fence_dot_position").on('click', startFencePosition);
    loadMaps();
}

function resetBlockDisplay() {
    $("#block_fence_info").hide();
    $("#block_fence_alarm_group").hide();
    $(".btn-sidebar").removeClass("opened");
}

function loadMaps() {
    var requestArray = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps"],
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!checkTokenAlive(revObj)) {
                return;
            } else if (revObj.Value[0].success > 0) {
                var revInfo = revObj.Value[0].Values || [];
                mapArray = [];
                $("#select_map").empty();
                revInfo.forEach(function (v) {
                    mapArray.push({
                        id: v.map_id,
                        name: v.map_name,
                        file: v.map_file,
                        file_ext: v.map_file_ext,
                        scale: v.map_scale
                    });
                    $("#select_map").append("<li><input type=\"button\" id=\"map_btn_" + v.map_id + "\" " +
                        "value=\"" + v.map_name + "\" onclick=\"setMapById(\'" + v.map_id + "\')\"></li>");
                });
            } else {
                alert($.i18n.prop('i_mapAlert_18'));
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function setMapById(id) { //選擇地圖(下拉選單)後，依據map_id抓取對應資訊
    map_id = id;
    var index = mapArray.findIndex(function (map_info) {
        return map_info.id == id;
    });
    if (index > -1) {
        var dataUrl = "data:image/" + mapArray[index].file_ext + ";base64," + mapArray[index].file;
        setMap(dataUrl, mapArray[index].scale);
        $("#select_map_id").val(mapArray[index].id);
        $("#select_map_name").val(mapArray[index].name);
    } else {
        resetCanvas();
        $("#select_map_id").val('');
        $("#select_map_name").val('');
    }
}

function setMap(map_url, map_scale) {
    map_scale = typeof (map_scale) != 'undefined' && map_scale != "" ? map_scale : 1;
    serverImg.src = map_url;
    serverImg.onload = function () {
        cvsBlock.style.background = "none";
        canvasImg.isPutImg = true;
        canvasImg.width = serverImg.width;
        canvasImg.height = serverImg.height;
        canvasImg.scale = map_scale;
        setCanvas(this.src, serverImg.width, serverImg.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        xleftView = 0;
        ytopView = 0;
        Zoom = 1.0;
        ctx.save(); //紀錄原比例

        var serImgSize = serverImg.width / serverImg.height,
            cvs_width = parseFloat($("#mapBlock").css("width")) - 2,
            cvs_height = parseFloat($("#mapBlock").css("height")) - 7,
            cvsSize = cvs_width / cvs_height;
        if (serImgSize > cvsSize) { //原圖比例寬邊較長
            Zoom = cvs_width / serverImg.width;
            setCanvas(this.src, cvs_width, serverImg.height * Zoom);
        } else {
            Zoom = cvs_height / serverImg.height;
            setCanvas(this.src, serverImg.width * Zoom, cvs_height);
        }
        getGroups();
        updateFenceTable();
    };
}

function getFileName(src) {
    var pos1 = src.lastIndexOf("\\"),
        pos2 = src.lastIndexOf("/"),
        pos = -1;
    if (pos1 < 0) pos = pos2;
    else pos = pos1;
    return src.substring(pos + 1);
}

function resetCanvas() {
    cvsBlock.style.background = '#ccc';
    canvasImg.isPutImg = false;
    canvasImg.width = 0;
    canvasImg.height = 0;
    canvasImg.scale = 1;
    setCanvas("", 1, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    xleftView = 0;
    ytopView = 0;
    Zoom = 1.0;
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
        canvas.style.backgroundSize = (canvasImg.width * Zoom) + "px " + (canvasImg.height * Zoom) + "px";
        canvas.width = canvasImg.width * PIXEL_RATIO * Zoom;
        canvas.height = canvasImg.height * PIXEL_RATIO * Zoom;
        canvas.style.width = canvasImg.width * Zoom + 'px';
        canvas.style.height = canvasImg.height * Zoom + 'px';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
        ctx.scale(Zoom, Zoom);
        ctx.translate(0, 0);
    }
}

function resizeCanvas() {
    if (map_id == '') {
        alert($.i18n.prop('i_alarmAlert_29'));
        return;
    }
    xleftView = 0;
    ytopView = 0;
    Zoom = 1.0;
    if (isFitWindow) { //恢復原比例
        isFitWindow = false; //目前狀態:原比例 
        ctx.restore();
        ctx.save();
        document.getElementById("label_resize").innerHTML = "<i class=\"fas fa-compress\"></i>";
        document.getElementById("label_resize").title = $.i18n.prop('i_fit_window');
    } else { //依比例拉伸(Fit in Window)
        isFitWindow = true; //目前狀態:依比例拉伸
        var cvs_width = parseFloat($("#mapBlock").css("width")) - 2,
            cvs_height = parseFloat($("#mapBlock").css("height")) - 7;
        if ((serverImg.width / serverImg.height) > (cvs_width / cvs_height)) //原圖比例寬邊較長
            Zoom = cvs_width / serverImg.width;
        else
            Zoom = cvs_height / serverImg.height;
        document.getElementById("label_resize").innerHTML = "<i class=\"fas fa-expand\"></i>";
        document.getElementById("label_resize").title = $.i18n.prop('i_restore_scale');
    }
    draw();
}

function handleMouseWheel(event) {
    event.preventDefault();
    var scale = 1.0;
    if (event.wheelDelta < 0 || event.detail > 0) {
        if (Zoom > 0.1)
            scale = 0.9;
    } else {
        scale = 1.1;
    }
    Zoom *= scale; //縮放比例
    draw();
}

function handleMouseMove(event) { //滑鼠移動事件
    if (canvasImg.isPutImg) {
        getPointOnCanvas(event.clientX, event.clientY);
    }
}

function getPointOnCanvas(x, y) {
    var BCR = canvas.getBoundingClientRect(),
        pos_x = (x - BCR.left) / Zoom,
        pos_y = (y - BCR.top) / Zoom;
    lastX = pos_x;
    lastY = canvasImg.height - pos_y;
    document.getElementById('x').innerText = lastX > 0 ? (lastX).toFixed(2) : 0;
    document.getElementById('y').innerText = lastY > 0 ? (lastY).toFixed(2) : 0;
    return {
        x: pos_x,
        y: pos_y
    }
}

function updateFenceTable() {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetFencesInMap"],
        "Value": {
            "map_id": map_id
        },
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!checkTokenAlive(revObj)) {
                return;
            } else if (revObj.Value[0].success > 0) {
                fenceArray = "Values" in revObj.Value[0] ? revObj.Value[0].Values.slice(0) : [];
                $("#table_fence_setting tbody").empty();
                fenceDotArray = [];
                for (i = 0; i < fenceArray.length; i++) {
                    var tr_id = "tr_fence_setting_" + (i + 1);
                    $("#table_fence_setting tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                        "<input type=\"checkbox\" name=\"chkbox_fence_setting\" value=\"" + fenceArray[i].fence_id + "\"" +
                        " onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + (i + 1) + "</td>" +
                        "<td name=\"fence_id\">" + fenceArray[i].fence_id + "</td>" +
                        "<td name=\"fence_name\">" + fenceArray[i].fence_name + "</td>" +
                        "<td><label for=\"btn_edit_fence_" + i + "\" class='btn-edit' title='" + $.i18n.prop('i_editFence') + "'>" +
                        "<i class='fas fa-edit' style='font-size:18px;'></i></label><input id=\"btn_edit_fence_" + i + "\"" +
                        " type='button' class='btn-hidden' onclick=\"FenceFunc.edit(\'" + fenceArray[i].fence_id + "\');\" />" +
                        "</td></tr>");
                    getFencePointArray(fenceArray[i].fence_id);
                    getFences();
                }
            } else {
                alert($.i18n.prop('i_alarmAlert_30'));
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function getFencePointArray(fence_id) {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetFence_point"],
        "Value": {
            "fence_id": fence_id
        },
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!checkTokenAlive(revObj)) {
                return;
            } else if (revObj.Value[0].success > 0) {
                var arr = revObj.Value[0].Values || [];
                for (i = 0; i < arr.length; i++)
                    fenceDotArray.push(arr[i]);
                draw();
            } else {
                alert($.i18n.prop('i_alarmAlert_30'));
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function updateFenceDotsArr() {
    $("#table_fence_dot_setting tbody").empty();
    for (j = 0; j < addFenceDotArray.length; j++) {
        var tr_id = "tr_fence_dot_setting_" + (j + 1);
        $("#table_fence_dot_setting tbody").append("<tr id=\"" + tr_id + "\"><td>" +
            "<input type=\"checkbox\" name=\"chkbox_fence_dot_setting\" value=\"" + j +
            "\" onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + (j + 1) + "</td>" +
            "<td><label name=\"dot_x\">" + addFenceDotArray[j].x + "</label></td>" +
            "<td><label name=\"dot_y\">" + addFenceDotArray[j].y + "</label></td></tr>");
    }
}

function getFences() {
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!checkTokenAlive(revObj))
                return;
            else if (revObj.Value[0].success > 0)
                fenceArray = "Values" in revObj.Value[0] ? revObj.Value[0].Values.slice(0) : [];
            else
                alert($.i18n.prop('i_alarmAlert_30'));
        }
    };
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["GetFence_info_ALL"],
        "api_token": [token]
    }));
}

function getGroups() {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps_Groups"],
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!checkTokenAlive(revObj)) {
                return;
            } else if (revObj.Value[0].success > 0) {
                var mapGroups = revObj.Value[0].Values || [];
                groupArray = [];
                mapGroups.forEach(function (element) {
                    if (element.map_id == map_id)
                        groupArray.push(element.group_id);
                });
                getAnchor_Group();
            } else {
                alert($.i18n.prop('i_alarmAlert_31'));
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function getAnchor_Group() {
    var request = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetAnchorsInMap"],
        "Value": {
            "map_id": map_id
        },
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (!checkTokenAlive(revObj)) {
                return;
            } else if (revObj.Value[0].success > 0) {
                anchorGroupArray = "Values" in revObj.Value[0] ? revObj.Value[0].Values.slice(0) : [];
                draw();
            } else {
                alert($.i18n.prop('i_alarmAlert_31'));
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function draw() {
    setSize();
    drawAnchor_Group();
    drawFences();
    drawSettingFence();
    inputFenceGroup();
}

function drawAnchor_Group() {
    groupArray.forEach(function (group_id) {
        var group = new Group(),
            group_pos_arr = [],
            containDots = 0,
            containPolygon = 0,
            group_name = "";
        anchorGroupArray.forEach(function (element) {
            if (element.group_id == group_id) {
                group_name = element.group_name;
                var point = {
                        x: element.set_x,
                        y: element.set_y
                    },
                    x = parseFloat(element.set_x),
                    y = canvasImg.height - parseFloat(element.set_y);
                group.setAnchor(element.anchor_id, x, y);
                if (addFenceDotArray.length >= 3)
                    containDots += checkInside(point, addFenceDotArray) == true ? 1 : 0;
                group_pos_arr.push(point);
            }
        });
        containPolygon += checkPP(group_pos_arr, addFenceDotArray) == true ? 1 : 0;
        if (containDots > 0 || containPolygon > 0) {
            //console.log("contain groups : " + group_id);
            var repeat = addFenceContainGroup.findIndex(function (groupInfo) {
                return groupInfo.g_id == group_id;
            });
            if (repeat == -1)
                addFenceContainGroup.push({
                    g_id: group_id,
                    g_name: group_name
                });
        }
        group.drawGroup();
    });
    /*anchorArray.forEach(function (v) {
        drawAnchor(ctx, v.id, v.type, point.x, point.y, 1/Zoom);
    });*/
}

function drawFences() {
    fenceArray.forEach(function (fence_info) {
        var fence = new Fence(),
            count = 0;
        fenceDotArray.forEach(function (dot_info) {
            if (dot_info.fence_id == fence_info.fence_id) {
                fence.setFenceDot(
                    fence_info.fence_name,
                    parseFloat(dot_info.point_x),
                    canvasImg.height - parseFloat(dot_info.point_y)
                );
                count++;
            }
        });
        if (count > 0)
            fence.drawFence();
    });
}

function drawSettingFence() {
    var s_fence = new SettingFence();
    addFenceDotArray.forEach(function (dot_info) {
        s_fence.setFenceDot(
            parseFloat(dot_info.x),
            canvasImg.height - parseFloat(dot_info.y)
        );
        var point = {
            x: dot_info.x,
            y: dot_info.y
        };
        groupArray.forEach(function (group_id) {
            var containDots = 0,
                polygon = [],
                group_name = "";
            anchorGroupArray.forEach(function (element) {
                if (element.group_id == group_id) {
                    group_name = element.group_name;
                    polygon.push({
                        x: element.set_x,
                        y: element.set_y
                    });
                    if (polygon.length >= 3)
                        containDots += checkInside(point, polygon) == true ? 1 : 0;
                }
            });
            if (containDots > 0) {
                //console.log("contain groups : " + group_id);
                var repeat = addFenceContainGroup.findIndex(function (groupInfo) {
                    return groupInfo.g_id == group_id;
                });
                if (repeat == -1)
                    addFenceContainGroup.push({
                        g_id: group_id,
                        g_name: group_name
                    });
            }
        });
    });
    s_fence.drawFence();
    s_fence.drawFenceDots();
}

function drawDotPosition(dctx, x, y, zoom) {
    dctx.fillStyle = '#99cc00';
    dctx.beginPath();
    dctx.arc(x, y, 4 * zoom, 0, Math.PI * 2, true);
    dctx.fill();
}

function startFencePosition() {
    if (!isPosition) {
        isPosition = true;
        document.getElementById("label_fence_dot_position").innerHTML = "<i class='fas fa-map-marked' style='font-size:20px;'></i>";
        document.getElementById("label_fence_dot_position").title = $.i18n.prop('i_stopFencePointPos');
        var delaytime = 100; //0.1s
        pageTimer["timer1"] = setTimeout(function request() {
            draw();
            drawDotPosition(ctx, lastX, canvasImg.height - lastY, 1 / Zoom);
            pageTimer["timer1"] = setTimeout(request, delaytime);
        }, delaytime);
        canvas.addEventListener("click", handleDotPosition);
    } else {
        isPosition = false;
        document.getElementById("label_fence_dot_position").innerHTML = "<i class='fas fa-map-marked-alt' style='font-size:20px;'></i>";
        document.getElementById("label_fence_dot_position").title = $.i18n.prop('i_startFencePointPos');
        for (var each in pageTimer)
            clearTimeout(pageTimer[each]);
        draw();
        canvas.removeEventListener("click", handleDotPosition);
    }
}

function resetFencePosition() {
    if (isPosition) {
        isPosition = false;
        document.getElementById("label_fence_dot_position").innerHTML = "<i class='fas fa-map-marked-alt' style='font-size:20px;'></i>";
        document.getElementById("label_fence_dot_position").title = $.i18n.prop('i_startFencePointPos');
        for (var each in pageTimer)
            clearTimeout(pageTimer[each]);
        addFenceDotArray = [];
        draw();
        canvas.removeEventListener("click", handleDotPosition);
    }
}

function Fence() {
    var fence_dot_array = [];
    this.setFenceDot = function (fence_name, x, y) {
        fence_dot_array.push({
            fence_name: fence_name,
            x: x,
            y: y
        });
    };
    this.drawFence = function () {
        var canvas = document.getElementById("canvas_map"),
            ctx = canvas.getContext("2d"),
            len = fence_dot_array.length;
        ctx.beginPath();
        fence_dot_array.forEach(function (v, i, arr) {
            ctx.lineTo(v.x, v.y);
            if (i == len - 1)
                ctx.lineTo(arr[0].x, arr[0].y);
        })
        ctx.strokeStyle = "rgb(0, 153, 51)";
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 153, 51, 0.61)";
        ctx.fill();
        //在圍籬中間畫出群組名稱
        ctx.fillStyle = "blue";
        ctx.font = 26 / Zoom + 'px serif';
        var arr = fence_dot_array,
            displace_x = (arr[2].x - arr[0].x) / 2 - 13 * arr[0].fence_name.length,
            displace_y = (arr[2].y - arr[0].y) / 2 - 13;
        ctx.fillText(arr[0].fence_name, arr[0].x + displace_x, arr[0].y + displace_y);
        ctx.closePath();
    };
}

function SettingFence() {
    var fence_dot_array = [],
        canvas = document.getElementById("canvas_map"),
        ctx = canvas.getContext("2d"),
        displace = 5 / Zoom;
    this.setFenceDot = function (x, y) {
        fence_dot_array.push({
            x: x,
            y: y
        });
    };
    this.drawFence = function () {
        var len = fence_dot_array.length;
        ctx.beginPath();
        fence_dot_array.forEach(function (v, i, arr) {
            if (i == len - 1) {
                ctx.lineTo(v.x, v.y);
                ctx.lineTo(arr[0].x, arr[0].y);
            } else {
                ctx.lineTo(v.x, v.y);
            }
        })
        ctx.strokeStyle = "rgb(255, 80, 80)";
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 80, 80, 0.61)";
        ctx.fill();
        ctx.closePath();
    };
    this.drawFenceDots = function () {
        var size = 10 / Zoom;
        fence_dot_array.forEach(function (v) {
            ctx.fillStyle = "rgb(255, 80, 80)";
            ctx.fillRect(v.x - displace, v.y - displace, size, size); //10*3
        });
    };
}

function addDotArray(x, y) {
    addFenceDotArray.push({
        x: x,
        y: y
    });
    updateFenceDotsArr();
    draw();
}

function deleteDotArray() {
    var checkboxs = document.getElementsByName("chkbox_fence_dot_setting"),
        retain_arr = [];
    for (k = 0; k < checkboxs.length; k++) {
        if (!checkboxs[k].checked)
            retain_arr.push(addFenceDotArray[k]);
    }
    addFenceDotArray = retain_arr;
    addFenceContainGroup = [];
    updateFenceDotsArr();
    draw();
}

function Group() {
    var anchor_array = [];
    this.setAnchor = function (id, x, y) {
        anchor_array.push({
            id: id,
            x: x,
            y: y
        });
    }
    this.drawGroup = function () {
        var canvas = document.getElementById("canvas_map"),
            ctx = canvas.getContext("2d"),
            len = anchor_array.length;
        ctx.beginPath();
        anchor_array.forEach(function (v, i, arr) {
            if (i == len - 1) {
                ctx.lineTo(v.x, v.y);
                ctx.lineTo(arr[0].x, arr[0].y);
            } else {
                ctx.lineTo(v.x, v.y);
            }
        });
        ctx.strokeStyle = "rgb(255, 123, 0)";
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 153, 0, 0.61)";
        ctx.fill();
        ctx.closePath();
    }
}

function drawAnchor(dctx, id, type, x, y, zoom) {
    var size = 10 * zoom;
    if (type == "main")
        dctx.fillStyle = "red";
    else
        dctx.fillStyle = "blue";
    dctx.font = 13 * zoom + 'px serif';
    dctx.fillText(id, x - 5 * zoom, y - 7 * zoom); //anchorID
    dctx.fillRect(x - 5 * zoom, y - 5 * zoom, size, size);
}

function handleDotPosition() {
    $("#add_dot_x").val($("#x").text());
    $("#add_dot_y").val($("#y").text());
    $("#dialog_add_fence_dot").dialog("open");
}

function inputFenceGroup() {
    $("#table_fence_group tbody").empty();
    addFenceContainGroup.forEach(function (groupInfo, index) {
        $("#table_fence_group tbody").append("<tr><td>" + (index + 1) + "</td>" +
            "<td name=\"fence_groups\">" + groupInfo.g_name + "</td></tr>");
    });
}