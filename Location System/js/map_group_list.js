var allGroups = [],
    mapGroupArray = [],
    MapGroupFunc = {
        Dialog: {
            add: function () { //Dialog to add grouplist by main anchor.       
                var dialog, form,
                    add_grouplist_id = $("#add_grouplist_id"),
                    add_grouplist_name = $("#add_grouplist_name"),
                    add_main_anchor = $("#add_grouplist_main_anchor"),
                    add_main_anchor_x = $("#add_grouplist_main_anchor_x"),
                    add_main_anchor_y = $("#add_grouplist_main_anchor_y"),
                    allFields = $([]).add(add_grouplist_id).add(add_grouplist_name)
                    .add(add_main_anchor).add(add_main_anchor_x).add(add_main_anchor_y),
                    SendResult = function () {
                        allFields.removeClass("ui-state-error");
                        var valid = true;
                        var isBoundByMap = mapGroupArray.findIndex(function (map_group) {
                            return map_group.group_id == add_grouplist_id.val();
                        });
                        if (isBoundByMap > -1) {
                            valid = false;
                            add_grouplist_id.addClass("ui-state-error");
                            alert($.i18n.prop('i_mapAlert_11'));
                        }
                        valid = valid && checkLength(add_grouplist_id, $.i18n.prop('i_mapAlert_14'), 1, 5);
                        valid = valid && checkLength(add_grouplist_name, $.i18n.prop('i_mapAlert_13'), 1, 50);
                        valid = valid && checkLength(add_main_anchor, $.i18n.prop('i_mapAlert_14'), 1, 5);
                        valid = valid && checkLength(add_main_anchor_x, $.i18n.prop('i_mapAlert_13'), 1, 50);
                        valid = valid && checkLength(add_main_anchor_y, $.i18n.prop('i_mapAlert_13'), 1, 50);

                        if (valid) {
                            var request = {
                                "Command_Type": ["Write"],
                                "Command_Name": ["AddListGroup"],
                                "Value": [{
                                    "group_id": add_grouplist_id.val(),
                                    "group_name": add_grouplist_name.val(),
                                    "main_anchor_id": add_main_anchor.val(),
                                    "set_x": add_main_anchor_x.val(),
                                    "set_y": add_main_anchor_y.val(),
                                    "mode": "normal",
                                    "mode_value": "0",
                                    "fence": "0"
                                }],
                                "api_token": [token]
                            };
                            var xmlHttp = createJsonXmlHttp("sql");
                            xmlHttp.onreadystatechange = function () {
                                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                                    var revObj = JSON.parse(this.responseText);
                                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                        var request2 = {
                                            "Command_Type": ["Write"],
                                            "Command_Name": ["AddListMap_Group"],
                                            "Value": [{
                                                "map_id": $("#map_info_id").val(),
                                                "group_id": add_grouplist_id.val()
                                            }],
                                            "api_token": [token]
                                        };
                                        var xmlHttp2 = createJsonXmlHttp("sql");
                                        xmlHttp2.onreadystatechange = function () {
                                            if (xmlHttp2.readyState == 4 || xmlHttp2.readyState == "complete") {
                                                var revObj = JSON.parse(this.responseText);
                                                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                                    getAllDataOfMap();
                                                    GroupListFunc.Request.edit(
                                                        add_main_anchor.val(),
                                                        add_main_anchor_x.val(),
                                                        add_main_anchor_y.val()
                                                    );
                                                    dialog.dialog("close");
                                                }
                                            }
                                        };
                                        xmlHttp2.send(JSON.stringify(request2));
                                    }
                                }
                            };
                            xmlHttp.send(JSON.stringify(request));
                        }
                        return valid;
                    };

                dialog = $("#dialog_add_group_list").dialog({
                    autoOpen: false,
                    height: 400,
                    width: 340,
                    modal: true,
                    buttons: {
                        Cancel: function () {
                            dialog.dialog("close");
                        },
                        "Confirm": SendResult
                    },
                    close: function () {
                        form[0].reset();
                        allFields.removeClass("ui-state-error");
                    }
                });

                form = dialog.find("form").on("submit", function (event) {
                    event.preventDefault();
                    SendResult();
                });
            },
            edit: function () { //Dialog to edit grouplist by main anchor.
                var dialog, form,
                    edit_main_anchor = $("#edit_grouplist_main_anchor"),
                    edit_main_anchor_x = $("#edit_grouplist_main_anchor_x"),
                    edit_main_anchor_y = $("#edit_grouplist_main_anchor_y"),
                    allFields = $([]).add(edit_main_anchor).add(edit_main_anchor_x).add(edit_main_anchor_y),
                    SendResult = function () {
                        var valid = true,
                            edit_grouplist_id = $("[name='edit_grouplist_id']"),
                            edit_grouplist_name = $("[name='edit_grouplist_name']");
                        allFields.removeClass("ui-state-error");
                        valid = valid && checkLength(edit_main_anchor, $.i18n.prop('i_mapAlert_14'), 1, 5);
                        valid = valid && checkLength(edit_main_anchor_x, $.i18n.prop('i_mapAlert_13'), 1, 50);
                        valid = valid && checkLength(edit_main_anchor_y, $.i18n.prop('i_mapAlert_13'), 1, 50);
                        edit_grouplist_name.each(function (i) {
                            valid = valid && checkLength(edit_grouplist_name.eq(i), $.i18n.prop('i_mapAlert_13'), 1, 50);
                        });

                        if (valid) {
                            edit_grouplist_id.each(function (i) {
                                var index = allGroups.findIndex(function (info) {
                                    return info.group_id == edit_grouplist_id.eq(i).val();
                                });
                                if (index > -1) {
                                    var request = {
                                        "Command_Type": ["Write"],
                                        "Command_Name": ["EditGroup_Info"],
                                        "Value": {
                                            "group_id": allGroups[index].group_id,
                                            "group_name": edit_grouplist_name.eq(i).val(),
                                            "main_anchor_id": edit_main_anchor.val(),
                                            "set_x": edit_main_anchor_x.val(),
                                            "set_y": edit_main_anchor_y.val(),
                                            "mode": allGroups[index].mode,
                                            "mode_value": allGroups[index].mode_value,
                                            "fence": allGroups[index].fence
                                        },
                                        "api_token": [token]
                                    };
                                    var xmlHttp = createJsonXmlHttp("sql");
                                    xmlHttp.onreadystatechange = function () {
                                        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                                            var revObj = JSON.parse(this.responseText);
                                            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                                getAllDataOfMap();
                                                dialog.dialog("close");
                                            }
                                        }
                                    };
                                    xmlHttp.send(JSON.stringify(request));
                                }
                            });
                        }
                        return valid;
                    };

                dialog = $("#dialog_edit_group_list").dialog({
                    autoOpen: false,
                    height: 450,
                    width: 300,
                    modal: true,
                    buttons: {
                        Cancel: function () {
                            dialog.dialog("close");
                        },
                        "Confirm": SendResult
                    },
                    close: function () {
                        form[0].reset();
                        $("#table_edit_grouplist tbody").empty();
                        allFields.removeClass("ui-state-error");
                        catchMap_Anchors();
                    }
                });

                form = dialog.find("form").on("submit", function (event) {
                    event.preventDefault();
                    SendResult();
                });
            },
            init: function () {
                this.add();
                this.edit();
                $("#btn_add_group").on('click', function () {
                    $("#add_grouplist_id").val("");
                    $("#add_group_id_alert").empty();
                    $("#add_grouplist_name").val("");
                    $("#add_grouplist_main_anchor").html(GroupListFunc.Get.mainAnchorDropdown(""));
                    $("#add_grouplist_main_anchor_x").val("");
                    $("#add_grouplist_main_anchor_y").val("");
                    $("#dialog_add_group_list").dialog("open");
                });
                $("#btn_pos_group").on('click', function () {
                    startMainAnchorPosition();
                });
                $("#btn_delete_group").on('click', function () {
                    if (confirm($.i18n.prop('i_mapAlert_26'))) {
                        var checkboxs = document.getElementsByName("chkbox_group_list");
                        var deleteArray = [];
                        for (var j = 0; j < checkboxs.length; j++) {
                            if (checkboxs[j].checked) {
                                deleteArray.push({
                                    "group_id": checkboxs[j].value
                                });
                            }
                        }
                        if (deleteArray.length > 0)
                            GroupListFunc.Request.delete(deleteArray);
                        else
                            alert($.i18n.prop('i_mapAlert_9'));
                    }
                });
                $("#add_grouplist_id").on('change', function () {
                    if ($(this).val().length > 0) {
                        var isBoundByMap = mapGroupArray.findIndex(function (map_group) {
                            return map_group.group_id == $("#add_grouplist_id").val();
                        });
                        if (isBoundByMap > -1)
                            $("#add_group_id_alert").text($.i18n.prop('i_existed')).css('color', 'red');
                        else
                            $("#add_group_id_alert").text($.i18n.prop('i_canAdd')).css('color', 'green');
                    } else {
                        $("#add_group_id_alert").empty();
                    }
                });
                $("#btn_edit_grouplist_add").on("click", function () {
                    var groupList = GetRowsDatas.group(),
                        count = document.getElementsByName("checkbox_edit_grouplist").length + 1;
                    $("#table_edit_grouplist tbody").append("<tr>" +
                        "<td><input type=\"checkbox\" name=\"checkbox_edit_grouplist\" value=\"\" /> " + count + "</td>" +
                        "<td><select name=\"edit_grouplist_id\">" +
                        makeNameOptions("group_id", groupList, groupList[0].group_id) + "</select></td>" +
                        "<td><select name=\"edit_grouplist_name\">" +
                        makeNameOptions("group_name", groupList, groupList[0].group_name) + "</select></td></tr>");
                    GroupListFunc.bindChange("select[name='edit_grouplist_id']", "select[name='edit_grouplist_name']");
                });
                $("#btn_edit_grouplist_delete").on("click", function () {
                    var groupList = GetRowsDatas.group(),
                        groups = document.getElementsByName("checkbox_edit_grouplist"),
                        group_ids = document.getElementsByName("edit_grouplist_id"),
                        group_names = document.getElementsByName("edit_grouplist_name"),
                        count = 0,
                        trs = "";
                    groups.forEach(function (element, i) {
                        if (!element.checked) {
                            count++;
                            trs += "<tr><td><input type=\"checkbox\" name=\"checkbox_edit_grouplist\" value=\"\" /> " + count + "</td>" +
                                "<td><select name=\"edit_grouplist_id\">" +
                                makeNameOptions("group_id", groupList, group_ids[i].value) + "</select></td>" +
                                "<td><select name=\"edit_grouplist_name\">" +
                                makeNameOptions("group_name", groupList, group_names[i].value) + "</select></td></tr>";
                        }
                    });
                    $("#table_edit_grouplist tbody").html(trs);
                    GroupListFunc.bindChange("select[name='edit_grouplist_id']", "select[name='edit_grouplist_name']");
                });
            }
        },
        Request: {
            Get: {
                maps: function () {
                    var request = {
                        "Command_Type": ["Read"],
                        "Command_Name": ["GetGroups"],
                        "api_token": [token]
                    };
                    var xmlHttp = createJsonXmlHttp("sql");
                    xmlHttp.onreadystatechange = function () {
                        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                            var revObj = JSON.parse(this.responseText);
                            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                allGroups = revObj.Value[0].Values.slice(0) || [];
                            }
                        }
                    };
                    xmlHttp.send(JSON.stringify(request));
                },
                groups: function () {
                    var request = {
                        "Command_Type": ["Read"],
                        "Command_Name": ["GetMaps_Groups"],
                        "api_token": [token]
                    };
                    var xmlHttp = createJsonXmlHttp("sql");
                    xmlHttp.onreadystatechange = function () {
                        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                            var revObj = JSON.parse(this.responseText);
                            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                mapGroupArray = revObj.Value[0].Values.slice(0) || [];
                            } else {
                                alert($.i18n.prop('i_mapAlert_12'));
                            }
                        }
                    };
                    xmlHttp.send(JSON.stringify(request));
                },
                all: function () {
                    this.maps();
                    this.groups();
                }
            },
            add: function (map_groupArray) {
                var addRequest = {
                    "Command_Type": ["Write"],
                    "Command_Name": ["AddListMap_Group"],
                    "Value": map_groupArray,
                    "api_token": [token]
                };
                var addXmlHttp = createJsonXmlHttp("sql");
                addXmlHttp.onreadystatechange = function () {
                    if (addXmlHttp.readyState == 4 || addXmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            return;
                        }
                    }
                };
                addXmlHttp.send(JSON.stringify(addRequest));
            }
        }
    };