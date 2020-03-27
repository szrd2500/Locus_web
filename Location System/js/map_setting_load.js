var thumb_width = 240,
    thumb_height = 180,
    mapArray = [],
    MapListFunc = {
        Request: {
            get: function () {
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
                            mapArray = revObj.Value[0].Values.slice(0); //利用抽離全部陣列完成陣列拷貝
                            $("#maps_gallery").empty();
                            if (mapArray) {
                                for (i = 0; i < mapArray.length; i++) {
                                    setThumbnail(mapArray[i]);
                                }
                            }
                        } else {
                            alert($.i18n.prop('i_mapAlert_18'));
                        }
                    }
                };
                xmlHttp.send(JSON.stringify(requestArray));
            },
            add: function () {
                if (confirm($.i18n.prop('i_mapAlert_17'))) {
                    $("#add_map_name").removeClass("ui-state-error");
                    $("#add_map_image").removeClass("ui-state-error");
                    var valid = true && checkLength($("#add_map_name"), $.i18n.prop('i_mapAlert_13'), 1, 50),
                        map_ext = "",
                        map_base64 = "";
                    if ($("#add_map_image").attr("src").length > 0) {
                        var map_file = $("#add_map_image").attr("src").split(",");
                        map_ext = getBase64Ext(map_file[0]);
                        map_base64 = map_ext != "" ? map_file[1].trim() : "";
                    } else { //no image
                        valid = false;
                        $("#add_map_image").addClass("ui-state-error");
                    }
                    if (valid) {
                        var addMapReq = {
                            "Command_Type": ["Write"],
                            "Command_Name": ["AddListMap"],
                            "Value": [{
                                "map_name": $("#add_map_name").val(),
                                "map_scale": "1",
                                "map_file": map_base64,
                                "map_file_ext": map_ext
                            }],
                            "api_token": [token]
                        };
                        var mapHttp = createJsonXmlHttp("sql");
                        mapHttp.onreadystatechange = function () {
                            if (mapHttp.readyState == 4 || mapHttp.readyState == "complete") {
                                var revObj = JSON.parse(this.responseText);
                                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                    $("#maps_gallery").empty();
                                    mapArray = revObj.Value[0].Values.slice(0);
                                    var lan = mapArray.length;
                                    for (i = 0; i < lan; i++) {
                                        setThumbnail(mapArray[i]);
                                    }
                                    $("#dialog_add_map").dialog("close");
                                    setMapById(mapArray[lan - 1].map_id); //catch last row
                                } else {
                                    alert("Add map failed!");
                                }
                            }
                        };
                        mapHttp.send(JSON.stringify(addMapReq));
                    }
                }
            },
            delete: function (id) {
                if (confirm($.i18n.prop('i_mapAlert_10'))) {
                    var deleteMapReq = {
                        "Command_Type": ["Read"],
                        "Command_Name": ["DeleteMap"],
                        "Value": [{
                            "map_id": id
                        }],
                        "api_token": [token]
                    };
                    var mapHttp = createJsonXmlHttp("sql");
                    mapHttp.onreadystatechange = function () {
                        if (mapHttp.readyState == 4 || mapHttp.readyState == "complete") {
                            var revObj = JSON.parse(this.responseText);
                            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                var deleteMap_GroupReq = JSON.stringify({
                                    "Command_Type": ["Read"],
                                    "Command_Name": ["DeleteMap_Group"],
                                    "Value": [{
                                        "map_id": id
                                    }],
                                    "api_token": [token]
                                });
                                var mapGroupHttp = createJsonXmlHttp("sql");
                                mapGroupHttp.onreadystatechange = function () {
                                    if (mapGroupHttp.readyState == 4 || mapGroupHttp.readyState == "complete") {
                                        alert("")
                                    }
                                };
                                mapGroupHttp.send(deleteMap_GroupReq);
                                MapListFunc.Dialog.clear();
                            }
                        }
                    };
                    mapHttp.send(JSON.stringify(deleteMapReq));
                }
            }
        },
        Dialog: {
            add: function () {
                var dialog, form,
                    allFields = $([]).add($("#add_map_name")).add($("#add_map_image"));

                $("#add_map_file").on("change", function () {
                    var file = this.files[0];
                    if (file && checkExt(this.value) && checkImageSize(file)) {
                        var FR = new FileReader();
                        FR.readAsDataURL(file);
                        FR.onloadend = function (e) {
                            var base64data = e.target.result;
                            $("#add_map_image").attr("src", base64data);
                        };
                    }
                });

                dialog = $("#dialog_add_map").dialog({
                    autoOpen: false,
                    height: 350,
                    width: 350,
                    modal: true,
                    buttons: {
                        "Confirm": MapListFunc.Request.add,
                        Cancel: function () {
                            form[0].reset();
                            allFields.removeClass("ui-state-error");
                            dialog.dialog("close");
                        }
                    },
                    close: function () {
                        form[0].reset();
                        allFields.removeClass("ui-state-error");
                    }
                });

                form = dialog.find("form").on("submit", function (event) {
                    event.preventDefault();
                    MapListFunc.Request.add();
                });

                $("#add_new_map").button().on("click", function () {
                    $("#add_map_name").val(""); //reset
                    $("#add_map_image").attr("src", "");
                    dialog.dialog("open");
                });
            },
            edit: function () {
                $("#menu_load_map").on("change", function () {
                    var file = this.files[0];
                    if (file && checkExt(this.value) && checkImageSize(file)) {
                        transBase64(file);
                        $("#btn_submit_map_info").prop('disabled', false);
                    }
                });
                $("#menu_resize").on("click", resizeCanvas);
                $("#menu_map_info").on("click", function () {
                    hiddenBlock();
                    $("#block_info").show();
                    $("#label_map_info").addClass("opened");
                });
                $("#menu_anchor_list").on("click", function () {
                    hiddenBlock();
                    $("#block_anchor_list").show();
                    $("#label_anchor_list").addClass("opened");
                });
                $("#menu_group_list").on("click", function () {
                    hiddenBlock();
                    $("#block_group_list").show();
                    $("#label_group_list").addClass("opened");
                });
                $("#menu_anchor_group").on("click", function () {
                    hiddenBlock();
                    $("#block_anchor_group").show();
                    $("#label_anchor_group").addClass("opened");
                });

                function hiddenBlock() {
                    $("#block_info").hide();
                    $("#block_anchor_list").hide();
                    $("#block_group_list").hide();
                    $("#block_anchor_group").hide();
                    $("#block_map_group").hide();
                    $(".sidebar-menu .btn-sidebar").removeClass("opened");
                }

                //map info
                var mapinfo_image = $("#canvas_map"),
                    mapinfo_id = $("#map_info_id"),
                    mapinfo_name = $("#map_info_name"),
                    mapinfo_scale = $("#map_info_scale"),
                    allFields = $([]).add(mapinfo_image).add(mapinfo_name).add(mapinfo_scale);


                function SubmitResult() {
                    allFields.removeClass("ui-state-error");
                    var valid = true;
                    valid = valid && checkLength(mapinfo_id, $.i18n.prop('i_mapAlert_1'), 1, 50);
                    valid = valid && checkLength(mapinfo_name, $.i18n.prop('i_mapAlert_2'), 1, 50);
                    valid = valid && checkLength(mapinfo_scale, $.i18n.prop('i_mapAlert_3'), 1, 5);
                    if (mapinfo_image.css("backgroundImage").length > 0) {
                        var mapinfo_file = mapinfo_image.css("backgroundImage").split(",");
                        mapinfo_ext = getBase64Ext(mapinfo_file[0]);
                        mapinfo_base64 = mapinfo_ext != "" ? mapinfo_file[1].split("\"")[0].trim() : "";
                    } else { //no image
                        valid = false;
                        mapinfo_image.addClass("ui-state-error");
                    }
                    if (valid) {
                        var mapInfoReq = JSON.stringify({
                            "Command_Type": ["Read"],
                            "Command_Name": ["EditMap"],
                            "Value": {
                                "map_id": mapinfo_id.val(),
                                "map_name": mapinfo_name.val(),
                                "map_file": mapinfo_base64,
                                "map_file_ext": mapinfo_ext,
                                "map_scale": mapinfo_scale.val()
                            },
                            "api_token": [token]
                        });
                        var mapHttp = createJsonXmlHttp("sql");
                        mapHttp.onreadystatechange = function () {
                            if (mapHttp.readyState == 4 || mapHttp.readyState == "complete") {
                                var revObj = JSON.parse(this.responseText);
                                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                    MapListFunc.Request.get(); //reload
                                    $("#btn_submit_map_info").prop('disabled', true);
                                    alert($.i18n.prop('i_mapAlert_5'));
                                }
                            }
                        };
                        mapHttp.send(mapInfoReq);
                    }
                    return valid;
                }

                //Map Setting Dialog
                $("#dialog_map_setting").dialog({
                    autoOpen: false,
                    height: 580,
                    width: 950,
                    modal: true,
                    close: function () {
                        hiddenBlock();
                        $("#block_info").show();
                        $("#label_map_info").addClass("opened");
                        $("#btn_submit_map_info").prop('disabled', true);
                        allFields.removeClass("ui-state-error");
                    }
                });
                mapinfo_name.on("change", function () {
                    $("#btn_submit_map_info").prop('disabled', false);
                });
                mapinfo_scale.on("change", function () {
                    $("#btn_submit_map_info").prop('disabled', false);
                });
                $("#btn_submit_map_info").on('click', function () {
                    if (confirm($.i18n.prop('i_mapAlert_4')) == true)
                        SubmitResult();
                });
            },
            clear: function () {
                $("#map_info_id").val("");
                $("#map_info_name").val("");
                $("#map_info_scale").val("");
                $("#table_main_anchor_list tbody").empty();
                $("#table_anchor_list tbody").empty();
                $("#table_group_list tbody").empty();
                $("#table_anchor_group tbody").empty();
                resetCanvas_Anchor();
                MapListFunc.Request.get();
                //$("#dialog_map_setting").dialog("open");
            },
            init: function () {
                this.add();
                this.edit();
            }
        }
    };

$(function () {
    var h = document.documentElement.clientHeight;
    /*$(".container").css("height", h - 10 + "px");*/
    $("#cvsBlock").css("height", h - 373 + "px");

    /* Check this page's permission and load navbar */
    loadUserData();
    checkPermissionOfPage("Map_Setting");
    setNavBar("Map_Setting", "");
    thumb_width = parseInt(document.getElementById("new_map_block").style.maxWidth, 10);
    thumb_height = parseInt(document.getElementById("new_map_block").style.maxHeight, 10);
    MapListFunc.Request.get();
    MapListFunc.Dialog.init();
    MapGroupFunc.Dialog.init();
    AnchorListFunc.Dialog.init();
    GroupAnchorFunc.Dialog.init();
    setupCanvas();
    /* Map Draw */
    $("#map_info_scale").on("change", function () {
        canvasImg.scale = $(this).val();
        catchMap_Anchors();
        draw();
    });
});

function setThumbnail(map_info) {
    var map = "map_id_" + map_info.map_id;
    var img = new Image();
    img.src = "data:image/" + map_info.map_file_ext + ";base64," + map_info.map_file;
    img.onload = function () {
        var imgSize = img.width / img.height;
        var thumbSize = thumb_width / thumb_height;
        var thumb_set = "thumb_set_" + map_info.map_id;
        var thumb_delete = "thumb_del_" + map_info.map_id;
        if (imgSize > thumbSize) //原圖比例寬邊較長
            thumb_height = img.height * (thumb_width / img.width);
        else
            thumb_width = img.width * (thumb_height / img.height);
        $("#maps_gallery").append("<div class='thumbnail'>" +
            "<label for=\"" + thumb_delete + "\" title=\"" + $.i18n.prop('i_delete') + "\"" +
            " class='btn-cancel i18n-input' selectattr='title' selectname=\"i_delete\">" +
            "<i class='fas fa-window-close'></i></label>" +
            "<input type='button' class='btn-hidden' id=\"" + thumb_delete + "\"" +
            " onclick=\"MapListFunc.Request.delete(\'" + map_info.map_id + "\')\" />" +
            "<div class='image_block'>" +
            "<img src=\"" + this.src + "\" width=\"" + thumb_width + "\" height=\"" + thumb_height + "\">" +
            "</div>" +
            "<div class='caption'><table style='width:100%;'><thead><tr>" +
            "<th style='text-align:center;'><label id=\"" + map + "\">" + map_info.map_name + "</label></th>" +
            "<th><label for=\"" + thumb_set + "\" title=\"" + $.i18n.prop('i_setting') + "\"" +
            " class='btn-set i18n-input' selectattr='title' selectname=\"i_setting\"" +
            " style='float:right;'><i class='fas fa-edit'></i></label>" +
            "<input type='button' class='btn-hidden' id=\"" + thumb_set + "\"" +
            " onclick=\"setMapById(\'" + map_info.map_id + "\')\" /></th>" +
            "</tr></thead></table></div>" +
            "</div>");
    }
}

function confirmHrefType(href) {
    var BASE64_MARKER = ';base64,';
    if (href.indexOf(BASE64_MARKER) == -1)
        return href;
    else
        return false;
}

function setMapById(id) { //點擊設定:開啟設定視窗
    var index = mapArray.findIndex(function (info) {
        return info.map_id == id;
    });
    if (index > -1) {
        var urlData = "data:image/" + mapArray[index].map_file_ext + ";base64," + mapArray[index].map_file;
        var scale = mapArray[index].map_scale;
        $("#map_info_id").val(mapArray[index].map_id);
        $("#map_info_name").val(mapArray[index].map_name);
        $("#map_info_scale").val(scale);
        setMap(urlData, scale);
        //$("#dialog_map_setting").dialog("open");
    } else {
        return;
    }
}

function transBase64(file) {
    if (file) { //file transform base64
        var FR = new FileReader();
        FR.readAsDataURL(file);
        FR.onloadend = function (e) {
            var base64data = e.target.result;
            loadImage(base64data);
        };
    }
}

function checkExt(fileName) {
    var validExts = new Array(".png", ".jpg", ".jpeg"); // 可接受的副檔名
    var fileExt = fileName.substring(fileName.lastIndexOf('.'));
    if (validExts.indexOf(fileExt) < 0) {
        alert($.i18n.prop('i_fileError_2') + validExts.toString());
        return false;
    } else
        return true;
}

function checkImageSize(file) {
    if (file.size / 1024 > 100) {
        alert($.i18n.prop('i_fileError_3'));
        return false;
    } else
        return true;
}

function getBase64Ext(urldata) {
    urldata = typeof (urldata) == 'undefined' ? "" : urldata;
    var start = urldata.indexOf("/"),
        end = urldata.indexOf(";");
    if (start > -1 && end > -1) {
        return urldata.substring(start + 1, end);
    } else {
        alert($.i18n.prop('i_fileError_1'));
        return "";
    }
}