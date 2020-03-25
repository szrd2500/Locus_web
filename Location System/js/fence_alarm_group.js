/**
 * FAG = FenceAlarmGroup 圍籬警戒群組
 */
var FenceAlarmGroupFunc = {
    Dialog: {
        add: function (fenceAG_arr) {
            var xmlHttp = createJsonXmlHttp("sql");
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        if (revObj.Value[0].Value) {
                            var key = Object.keys(revObj.Value[0].Value);
                            FenceAlarmGroupFunc.update(key);
                            alert($.i18n.prop('i_alarmAlert_41'));
                        }
                    } else {
                        alert($.i18n.prop('i_alarmAlert_42'));
                    }
                }
            };
            xmlHttp.send(JSON.stringify({
                "Command_Type": ["Write"],
                "Command_Name": ["AddFenceAlarmGroup"],
                "Value": fenceAG_arr,
                "api_token": [token]
            }));
        },
        edit: function (fenceAG_arr) {
            var xmlHttp = createJsonXmlHttp("sql");
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        FenceAlarmGroupFunc.Dialog.add(fenceAG_arr);
                    } else {
                        alert($.i18n.prop('i_alarmAlert_44'));
                    }
                }
            };
            xmlHttp.send(JSON.stringify({
                "Command_Type": ["Write"],
                "Command_Name": ["DeleteFence_Alarm_Group"],
                "Value": [{
                    "fence_alarm_gid": $("#add_FAG_id").val()
                }],
                "api_token": [token]
            }));
        },
        init: function () {
            var dialog, form,
                SendResult = function () {
                    $("#add_FAG_id").removeClass("ui-state-error");
                    var valid = true && checkLength($("#add_FAG_id"), $.i18n.prop('i_alarmAlert_39'), 1, 20),
                        fence_ids = document.getElementsByName("included_fences"),
                        fag_id = $("#add_FAG_id").val();
                    if (/[^0-9]|\s\w*/.test(fag_id)) //判斷字串是否包含非數字
                        return alert("圍籬群組編號只能由數字組成，且不能包含空格!");
                    if (fence_ids.length == 0)
                        return alert($.i18n.prop('i_alarmAlert_40'));
                    if (valid) {
                        var fenceAG_arr = [];
                        for (var i = 0; i < fence_ids.length; i++) {
                            fenceAG_arr.push({
                                "fence_id": fence_ids[i].value,
                                "fence_alarm_gid": fag_id
                            });
                        }
                        if (submit_type["fence_alarm_group"] == "Add")
                            FenceAlarmGroupFunc.Dialog.add(fenceAG_arr);
                        else if (submit_type["fence_alarm_group"] == "Edit")
                            FenceAlarmGroupFunc.Dialog.edit(fenceAG_arr);
                        else
                            alert($.i18n.prop('i_alertError_9'));
                        dialog.dialog("close");
                    }
                };
            dialog = $("#dialog_fence_alarm_group").dialog({
                autoOpen: false,
                height: 600,
                width: 600,
                modal: false,
                buttons: {
                    "Confirm": function () {
                        SendResult();
                    },
                    "Cancel": function () {
                        dialog.dialog("close");
                    }
                },
                "close": function () {
                    form[0].reset();
                    $("#add_FAG_id").removeClass("ui-state-error");
                    $("#table_included_fences tbody").empty();
                    $("#table_remaining_fences tbody").empty();
                }
            });
            form = dialog.find("form").on("submit", function (event) {
                event.preventDefault();
                SendResult();
            });
            $("#btn_fence_list_add").on('click', FenceAlarmGroupFunc.inputList);
            $("#btn_fence_list_delete").on('click', FenceAlarmGroupFunc.outputList);
            $("#btn_fenceAG_add").on('click', function () {
                submit_type["fence_alarm_group"] = "Add";
                $("#add_FAG_id").val("").prop('disabled', false);
                for (i = 0; i < fenceArray.length; i++) {
                    var tr_id = "remaining_fences_" + fenceArray[i].fence_id;
                    $("#table_remaining_fences tbody").append("<tr id=\"" + tr_id + "\"" +
                        " onclick=\"beCheckedColumn(\'" + tr_id + "\')\">" +
                        "<td><input type=\"checkbox\" class=\"chk-hidden\"" +
                        " name=\"remaining_fences\"" +
                        " value=\"" + fenceArray[i].fence_id + "\" />" +
                        " <span>" + (i + 1) + "</span></td>" +
                        "<td>" + fenceArray[i].fence_id + "</td>" +
                        "<td>" + fenceArray[i].fence_name + "</td></tr>");
                }
                dialog.dialog("open");
            });
            $("#btn_fenceAG_delete").on('click', function () {
                var fenceAGs = document.getElementsByName("chk_fenceAG"),
                    delete_arr = [];
                for (i = 0; i < fenceAGs.length; i++) {
                    if (fenceAGs[i].checked) {
                        delete_arr.push({
                            "fence_alarm_gid": fenceAGs[i].value
                        });
                    }
                }
                if (delete_arr.length == 0)
                    return alert($.i18n.prop('i_alarmAlert_61'));
                if (confirm($.i18n.prop('i_alarmAlert_47'))) {
                    var deleteXmlHttp = createJsonXmlHttp("sql");
                    deleteXmlHttp.onreadystatechange = function () {
                        if (deleteXmlHttp.readyState == 4 || deleteXmlHttp.readyState == "complete") {
                            var revObj = JSON.parse(this.responseText);
                            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                                if (revObj.Value[0].Value) {
                                    var key = Object.keys(revObj.Value[0].Value);
                                    FenceAlarmGroupFunc.update(key);
                                    alert($.i18n.prop('i_alarmAlert_45'));
                                }
                            } else {
                                alert($.i18n.prop('i_alarmAlert_46'));
                            }
                        }
                    };
                    deleteXmlHttp.send(JSON.stringify({
                        "Command_Type": ["Write"],
                        "Command_Name": ["DeleteFence_Alarm_Group"],
                        "Value": delete_arr,
                        "api_token": [token]
                    }));
                }
            });
            getFences();
            FenceAlarmGroupFunc.get();
        }
    },
    get: function () {
        var xmlHttp = createJsonXmlHttp("sql");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj)) {
                    if (revObj.Value[0].success > 0 && revObj.Value[0].Value) {
                        var key = Object.keys(revObj.Value[0].Value);
                        FenceAlarmGroupFunc.update(key);
                    } else {
                        alert($.i18n.prop('i_alarmAlert_48'));
                    }
                }
            }
        };
        xmlHttp.send(JSON.stringify({
            "Command_Type": ["Read"],
            "Command_Name": ["GetFence_Alarm_Group_ALL"],
            "api_token": [token]
        }));
    },
    contain: function (fence_alarm_gid) {
        submit_type["fence_alarm_group"] = "Edit";
        var xmlHttp = createJsonXmlHttp("sql");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    var revInfo = "Values" in revObj.Value[0] ? revObj.Value[0].Values.slice(0) : [];
                    $("#add_FAG_id").val(fence_alarm_gid).prop('disabled', true);
                    fenceArray.forEach(function (element, index) {
                        var included = revInfo.findIndex(function (Values) {
                            return Values.fence_id == element.fence_id;
                        });
                        var name = "remaining_fences";
                        if (included > -1)
                            name = "included_fences";
                        var tr_id = name + "_" + element.fence_id;
                        $("#table_" + name + " tbody").append("<tr id=\"" + tr_id + "\"" +
                            " onclick=\"beCheckedColumn(\'" + tr_id + "\')\">" +
                            "<td><input type=\"checkbox\" class=\"chk-hidden\"" +
                            " name=\"" + name + "\" value=\"" + element.fence_id + "\" />" +
                            " <span>" + (index + 1) + "</span></td>" +
                            "<td>" + element.fence_id + "</td>" +
                            "<td>" + element.fence_name + "</td></tr>");
                    });
                    resetListNumber("included_fences");
                    resetListNumber("remaining_fences");
                    $("#dialog_fence_alarm_group").dialog("open");
                } else {
                    alert($.i18n.prop('i_alarmAlert_30'));
                }
            }
        };
        xmlHttp.send(JSON.stringify({
            "Command_Type": ["Read"],
            "Command_Name": ["GetFence_Alarm_Group"],
            "Value": {
                "fence_alarm_gid": fence_alarm_gid
            },
            "api_token": [token]
        }));
    },
    add: function (alarm_group_id) {
        var request = {
            "Command_Type": ["Write"],
            "Command_Name": ["AddFenceAlarmGroupInfo"],
            "Value": [{
                "alarm_group_id": alarm_group_id,
                "fence_alarm_gid": $("#add_alarm_mode_0_fagID").val(),
                "overtime_hour": $("#add_alarm_mode_0_time").val()
            }],
            "api_token": [token]
        };
        var xmlHttp = createJsonXmlHttp("sql");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    var revInfo = revObj.Value[0].Values,
                        index = revInfo.findIndex(function (info) {
                            return info.alarm_group_id == alarm_group_id;
                        });
                    if (index > -1)
                        AlarmGroupFunc.editFence(revInfo[index].id);
                    else
                        AlarmGroupFunc.editFence("-1");
                } else {
                    alert($.i18n.prop('i_alarmAlert_50'));
                }
            }
        };
        xmlHttp.send(JSON.stringify(request));
    },
    edit: function (alarm_group_id) {
        if ($("#add_alarm_mode_0_id").val() == "-1")
            return this.add(alarm_group_id);
        else if (!$("#add_alarm_mode_0").prop('checked'))
            return this.delete();
        var request = {
            "Command_Type": ["Write"],
            "Command_Name": ["EditFence_AlarmGroup_info"],
            "Value": {
                "alarm_group_id": alarm_group_id,
                "id": $("#add_alarm_mode_0_id").val(),
                "fence_alarm_gid": $("#add_alarm_mode_0_fagID").val(),
                "overtime_hour": $("#add_alarm_mode_0_time").val()
            },
            "api_token": [token]
        };
        var xmlHttp = createJsonXmlHttp("sql");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    AlarmGroupFunc.editFence($("#add_alarm_mode_0_id").val());
                } else {
                    alert($.i18n.prop('i_alarmAlert_51'));
                }
            }
        };
        xmlHttp.send(JSON.stringify(request));
    },
    delete: function () {
        if ($("#add_alarm_mode_0_id").val() != "-1") {
            var request = {
                "Command_Type": ["Write"],
                "Command_Name": ["DeleteFence_AlarmGroup_info"],
                "Value": [{
                    "id": $("#add_alarm_mode_0_id").val()
                }],
                "api_token": [token]
            };
            var xmlHttp = createJsonXmlHttp("sql");
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        AlarmGroupFunc.get();
                        AlarmGroupFunc.editFence("-1");
                    } else {
                        alert($.i18n.prop('i_alarmAlert_52'));
                    }
                }
            };
            xmlHttp.send(JSON.stringify(request));
        }
    },
    update: function (array) {
        $("#table_fence_alarm_group tbody").empty();
        $("#add_alarm_mode_0_fagID").empty();
        for (i = 0; i < array.length; i++) {
            var tr_id = "fenceAG_" + i;
            $("#table_fence_alarm_group tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                "<input type=\"checkbox\" name=\"chk_fenceAG\" value=\"" + array[i] + "\"" +
                " onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + (i + 1) + "</td>" +
                "<td>" + array[i] + "</td>" +
                "<td><label for=\"btn_edit_fenceAG_" + i + "\" class='btn-edit i18n-input'" +
                " selectattr=\"title\" selectname=\"i_editFenceAlarmGroup\">" +
                "<i class='fas fa-edit' style='font-size:18px;'></i></label>" +
                "<input type='button' id=\"btn_edit_fenceAG_" + i + "\"" +
                " class='btn-hidden' onclick=\"FenceAlarmGroupFunc.contain(\'" + array[i] + "\');\" />" +
                "</td></tr>");
            //Update the alarm group setting dropdownlist
            $("#add_alarm_mode_0_fagID").append("<option value=\"" + array[i] + "\">" + array[i] + "</option>");
        }
    },
    inputList: function () {
        var delete_arr = [];
        document.getElementsByName("remaining_fences").forEach(function (element) {
            if (element.checked) {
                var index = fenceArray.findIndex(function (info) {
                        return info.fence_id == element.value;
                    }),
                    tr_id = "included_fences_" + element.value;
                $("#table_included_fences tbody").append("<tr id=\"" + tr_id + "\"" +
                    " onclick=\"beCheckedColumn(\'" + tr_id + "\')\">" +
                    "<td><input type=\"checkbox\" class=\"chk-hidden\" name=\"included_fences\"" +
                    " value=\"" + element.value + "\" /> <span></span></td>" +
                    "<td>" + element.value + "</td>" +
                    "<td>" + fenceArray[index].fence_name + "</td></tr>");
                delete_arr.push("#remaining_fences_" + element.value);
            }
        });
        delete_arr.forEach(function (element) {
            $(element).remove();
        });
        resetListNumber("included_fences");
        resetListNumber("remaining_fences");
    },
    outputList: function () {
        var delete_arr = [];
        document.getElementsByName("included_fences").forEach(function (element) {
            if (element.checked) {
                var index = fenceArray.findIndex(function (info) {
                        return info.fence_id == element.value;
                    }),
                    tr_id = "remaining_fences_" + element.value;
                $("#table_remaining_fences tbody").append("<tr id=\"" + tr_id + "\"" +
                    " onclick=\"beCheckedColumn(\'" + tr_id + "\')\">" +
                    "<td><input type=\"checkbox\" class=\"chk-hidden\" name=\"remaining_fences\"" +
                    " value=\"" + element.value + "\" /> <span></span></td>" +
                    "<td>" + element.value + "</td>" +
                    "<td>" + fenceArray[index].fence_name + "</td></tr>");
                delete_arr.push("#included_fences_" + element.value);
            }
        });
        delete_arr.forEach(function (element) {
            $(element).remove();
        });
        resetListNumber("included_fences");
        resetListNumber("remaining_fences");
    }
}

function resetListNumber(item_name) {
    $("input[name='" + item_name + "']").each(function (i) {
        $(this).siblings("span").text((i + 1));
    });
}

function beCheckedColumn(id) {
    var state = $("#" + id).find("td:eq(0) input").prop("checked");
    $("#" + id).toggleClass("changeBgColor")
        .find("td:eq(0) input").prop("checked", !state);
}