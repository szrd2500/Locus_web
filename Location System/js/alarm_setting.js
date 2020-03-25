var switch_on = "<img class='switch-img' src=\"../image/success.png\"/>",
    switch_off = "<img class='switch-img' src=\"../image/error.png\"/>",
    TimeGroupArr = [],
    count_alarm_group = 0,
    submit_type = {
        alarm: "",
        time_group: "",
        time_slot: "",
        fence: "",
        fence_alarm_group: ""
    },
    alarmSettingArr = [],
    alarmModeArray = [{
        id: "Fence",
        name: 'i_electronicFence'
    }, {
        id: "stay",
        name: 'i_stayAlarm'
    }, {
        id: "hidden",
        name: 'i_hiddenAlarm'
    }],
    AlarmGroupFunc = {
        Dialog: {
            init: function () {
                var dialog, form,
                    name = $("#add_alarm_mode_name"),
                    fenceAG_id = $("#add_alarm_mode_0_fagID"),
                    fenceAG_time = $("#add_alarm_mode_0_time"),
                    stay_time = $("#add_alarm_mode_1_time"),
                    hidden_time = $("#add_alarm_mode_2_time"),
                    time_group = $("#add_alarm_time_group"),
                    allFields = $([]).add(name).add(fenceAG_id).add(fenceAG_time).add(stay_time).add(hidden_time).add(time_group),
                    SendResult = function () {
                        allFields.removeClass("ui-state-error");
                        var valid = true;
                        valid = valid && checkLength(name, $.i18n.prop('i_alarmAlert_4'), 1, 100);
                        if ($("#add_alarm_mode_0").prop("checked")) {
                            valid = valid && checkLength(fenceAG_id, $.i18n.prop('i_alarmAlert_49'), 1, 100);
                            valid = valid && checkLength(fenceAG_time, $.i18n.prop('i_alarmAlert_4'), 1, 100);
                        }
                        if ($("#add_alarm_mode_1").prop("checked"))
                            valid = valid && checkLength(stay_time, $.i18n.prop('i_alarmAlert_4'), 1, 100);
                        if ($("#add_alarm_mode_2").prop("checked"))
                            valid = valid && checkLength(hidden_time, $.i18n.prop('i_alarmAlert_4'), 1, 100);
                        valid = valid && checkLength(time_group, $.i18n.prop('i_alarmAlert_4'), 1, 100);
                        if (valid) {
                            if (submit_type["alarm"] == "Add")
                                AlarmGroupFunc.Request.add();
                            else if (submit_type["alarm"] == "Edit")
                                AlarmGroupFunc.Request.edit();
                        }
                    };
                dialog = $("#dialog_add_alarm_group").dialog({
                    autoOpen: false,
                    height: 430,
                    width: 430,
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
            }
        },
        Request: {
            add: function () {
                var addIdXmlHttp = createJsonXmlHttp("sql");
                addIdXmlHttp.onreadystatechange = function () {
                    if (addIdXmlHttp.readyState == 4 || addIdXmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            var revInfo = revObj.Value[0].Values || [],
                                alarmModeGroupArr = [],
                                isAddFenceAG = false;
                            for (var i = 0; i < alarmModeArray.length; i++) {
                                var isSwitch = "0",
                                    alarm_value = "-1";
                                if ($("input[name=add_alarm_mode]").eq(i).prop("checked")) {
                                    isSwitch = "1";
                                    if (i == 0) {
                                        var fag_info_id = $("#add_alarm_mode_0_id").val();
                                        alarm_value = fag_info_id.length == 0 ? "-1" : fag_info_id;
                                        isAddFenceAG = true;
                                    } else {
                                        var alarm_time = $("#add_alarm_mode_" + i + "_time").val();
                                        alarm_value = alarm_time.length == 0 ? "-1" : alarm_time;
                                    }
                                }
                                alarmModeGroupArr.push({
                                    "alarm_name": alarmModeArray[i].id,
                                    "alarm_switch": isSwitch,
                                    "alarm_value": alarm_value,
                                    "alarm_group_id": revInfo.alarm_gid
                                });
                            }
                            var addXmlHttp = createJsonXmlHttp("sql");
                            addXmlHttp.onreadystatechange = function () {
                                if (addXmlHttp.readyState == 4 || addXmlHttp.readyState == "complete") {
                                    var revObj2 = JSON.parse(this.responseText);
                                    if (checkTokenAlive(revObj2) && revObj2.Value[0].success > 0) {
                                        if (isAddFenceAG)
                                            FenceAlarmGroupFunc.add(revInfo.alarm_gid);
                                        else {
                                            AlarmGroupFunc.get();
                                            $("#dialog_add_alarm_group").dialog("close");
                                        }
                                        alert($.i18n.prop('i_alarmAlert_54'));
                                    } else {
                                        alert($.i18n.prop('i_alarmAlert_55'));
                                    }
                                }
                            };
                            addXmlHttp.send(JSON.stringify({
                                "Command_Type": ["Write"],
                                "Command_Name": ["AddAlarmInfo"],
                                "Value": alarmModeGroupArr,
                                "api_token": [token]
                            }));
                        } else {
                            alert($.i18n.prop('i_alarmAlert_55'));
                        }
                    }
                };
                addIdXmlHttp.send(JSON.stringify({
                    "Command_Type": ["Write"],
                    "Command_Name": ["AddAlarmGroup"],
                    "Value": {
                        "alarm_group_name": $("#add_alarm_mode_name").val(),
                        "time_group_id": $("#add_alarm_time_group").val()
                    },
                    "api_token": [token]
                }));
            },
            edit: function () {
                var group_id = $("#edit_alarm_group_id").val(),
                    addIdXmlHttp = createJsonXmlHttp("sql");
                addIdXmlHttp.onreadystatechange = function () {
                    if (addIdXmlHttp.readyState == 4 || addIdXmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            var alarmModeGroupArr = [];
                            for (var i = 0; i < alarmModeArray.length; i++) {
                                var isSwitch = "0",
                                    alarm_value = "-1";
                                if ($("input[name=add_alarm_mode]").eq(i).prop("checked")) {
                                    isSwitch = "1";
                                    if (i == 0) {
                                        var fag_info_id = $("#add_alarm_mode_0_id").val();
                                        alarm_value = fag_info_id.length > 0 ? fag_info_id : "-1";
                                    } else {
                                        var alarm_time = $("#add_alarm_mode_" + i + "_time").val();
                                        alarm_value = alarm_time.length > 0 ? alarm_time : "-1";
                                    }
                                }
                                alarmModeGroupArr.push({
                                    "alarm_iid": $("input[name=add_alarm_mode]").eq(i).val(),
                                    "alarm_name": alarmModeArray[i].id,
                                    "alarm_switch": isSwitch,
                                    "alarm_value": alarm_value,
                                    "alarm_group_id": group_id
                                });
                            }
                            var addXmlHttp = createJsonXmlHttp("sql");
                            addXmlHttp.onreadystatechange = function () {
                                if (addXmlHttp.readyState == 4 || addXmlHttp.readyState == "complete") {
                                    var revObj2 = JSON.parse(this.responseText);
                                    if (checkTokenAlive(revObj2) && revObj2.Value[0].success > 0) {
                                        FenceAlarmGroupFunc.edit(group_id);
                                        alert($.i18n.prop('i_alarmAlert_56'));
                                    } else {
                                        alert($.i18n.prop('i_alarmAlert_57'));
                                    }
                                }
                            };
                            addXmlHttp.send(JSON.stringify({
                                "Command_Type": ["Write"],
                                "Command_Name": ["EditAlarmInfo"],
                                "Value": alarmModeGroupArr,
                                "api_token": [token]
                            }));
                        } else {
                            alert($.i18n.prop('i_alarmAlert_57'));
                        }
                    }
                };
                addIdXmlHttp.send(JSON.stringify({
                    "Command_Type": ["Write"],
                    "Command_Name": ["EditAlarmGroupInfo"],
                    "Value": {
                        "alarm_gid": group_id,
                        "alarm_group_name": $("#add_alarm_mode_name").val(),
                        "time_group_id": $("#add_alarm_time_group").val()
                    },
                    "api_token": [token]
                }));
            }
        },
        get: function () {
            var alarmRequest = {
                "Command_Type": ["Read"],
                "Command_Name": ["GetAlarmGroup_list"],
                "api_token": [token]
            };
            var alarmXmlHttp = createJsonXmlHttp("sql");
            alarmXmlHttp.onreadystatechange = function () {
                if (alarmXmlHttp.readyState == 4 || alarmXmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (!checkTokenAlive(revObj)) {
                        return;
                    } else if (revObj.Value[0].success > 0) {
                        //get all data of alarm_group and input alarmSettingArr variable
                        alarmSettingArr = "Values" in revObj.Value[0] ? revObj.Value[0].Values.slice(0) : [];
                        //send request to get all data of fence_alarm_group
                        var fagRequest = {
                            "Command_Type": ["Read"],
                            "Command_Name": ["GetFence_Alarm_Group_info_ALL"],
                            "api_token": [token]
                        };
                        var fagXmlHttp = createJsonXmlHttp("sql");
                        fagXmlHttp.onreadystatechange = function () {
                            if (fagXmlHttp.readyState == 4 || fagXmlHttp.readyState == "complete") {
                                var response = JSON.parse(this.responseText);
                                if (!checkTokenAlive(response)) {
                                    return;
                                } else if (response.Value[0].success > 0) {
                                    var values = response.Value[0].Values || [];
                                    $("#table_alarm_mode tbody").empty();
                                    count_alarm_group = 0;
                                    alarmSettingArr.forEach(function (ag_info) {
                                        var modeCheckHtml = "";
                                        if ("elements" in ag_info) {
                                            for (j = 0; j < alarmModeArray.length; j++) {
                                                var alarm_value = ag_info.elements[j].alarm_value == "-1" ? "" : ag_info.elements[j].alarm_value,
                                                    state = ag_info.elements[j].alarm_switch == "0" ? switch_off : switch_on;
                                                if (j == 0) {
                                                    var fag_index = values.findIndex(function (info) {
                                                        return info.alarm_group_id == ag_info.alarm_gid;
                                                    });
                                                    if (fag_index > -1) {
                                                        var fag_info = values[fag_index];
                                                        ag_info.elements[j]["alarm_value"] = fag_info.id || "";
                                                        ag_info.elements[j]["fenceAG_id"] = fag_info.fenceAG_id || "";
                                                        ag_info.elements[j]["overtime_hour"] = fag_info.overtime_hour || "";
                                                        modeCheckHtml += "<td>" + state + (fag_info.fenceAG_id != "" ? " " + $.i18n.prop('i_fenceAlarmGroup') + " : " +
                                                            fag_info.fenceAG_id + " , " + $.i18n.prop('i_time') + " : " +
                                                            (fag_info.overtime_hour != "" ? fag_info.overtime_hour + " " + $.i18n.prop('i_hour') : "") : "") + "</td>";
                                                    } else {
                                                        modeCheckHtml += "<td>" + state + "</td>";
                                                    }
                                                } else {
                                                    modeCheckHtml += "<td>" + state +
                                                        (alarm_value != "" ? " " + $.i18n.prop('i_time') + " : " + alarm_value + " " + $.i18n.prop('i_second') : "") + "</td>";
                                                }
                                            }
                                        }
                                        count_alarm_group++;
                                        var tr_id = "tr_alarm_group_" + count_alarm_group,
                                            t_index = TimeGroupArr.findIndex(function (info) {
                                                return info.time_group_id == ag_info.time_group_id;
                                            }),
                                            timeGroupName = (t_index > -1) ? TimeGroupArr[t_index].time_group_name : "";
                                        $("#table_alarm_mode tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                                            "<input type=\"checkbox\" name=\"chkbox_alarm_group\" value=\"" + ag_info.alarm_gid + "\"" +
                                            " onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + count_alarm_group + "</td>" +
                                            "<td><label name=\"alarm_group_name\" style=\"width:100px;\" >" +
                                            ag_info.alarm_group_name + "</label></td>" + modeCheckHtml +
                                            "<td><label id=\"alarm_group_time\">" + timeGroupName + "</label></td>" +
                                            "<td style='text-align:center;'><label for=\"btn_edit_alarm_mode_" + count_alarm_group +
                                            "\" class='btn-edit' title='" + $.i18n.prop('i_editAlarmGroup') + "'><i class='fas fa-edit'" +
                                            " style='font-size:18px;'></i></label><input id=\"btn_edit_alarm_mode_" + count_alarm_group +
                                            "\" type='button' class='btn-hidden' onclick=\"AlarmGroupFunc.edit(\'" + ag_info.alarm_gid + "\')\" />" +
                                            "</td></tr>");
                                    });
                                } else {
                                    alert($.i18n.prop('i_alarmAlert_48'));
                                }
                            }
                        };
                        fagXmlHttp.send(JSON.stringify(fagRequest));
                    } else {
                        alert($.i18n.prop('i_alarmAlert_1'));
                    }
                }
            };
            alarmXmlHttp.send(JSON.stringify(alarmRequest));
        },
        edit: function (id) {
            var index = alarmSettingArr.findIndex(function (info) {
                return info.alarm_gid == id;
            });
            var groupElement = alarmSettingArr[index].elements;
            $("#edit_alarm_group_id").val(alarmSettingArr[index].alarm_gid)
            $("#add_alarm_mode_name").val(alarmSettingArr[index].alarm_group_name);
            for (j = 0; j < alarmModeArray.length; j++) {
                var isCheck = false;
                if (groupElement[j].alarm_switch == "1")
                    isCheck = true;
                if (j == 0) {
                    $("#add_alarm_mode_0_id").val(groupElement[j].alarm_value || "-1");
                    $("#add_alarm_mode_0_fagID").val(
                        groupElement[j].fenceAG_id || $("#add_alarm_mode_0_fagID option:eq(0)").val()
                    );
                    $("#add_alarm_mode_0_time").val(groupElement[j].overtime_hour || "");
                } else {
                    var alarm_value = groupElement[j].alarm_value == "-1" ? "" : groupElement[j].alarm_value;
                    $("#add_alarm_mode_" + j + "_time").val(alarm_value);
                }
                $("input[name=add_alarm_mode]").eq(j).prop("checked", isCheck).val(groupElement[j].alarm_iid);
            }
            $("#add_alarm_time_group").html(
                createOptions_name(TimeGroupArr, alarmSettingArr[index].time_group_id)
            );
            $("#add_alarm_time_group").val(alarmSettingArr[index].time_group_id);
            submit_type["alarm"] = "Edit";
            $("#dialog_add_alarm_group").dialog("open");
        },
        editFence: function (id) {
            var request = {
                "Command_Type": ["Write"],
                "Command_Name": ["EditAlarmInfo"],
                "Value": [{
                    "alarm_iid": $("input[name=add_alarm_mode]").eq(0).val(),
                    "alarm_name": alarmModeArray[0].id,
                    "alarm_switch": $("input[name=add_alarm_mode]").eq(0).prop("checked") ? "1" : "0",
                    "alarm_value": id,
                    "alarm_group_id": $("#edit_alarm_group_id").val()
                }],
                "api_token": [token]
            };
            var editXmlHttp = createJsonXmlHttp("sql");
            editXmlHttp.onreadystatechange = function () {
                if (editXmlHttp.readyState == 4 || editXmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        AlarmGroupFunc.get();
                        $("#dialog_add_alarm_group").dialog("close");
                    }
                }
            };
            editXmlHttp.send(JSON.stringify(request));
        },
        addClick: function () {
            $("#add_alarm_time_group").empty();
            if (TimeGroupArr.length > 0) {
                $("#add_alarm_time_group").append(
                    createOptions_name(TimeGroupArr, TimeGroupArr[0].time_group_id)
                );
            }
            $("#add_alarm_mode_0_fagID option").eq(0).prop("selected", true);
            $("input[name=add_alarm_mode]").val("");
            $("input[name=add_alarm_mode_time").val("");
            submit_type["alarm"] = "Add";
            $("#dialog_add_alarm_group").dialog("open");
        },
        deleteClick: function () {
            var checkboxs = document.getElementsByName("chkbox_alarm_group");
            var sel_group_arr = [];
            for (var i = 0; i < checkboxs.length; i++) {
                if (checkboxs[i].checked)
                    sel_group_arr.push({
                        "alarm_gid": checkboxs[i].value
                    });
            }
            if (sel_group_arr.length == 0)
                return alert($.i18n.prop('i_alarmAlert_5'));
            if (confirm($.i18n.prop('i_alarmAlert_60'))) {
                var request_DelInfo = JSON.stringify({
                    "Command_Type": ["Write"],
                    "Command_Name": ["DeleteAlarmGroupInfo"],
                    "Value": sel_group_arr,
                    "api_token": [token]
                });
                var deleteIDXmlHttp = createJsonXmlHttp("sql");
                deleteIDXmlHttp.onreadystatechange = function () {
                    if (deleteIDXmlHttp.readyState == 4 || deleteIDXmlHttp.readyState == "complete") {
                        var revObj = JSON.parse(this.responseText);
                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                            var sel_alarm_arr = [];
                            for (j in sel_group_arr) {
                                var g_index = alarmSettingArr.findIndex(function (info) {
                                    return info.alarm_gid == sel_group_arr[j].alarm_gid;
                                });
                                alarmSettingArr[g_index].elements.forEach(function (element) {
                                    sel_alarm_arr.push({
                                        "alarm_iid": element.alarm_iid
                                    });
                                });
                            }
                            var requestElements = JSON.stringify({
                                "Command_Type": ["Write"],
                                "Command_Name": ["DeleteAlarmInfo"],
                                "Value": sel_alarm_arr,
                                "api_token": [token]
                            });
                            var deleteXmlHttp = createJsonXmlHttp("sql");
                            deleteXmlHttp.onreadystatechange = function () {
                                if (deleteXmlHttp.readyState == 4 || deleteXmlHttp.readyState == "complete") {
                                    var revObj = JSON.parse(this.responseText);
                                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                        FenceAlarmGroupFunc.delete();
                                        alert($.i18n.prop('i_alarmAlert_58'));
                                    } else {
                                        alert($.i18n.prop('i_alarmAlert_59'));
                                    }
                                }
                            };
                            deleteXmlHttp.send(requestElements);
                        } else {
                            alert($.i18n.prop('i_alarmAlert_59'));
                        }
                    }
                };
                deleteIDXmlHttp.send(request_DelInfo);
            }
        }
    };

$(function () {
    var h = document.documentElement.clientHeight;
    //$(".container").css("height", h - 10 + "px");
    //$(".cvsBlock").css("height", h - 152 + "px");
    $(".table-block").css("height", h - 163 + "px");
    $(".cvsBlock").css("height", h - 157 + "px");
    $("#block_fence_info .block-list").css("height", h - 301 + "px");
    $("#block_fence_alarm_group .block-list").css("height", h - 253 + "px");
    /* Check this page's permission and load navbar */
    loadUserData();
    checkPermissionOfPage("Alarm_Setting");
    setNavBar("Alarm_Setting", "");
    /* Time Setting */
    $('.timepicker').bootstrapMaterialDatePicker({
        date: false,
        clearButton: true,
        lang: 'en',
        format: 'HH:mm'
    });
    /* Add Alarm Group */
    $("#btn_add_alarm_group").button().on("click", AlarmGroupFunc.addClick);
    /* Delete Alarm Groups */
    $("#btn_delete_alarm_group").button().on("click", AlarmGroupFunc.deleteClick);
    /* Draw */
    setupCanvas();
    /* Dialog */
    AlarmGroupFunc.Dialog.init();
    FenceFunc.Dialog.init(); //../js/fence_setting.js
    FenceAlarmGroupFunc.Dialog.init(); //../js/fence_alarm_group.js
    TimeSlotFunc.Dialog.init(); //../js/time_slot_setting.js
    TimeGroupFunc.Dialog.init(); //../js/time_slot_group_setting.js
});

function createOptions_name(array, select_id) {
    var options = "";
    array.forEach(function (element) {
        if (element.id == select_id) {
            options += "<option value=\"" + element.id + "\" selected=\"selected\">" +
                element.name + "</option>";
        } else {
            options += "<option value=\"" + element.id + "\">" + element.name + "</option>";
        }
    });
    return options;
}