var FenceFunc = {
    Dialog: {
        addInfo: function () { //Dialog to add fence.
            var dialog, form,
                add_fence_id = $("#add_fence_id"),
                add_fence_name = $("#add_fence_name"),
                allFields = $([]).add(add_fence_name),
                SendResult = function () {
                    allFields.removeClass("ui-state-error");
                    var valid = true;
                    valid = valid && checkLength(add_fence_name, $.i18n.prop('i_alarmAlert_38'), 1, 100);
                    if (submit_type["fence"] == "Add") {
                        document.getElementsByName("fence_name").forEach(function (element) {
                            if (element.innerText == add_fence_name.val()) {
                                valid = false;
                                add_fence_name.addClass("ui-state-error");
                                return alert($.i18n.prop('i_alarmAlert_53'));
                            }
                        });
                    }
                    if (document.getElementsByName("chkbox_fence_dot_setting").length != 4) {
                        alert($.i18n.prop('i_alarmAlert_33'));
                        return;
                    }
                    if (valid) {
                        if (submit_type["fence"] == "Add") {
                            var fence_name = add_fence_name.val();
                            var addRequest = {
                                "Command_Type": ["Write"],
                                "Command_Name": ["AddFenceInfo"],
                                "Value": [{
                                    "fence_name": fence_name,
                                    "map_id": $("#select_map_id").val(),
                                    "list_type": "black"
                                }],
                                "api_token": [token]
                            };
                            var addXmlHttp = createJsonXmlHttp("sql");
                            addXmlHttp.onreadystatechange = function () {
                                if (addXmlHttp.readyState == 4 || addXmlHttp.readyState == "complete") {
                                    var revObj = JSON.parse(this.responseText);
                                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                        var fence_id_arr = Object.keys(revObj.Value[0]);
                                        fence_id_arr.splice(fence_id_arr.indexOf("success"), 1);
                                        for (i in fence_id_arr) {
                                            if (revObj.Value[0][fence_id_arr[i]].info &&
                                                revObj.Value[0][fence_id_arr[i]].info[0].fence_name == fence_name) {
                                                FenceFunc.Add.fencePoints(fence_id_arr[i]);
                                                FenceFunc.Add.fenceGroups(fence_id_arr[i]);
                                            }
                                        }
                                    }
                                }
                            };
                            addXmlHttp.send(JSON.stringify(addRequest));
                        } else if (submit_type["fence"] == "Edit") {
                            if (add_fence_id.val() == "") {
                                alert($.i18n.prop('i_alarmAlert_38'));
                                return;
                            }
                            var editXmlHttp = createJsonXmlHttp("sql");
                            editXmlHttp.onreadystatechange = function () {
                                if (editXmlHttp.readyState == 4 || editXmlHttp.readyState == "complete") {
                                    var revObj = JSON.parse(this.responseText);
                                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                        var fd_editXmlHttp = createJsonXmlHttp("sql");
                                        fd_editXmlHttp.onreadystatechange = function () {
                                            if (fd_editXmlHttp.readyState == 4 || fd_editXmlHttp.readyState == "complete") {
                                                var fd_revObj = JSON.parse(this.responseText);
                                                if (checkTokenAlive(fd_revObj) && fd_revObj.Value[0].success > 0) {
                                                    FenceFunc.Add.fencePoints(add_fence_id.val());
                                                }
                                            }
                                        };
                                        fd_editXmlHttp.send(JSON.stringify({
                                            "Command_Type": ["Write"],
                                            "Command_Name": ["DeleteFence_point_by_fid"],
                                            "Value": [{
                                                "fence_id": add_fence_id.val()
                                            }],
                                            "api_token": [token]
                                        }));
                                        var fg_editXmlHttp = createJsonXmlHttp("sql");
                                        fg_editXmlHttp.onreadystatechange = function () {
                                            if (fg_editXmlHttp.readyState == 4 || fg_editXmlHttp.readyState == "complete") {
                                                var fg_revObj = JSON.parse(this.responseText);
                                                var count_group = addFenceContainGroup.length;
                                                if (checkTokenAlive(fg_revObj) && fg_revObj.Value[0].success > 0 && count_group > 0) {
                                                    FenceFunc.Add.fenceGroups(add_fence_id.val());
                                                }
                                            }
                                        };
                                        fg_editXmlHttp.send(JSON.stringify({
                                            "Command_Type": ["Write"],
                                            "Command_Name": ["DeleteFence_group_by_fid"],
                                            "Value": [{
                                                "fence_id": add_fence_id.val()
                                            }],
                                            "api_token": [token]
                                        }));
                                    }
                                }
                            };
                            editXmlHttp.send(JSON.stringify({
                                "Command_Type": ["Write"],
                                "Command_Name": ["EditFence_Info"],
                                "Value": {
                                    "fence_id": add_fence_id.val(),
                                    "fence_name": add_fence_name.val(),
                                    "map_id": $("#select_map_id").val(),
                                    "list_type": "black"
                                },
                                "api_token": [token]
                            }));
                        } else {
                            alert($.i18n.prop('i_alertError_9'));
                        }
                        dialog.dialog("close");
                    }
                    return valid;
                };
            dialog = $("#dialog_add_fence").dialog({
                autoOpen: false,
                height: 600,
                width: 400,
                modal: false,
                buttons: {
                    "Confirm": function () {
                        SendResult();
                        resetFencePosition();
                    },
                    "Cancel": function () {
                        dialog.dialog("close");
                    }
                },
                "close": function () {
                    form[0].reset();
                    allFields.removeClass("ui-state-error");
                    resetFencePosition();
                }
            });
            form = dialog.find("form").on("submit", function (event) {
                event.preventDefault();
                SendResult();
                resetFencePosition();
            });
            $("#btn_fence_add").button().on("click", function () {
                if ($("#select_map_id").val() == '') {
                    alert($.i18n.prop('i_alarmAlert_29'));
                } else {
                    submit_type["fence"] = "Add";
                    addFenceDotArray = [];
                    addFenceContainGroup = [];
                    $("#table_fence_dot_setting tbody").empty();
                    $("#table_fence_group tbody").empty();
                    dialog.dialog("open");
                }
            });
            $("#btn_fence_delete").button().on("click", function () {
                if ($("#select_map_id").val() == '') {
                    alert($.i18n.prop('i_alarmAlert_29'));
                    return;
                }
                var checkboxs = document.getElementsByName("chkbox_fence_setting");
                var delete_arr = [];
                for (var k = 0; k < checkboxs.length; k++) {
                    if (checkboxs[k].checked) {
                        delete_arr.push({
                            "fence_id": checkboxs[k].value
                        });
                    }
                }
                if (delete_arr.length == 0)
                    return alert($.i18n.prop('i_alarmAlert_62'));
                if (confirm($.i18n.prop('i_alarmAlert_63'))) {
                    //刪除圍籬資訊
                    var del_xmlHttp = createJsonXmlHttp("sql");
                    del_xmlHttp.onreadystatechange = function () {
                        if (del_xmlHttp.readyState == 4 || del_xmlHttp.readyState == "complete") {
                            var del_response = JSON.parse(this.responseText);
                            if (checkTokenAlive(del_response) && del_response.Value[0].success == delete_arr.length) {
                                //刪除此圍籬的所有座標點
                                var fd_xmlHttp = createJsonXmlHttp("sql");
                                fd_xmlHttp.onreadystatechange = function () {
                                    if (fd_xmlHttp.readyState == 4 || fd_xmlHttp.readyState == "complete") {
                                        var fd_response = JSON.parse(this.responseText);
                                        if (checkTokenAlive(fd_response) && fd_response.Value[0].success > 0) {
                                            //刪除此圍籬的所有群組
                                            var fg_xmlHttp = createJsonXmlHttp("sql");
                                            fg_xmlHttp.onreadystatechange = function () {
                                                if (fg_xmlHttp.readyState == 4 || fg_xmlHttp.readyState == "complete") {
                                                    var fg_response = JSON.parse(this.responseText);
                                                    if (checkTokenAlive(fg_response))
                                                        updateFenceTable(); //更新列表
                                                }
                                            };
                                            fg_xmlHttp.send(JSON.stringify({
                                                "Command_Type": ["Write"],
                                                "Command_Name": ["DeleteFence_group_by_fid"],
                                                "Value": delete_arr,
                                                "api_token": [token]
                                            }));
                                        }
                                    }
                                };
                                fd_xmlHttp.send(JSON.stringify({
                                    "Command_Type": ["Write"],
                                    "Command_Name": ["DeleteFence_point_by_fid"],
                                    "Value": delete_arr,
                                    "api_token": [token]
                                }));
                            } else {
                                alert($.i18n.prop('i_alarmAlert_35') + (delete_arr.length - del_response.Value[0].success));
                            }
                        }
                    };
                    del_xmlHttp.send(JSON.stringify({
                        "Command_Type": ["Write"],
                        "Command_Name": ["DeleteFence_info"],
                        "Value": delete_arr,
                        "api_token": [token]
                    }));
                }
            });
        },
        addPoints: function () { //Dialog to add the fence points.
            var dialog, form,
                add_x = $("#add_dot_x"),
                add_y = $("#add_dot_y"),
                allFields = $([]).add(add_x).add(add_y),
                SendResult = function () {
                    allFields.removeClass("ui-state-error");
                    var valid = true;
                    valid = valid && checkLength(add_x, $.i18n.prop('i_alarmAlert_36'), 1, 20);
                    valid = valid && checkLength(add_y, $.i18n.prop('i_alarmAlert_37'), 1, 20);
                    if (valid) {
                        addDotArray(add_x.val(), add_y.val());
                        dialog.dialog("close");
                    }
                };
            dialog = $("#dialog_add_fence_dot").dialog({
                autoOpen: false,
                height: 300,
                width: 250,
                modal: true,
                buttons: {
                    "Confirm": SendResult,
                    Cancel: function () {
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
                SendResult();
            });
            $("#btn_fence_dot_add").button().on("click", function () {
                dialog.dialog("open");
            });
            $("#btn_fence_dot_delete").button().on("click", deleteDotArray);
        },
        init: function () {
            this.addInfo();
            this.addPoints();
        }
    },
    Get: {
        fencePoints: function (f_id) {
            var request = {
                "Command_Type": ["Read"],
                "Command_Name": ["GetFence_point"],
                "Value": {
                    "fence_id": f_id
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
                        submit_type["fence"] = "Edit";
                        var fencePoints = revObj.Value[0].Values || [];
                        $("#table_fence_dot_setting tbody").empty();
                        for (j = 0; j < fencePoints.length; j++) {
                            var tr_id = "tr_fence_dot_setting_" + fencePoints[j].point_order;
                            $("#table_fence_dot_setting tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                                "<input type=\"checkbox\" name=\"chkbox_fence_dot_setting\" value=\"" + tr_id +
                                "\" onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + (j + 1) + "</td>" +
                                "<td><label name=\"dot_x\">" + fencePoints[j].point_x + "</label></td>" +
                                "<td><label name=\"dot_y\">" + fencePoints[j].point_y + "</label></td></tr>");
                        }
                    } else {
                        alert($.i18n.prop('i_alertError_9'));
                    }
                }
            };
            xmlHttp.send(JSON.stringify(request));
        },
        fenceGroups: function (f_id) {
            var request = {
                "Command_Type": ["Read"],
                "Command_Name": ["GetFence_group"],
                "Value": {
                    "fence_id": f_id
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
                        submit_type["fence"] = "Edit";
                        var fenceGroups = revObj.Value[0].Values || [];
                        $("#table_fence_group tbody").empty();
                        fenceGroups.forEach(function (element, index) {
                            $("#table_fence_group tbody").append("<tr><td>" + (index + 1) + "</td>" +
                                "<td name=\"fence_groups\">" + element.group_name + "</td></tr>");
                        });
                    } else {
                        alert($.i18n.prop('i_alertError_9'));
                    }
                }
            };
            xmlHttp.send(JSON.stringify(request));
        }
    },
    Add: {
        fencePoints: function (f_id) {
            var add_point_arr = [];
            var order = document.getElementsByName("chkbox_fence_dot_setting");
            var x = document.getElementsByName("dot_x");
            var y = document.getElementsByName("dot_y");
            order.forEach(function (element, index) {
                add_point_arr.push({
                    "fence_id": f_id,
                    "point_order": (index + 1).toString(),
                    "point_x": x[index].innerText,
                    "point_y": y[index].innerText
                });
            });
            var fd_addXmlHttp = createJsonXmlHttp("sql");
            fd_addXmlHttp.onreadystatechange = function () {
                if (fd_addXmlHttp.readyState == 4 || fd_addXmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        addFenceDotArray = [];
                        updateFenceTable();
                    } else {
                        alert($.i18n.prop('i_alarmAlert_32'));
                    }
                }
            };
            fd_addXmlHttp.send(JSON.stringify({
                "Command_Type": ["Write"],
                "Command_Name": ["AddFencePoint"],
                "Value": add_point_arr,
                "api_token": [token]
            }));
        },
        fenceGroups: function (f_id) {
            var add_group_arr = [];
            addFenceContainGroup.forEach(function (element) {
                add_group_arr.push({
                    "fence_id": f_id,
                    "group_id": element.g_id
                });
            });
            if (add_group_arr.length == 0) {
                addFenceContainGroup = [];
            } else {
                var fg_addXmlHttp = createJsonXmlHttp("sql");
                fg_addXmlHttp.onreadystatechange = function () {
                    if (fg_addXmlHttp.readyState == 4 || fg_addXmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            addFenceContainGroup = [];
                        } else {
                            alert($.i18n.prop('i_alarmAlert_32'));
                        }
                    }
                };
                fg_addXmlHttp.send(JSON.stringify({
                    "Command_Type": ["Write"],
                    "Command_Name": ["AddFenceGroup"],
                    "Value": add_group_arr,
                    "api_token": [token]
                }));
            }
        }
    },
    edit: function (f_id) {
        var request = {
            "Command_Type": ["Read"],
            "Command_Name": ["GetFence_info"],
            "Value": {
                "fence_id": f_id
            },
            "api_token": [token]
        };
        var xmlHttp = createJsonXmlHttp("sql");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    submit_type["fence"] = "Edit";
                    if (revObj.Value[0].Values) {
                        var editFence = revObj.Value[0].Values[0];
                        $("#add_fence_id").val(editFence.fence_id);
                        $("#add_fence_name").val(editFence.fence_name);
                        FenceFunc.Get.fencePoints(editFence.fence_id);
                        FenceFunc.Get.fenceGroups(editFence.fence_id);
                        $("#dialog_add_fence").dialog("open");
                    } else {
                        alert($.i18n.prop('i_alertError_9'));
                    }
                } else {
                    alert($.i18n.prop('i_alertError_9'));
                }
            }
        };
        xmlHttp.send(JSON.stringify(request));
    }
};