var GroupListFunc = {
        Request: {
            get: function () {
                var requestArray = {
                    "Command_Type": ["Read"],
                    "Command_Name": ["GetMainAnchorsInMap"],
                    "Value": {
                        "map_id": $("#map_info_id").val()
                    },
                    "api_token": [token]
                };
                var xmlHttp = createJsonXmlHttp("sql");
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            var revInfo = revObj.Value[0].Values || [];
                            var mainAnchorArr = [];
                            $("#table_group_list tbody").empty();
                            revInfo.forEach(function (element, index) {
                                element.group_name = typeof (element.group_name) != 'undefined' ? element.group_name : "";
                                var tr_id = "tr_group_list_" + (index + 1);
                                $("#table_group_list tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                                    "<input type=\"checkbox\" name=\"chkbox_group_list\" value=\"" + element.group_id + "\"" +
                                    " onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + (index + 1) +
                                    "</td><td>" +
                                    "<input type=\"text\" name=\"grouplist_name\" value=\"" + element.group_name +
                                    "\" style=\"max-width:70px;\" readonly/>" +
                                    "</td><td>" +
                                    "<input type=\"text\" name=\"grouplist_main_anchor_id\" value=\"" + element.main_anchor_id +
                                    "\" style=\"max-width:80px;\" readonly/>" +
                                    "</td><td>" +
                                    "<input type=\"text\" name=\"grouplist_main_anchor_x\" value=\"" + element.set_x +
                                    "\" style=\"max-width:80px;\" readonly/>" +
                                    "</td><td>" +
                                    "<input type=\"text\" name=\"grouplist_main_anchor_y\" value=\"" + element.set_y +
                                    "\" style=\"max-width:80px;\" readonly/>" +
                                    "</td><td>" +
                                    "<label for=\"btn_edit_grouplist_" + (index + 1) + "\" class='btn-edit' title='" +
                                    $.i18n.prop('i_editGroup') + "'><i class='fas fa-edit' style='font-size:18px;'></i></label>" +
                                    "<input id=\"btn_edit_grouplist_" + (index + 1) + "\" type='button' class='btn-hidden'" +
                                    " onclick=\"GroupListFunc.edit(\'" + element.main_anchor_id + "\',\'" + element.set_x + "\',\'" +
                                    element.set_y + "\')\" /></td></tr>");

                                if (mainAnchorArr.indexOf(element.main_anchor_id) == -1) {
                                    mainAnchorArr.push(element.main_anchor_id);
                                    inputAnchorArray({
                                        id: element.main_anchor_id,
                                        type: "main",
                                        x: element.set_x,
                                        y: element.set_y,
                                        group_id: element.group_id
                                    });
                                }
                            });
                        } else {
                            alert($.i18n.prop('i_mapAlert_6'));
                        }
                    }
                };
                xmlHttp.send(JSON.stringify(requestArray));
            },
            edit: function (main_anchor_id, set_x, set_y) {
                var getRequest = {
                    "Command_Type": ["Read"],
                    "Command_Name": ["GetMainAnchorsInMap"],
                    "Value": {
                        "map_id": $("#map_info_id").val()
                    },
                    "api_token": [token]
                };
                var getXmlHttp = createJsonXmlHttp("sql");
                getXmlHttp.onreadystatechange = function () {
                    if (getXmlHttp.readyState == 4 || getXmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            var mapGroupInfo = revObj.Value[0].Values || [];
                            mapGroupInfo.forEach(function (v, i) {
                                if (v.main_anchor_id == main_anchor_id) {
                                    var editRequest = {
                                        "Command_Type": ["Write"],
                                        "Command_Name": ["EditGroup_Info"],
                                        "Value": {
                                            "group_id": v.group_id,
                                            "group_name": v.group_name,
                                            "main_anchor_id": main_anchor_id,
                                            "set_x": set_x,
                                            "set_y": set_y,
                                            "mode": v.mode,
                                            "mode_value": v.mode_value,
                                            "fence": v.fence
                                        },
                                        "api_token": [token]
                                    };
                                    var editXmlHttp = createJsonXmlHttp("sql");
                                    editXmlHttp.onreadystatechange = function () {
                                        if (editXmlHttp.readyState == 4 || editXmlHttp.readyState == "complete") {
                                            var revObj2 = JSON.parse(this.responseText);
                                            if (checkTokenAlive(revObj2) && revObj2.Value[0].success > 0) {
                                                return;
                                            }
                                        }
                                    };
                                    editXmlHttp.send(JSON.stringify(editRequest));
                                }
                            });
                            getAllDataOfMap();
                        } else {
                            alert($.i18n.prop('i_mapAlert_6'));
                        }
                    }
                };
                getXmlHttp.send(JSON.stringify(getRequest));
            },
            delete: function (deleteArray) {
                var deleteRequest = {
                    "Command_Type": ["Read"],
                    "Command_Name": ["DeleteGroup_Info"],
                    "Value": deleteArray,
                    "api_token": [token]
                };
                var deleteXmlHttp = createJsonXmlHttp("sql");
                deleteXmlHttp.onreadystatechange = function () {
                    if (deleteXmlHttp.readyState == 4 || deleteXmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            var deleteMapGroupArr = [];
                            deleteArray.forEach(function (info) {
                                mapGroupArray.forEach(function (element) {
                                    if (element.group_id == info.group_id) {
                                        deleteMapGroupArr.push({
                                            "map_id": element.map_id,
                                            "group_id": element.group_id
                                        });
                                    }
                                });
                            });
                            var deleteConnRequest = {
                                "Command_Type": ["Write"],
                                "Command_Name": ["DeleteMap_Group"],
                                "Value": deleteMapGroupArr,
                                "api_token": [token]
                            };
                            var xmlHttp = createJsonXmlHttp("sql");
                            xmlHttp.onreadystatechange = function () {
                                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                                    var revObj2 = JSON.parse(this.responseText);
                                    if (checkTokenAlive(revObj2) && revObj2.Value[0].success > 0)
                                        GroupAnchorFunc.Request.delete(deleteArray);
                                }
                            };
                            xmlHttp.send(JSON.stringify(deleteConnRequest));
                        }
                    }
                };
                deleteXmlHttp.send(JSON.stringify(deleteRequest));
            }
        },
        Update: {
            groupAnchorList: function () {
                var anchorGroupArray = [];
                var g_id = document.getElementsByName("anchorgroup_group_id");
                var a_id = document.getElementsByName("anchorgroup_anchor_id");
                g_id.forEach(function (element, index) {
                    if (element.value != "" && typeof (element.value) != 'undefined') {
                        anchorGroupArray.push({
                            group_id: element.value,
                            anchor_id: a_id[index].value
                        });
                    }
                });
                return anchorGroupArray;
            },
            groupList: function () {
                var groupArray = [];
                var g_id = document.getElementsByName("chkbox_group_list");
                g_id.forEach(function (element) {
                    if (element.value != "" && typeof (element.value) != 'undefined')
                        groupArray.push(element.value);
                });
                return groupArray;
            }
        },
        Get: {
            mainAnchorDropdown: function (select) {
                var mainAnchorList = document.getElementsByName("list_main_anchor_id");
                var options = "";
                select = select.length == 0 ? mainAnchorList[0].value : select;
                mainAnchorList.forEach(function (element) {
                    if (element.value == select) {
                        options += "<option value=\"" + element.value + "\" selected=\"selected\">" +
                            element.value + "</option>";
                    } else {
                        options += "<option value=\"" + element.value + "\">" + element.value +
                            "</option>";
                    }
                });
                return options;
            },
            anchorDropdown: function (select) {
                var anchorList = document.getElementsByName("list_anchor_id");
                var options = "";
                select = select.length == 0 ? anchorList[0].value : select;
                anchorList.forEach(function (element) {
                    if (element.value == select) {
                        options += "<option value=\"" + element.value + "\" selected=\"selected\">" +
                            element.value + "</option>";
                    } else {
                        options += "<option value=\"" + element.value + "\">" + element.value +
                            "</option>";
                    }
                });
                return options;
            }
        },
        edit: function (main_anchor_id, set_x, set_y) {
            if (main_anchor_id == "")
                return;
            var groupList = GetRowsDatas.group();
            var count = 0;
            $("#table_edit_grouplist tbody").empty();
            groupList.forEach(function (element) {
                if (element.main_anchor_id == main_anchor_id) {
                    count++;
                    $("#table_edit_grouplist tbody").append("<tr>" +
                        "<td><input type=\"hidden\" name=\"checkbox_edit_grouplist\" />" + count + "</td>" +
                        "<td><input type=\"text\" name=\"edit_grouplist_id\" value=\"" +
                        element.group_id + "\" style=\"max-width:80px; background:white;\" disabled/></td>" +
                        "<td><input type=\"text\" name=\"edit_grouplist_name\" value=\"" +
                        element.group_name + "\" style=\"max-width:80px; background:white;\" /></td></tr>");
                }
            });
            $("#label_edit_grouplist_add").hide();
            $("#label_edit_grouplist_delete").hide();
            $("#edit_grouplist_main_anchor").html(this.Get.mainAnchorDropdown(main_anchor_id)).prop("disabled", true);
            $("#edit_grouplist_main_anchor_x").val(set_x);
            $("#edit_grouplist_main_anchor_y").val(set_y);
            $("#dialog_edit_group_list").dialog("open");
        },
        draw: function (anchorArr) {
            var anchorGroupArray = this.Update.groupAnchorList();
            var groupArray = this.Update.groupList();
            groupArray.forEach(function (id) {
                var group = new Group();
                anchorGroupArray.forEach(function (element) {
                    if (element.group_id == id) {
                        var i = anchorArr.findIndex(function (anchor) {
                            return anchor.id == element.anchor_id;
                        });
                        if (i > -1)
                            group.setAnchor(anchorArr[i].id, anchorArr[i].x, anchorArr[i].y);
                    }
                });
                group.drawGroup();
            });
        },
        bindChange: function (element_id, element_name) { //連動Group的id與name
            var groupList = GetRowsDatas.group();
            $(element_id).off('change');
            $(element_name).off('change');
            $(element_id).each(function (i) {
                $(this).on("change", function () {
                    var index = groupList.findIndex(function (info) {
                        return info.group_id == $(element_id).eq(i).val();
                    });
                    if (index > -1)
                        $(element_name).eq(i).val(groupList[index].group_name);
                });
                $(element_name).eq(i).on("change", function () {
                    var index = groupList.findIndex(function (info) {
                        return info.group_name == $(element_name).eq(i).val();
                    });
                    if (index > -1)
                        $(element_id).eq(i).val(groupList[index].group_id);
                });
            });
        }
    },
    GetRowsDatas = {
        groupAnchor: function () {
            var ids = document.getElementsByName("anchorgroup_id");
            var group_ids = document.getElementsByName("anchorgroup_group_id");
            var group_names = document.getElementsByName("anchorgroup_group_name");
            var main_anc_ids = document.getElementsByName("anchorgroup_main_anchor_id");
            var anchor_ids = document.getElementsByName("anchorgroup_anchor_id");
            var list = [];
            ids.forEach(function (id, i) {
                list.push({
                    id: id.value,
                    group_id: group_ids[i].value,
                    group_name: group_names[i].value,
                    main_anchor_id: main_anc_ids[i].value,
                    anchor_id: anchor_ids[i].value
                });
            });
            return list;
        },
        group: function () {
            var group_ids = document.getElementsByName("chkbox_group_list");
            var group_names = document.getElementsByName("grouplist_name");
            var main_anc_ids = document.getElementsByName("grouplist_main_anchor_id");
            var list = [];
            group_ids.forEach(function (group_id, i) {
                list.push({
                    group_id: group_id.value,
                    group_name: group_names[i].value,
                    main_anchor_id: main_anc_ids[i].value
                });
            });
            return list;
        }
    };