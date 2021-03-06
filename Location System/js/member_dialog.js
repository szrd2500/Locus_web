var delete_job_number = "",
    chart_type = "",
    setDialog = {
        personData: function () {
            var dialog, form,
                main_tid_id = $("#main_tid_id"),
                main_user_id = $("#main_user_id"),
                main_card_id = $("#main_card_id"),
                main_number = $("#main_number"),
                main_name = $("#main_name"),
                main_dept = $("#main_department"),
                main_title = $("#main_jobTitle"),
                main_type = $("#main_type"),
                main_alarm_group = $("#main_alarm_group"),
                allFields = $([]).add(main_tid_id).add(main_user_id).add(main_number).add(main_name)
                .add(main_dept).add(main_title).add(main_type).add(main_alarm_group);

            $("#main_select_tag_color").change(selectTagColor);

            dialog = $("#dialog_edit_member").dialog({
                autoOpen: false,
                height: 640,
                width: 600,
                modal: true,
                buttons: {
                    Confirm: function () {
                        var valid = true,
                            photo_ext = "",
                            photo_base64 = "";
                        allFields.removeClass("ui-state-error");
                        valid = valid && checkLength(main_tid_id, $.i18n.prop('i_alertError_10'), 1, 10);
                        valid = valid && checkLength(main_user_id, $.i18n.prop('i_alertError_10'), 1, 10);
                        valid = valid && checkLength(main_number, $.i18n.prop('i_alertError_10'), 1, 50);
                        valid = valid && checkLength(main_name, $.i18n.prop('i_alertError_10'), 1, 50);
                        valid = valid && checkLength(main_dept, $.i18n.prop('i_alertError_10'), 1, 50);
                        valid = valid && checkLength(main_title, $.i18n.prop('i_alertError_10'), 1, 50);
                        valid = valid && checkLength(main_type, $.i18n.prop('i_alertError_10'), 1, 50);
                        valid = valid && checkLength(main_alarm_group, $.i18n.prop('i_alertError_10'), 1, 50);

                        var tag_id = combineToTagID(main_tid_id.val(), main_user_id.val());

                        if ($("#main_picture_img").attr("src").length > 0) {
                            var photo_file = $("#main_picture_img").attr("src").split(",");
                            photo_ext = getBase64Ext(photo_file[0]);
                            photo_base64 = photo_ext != "" ? photo_file[1].trim() : "";
                        } else { //no image
                            photo_ext = "";
                            photo_base64 = "";
                        }

                        if (valid) {
                            var delay = 0;
                            if (delete_job_number != "") {
                                delay++;
                                deleteMemberData([{
                                    "number": delete_job_number
                                }]);
                            }
                            setTimeout(function () {
                                var xmlHttp = createJsonXmlHttp('sql');
                                xmlHttp.onreadystatechange = function () {
                                    if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                                        var revObj = JSON.parse(this.responseText);
                                        if (checkTokenAlive(revObj) && revObj.Value[0].success > 0)
                                            UpdateMemberList();
                                        else
                                            alert($.i18n.prop('i_alertError_3'));
                                        dialog.dialog("close");
                                    }
                                };
                                xmlHttp.send(JSON.stringify({
                                    "Command_Type": ["Write"],
                                    "Command_Name": ["AddStaff"],
                                    "Value": [{
                                        "number": main_number.val(),
                                        "tag_id": tag_id,
                                        "card_id": main_card_id.val(),
                                        "Name": main_name.val(),
                                        "department_id": $("#hidden_department").val(),
                                        "jobTitle_id": $("#hidden_jobTitle").val(),
                                        "type": main_type.val(),
                                        "photo": photo_base64,
                                        "file_ext": photo_ext,
                                        "color_type": $("#main_select_tag_color").val(),
                                        "color": colorToHex($("#main_input_tag_color").val()),
                                        "alarm_group_id": main_alarm_group.val(),
                                        "status": $("#basic_state").val(),
                                        "gender": $("#basic_gender").val(),
                                        "lastName": $("#basic_last_name").val(),
                                        "firstName": $("#basic_first_name").val(),
                                        "EnglishName": $("#basic_english_name").val(),
                                        "birthday": $("#basic_birthday").val(),
                                        "phoneJob": $("#basic_job_phone").val(),
                                        "phoneSelf": $("#basic_self_phone").val(),
                                        "mail": $("#basic_mail").val(),
                                        "address": $("#basic_address").val(),
                                        "education": $("#basic_highest_education").val(),
                                        "school": $("#basic_school").val(),
                                        "grade": $("#basic_grade").val(),
                                        "tech_grade": $("#basic_pro_level").val(),
                                        "dateEntry": $("#basic_entry_date").val(),
                                        "dateLeave": $("#basic_leave_date").val(),
                                        "note": $("#note_text").val(),
                                        "exist": "1"
                                    }],
                                    "api_token": [token]
                                }));
                            }, 100 * delay);
                        }
                    },
                    Cancel: function () {
                        dialog.dialog("close");
                    }
                },
                close: function () {
                    form[0].reset();
                    allFields.removeClass("ui-state-error");
                }
            });

            form = dialog.find("form");
        },
        multiEdit: function () {
            var dialog, form,
                sel_item = $("#multi_edit_item"),
                sel_value = $("#multi_edit_value"),
                allFields = $([]).add(sel_item, sel_value),
                sendResult = function () {
                    allFields.removeClass("ui-state-error");
                    var valid = true;
                    valid = valid && checkLength(sel_item, $.i18n.prop('i_mapAlert_13'), 0, 20);
                    valid = valid && checkLength(sel_value, $.i18n.prop('i_mapAlert_13'), 0, 20);
                    if (valid) {
                        var num_arr = [],
                            checkboxs = document.getElementsByName("chkbox_members");
                        for (j in checkboxs) {
                            if (checkboxs[j].checked)
                                num_arr.push(checkboxs[j].value);
                        }
                        var request = {
                            "Command_Type": ["Write"],
                            "Value": [],
                            "api_token": [token]
                        };
                        switch (sel_item.val()) {
                            case "department":
                                request.Command_Name = ["multiEdit_StaffDepartment"];
                                for (i = 0; i < num_arr.length; i++) {
                                    request.Value.push({
                                        "number": num_arr[i],
                                        "department": sel_value.val()
                                    });
                                }
                                break;
                            case "jobTitle":
                                request.Command_Name = ["multiEdit_StaffJobTitle"];
                                for (i = 0; i < num_arr.length; i++) {
                                    request.Value.push({
                                        "number": num_arr[i],
                                        "jobTitle": sel_value.val()
                                    });
                                }
                                break;
                            case "type":
                                request.Command_Name = ["multiEdit_StaffType"];
                                for (i = 0; i < num_arr.length; i++) {
                                    request.Value.push({
                                        "number": num_arr[i],
                                        "type": sel_value.val()
                                    });
                                }
                                break;
                            case "alarm_group":
                                request.Command_Name = ["multiEdit_StaffAlarmGroup"];
                                for (i = 0; i < num_arr.length; i++) {
                                    request.Value.push({
                                        "number": num_arr[i],
                                        "alarm_group": sel_value.val()
                                    });
                                }
                                break;
                            default:
                                return alert($.i18n.prop('i_alertError_12'));
                        }
                        var xmlHttp = createJsonXmlHttp('sql');
                        xmlHttp.onreadystatechange = function () {
                            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                                var revObj = JSON.parse(this.responseText);
                                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0)
                                    UpdateMemberList();
                            }
                        };
                        xmlHttp.send(JSON.stringify(request));
                        dialog.dialog("close");
                    }
                };

            dialog = $("#dialog_multi_edit").dialog({
                autoOpen: false,
                height: 210,
                width: 300,
                modal: true,
                buttons: {
                    Confirm: sendResult,
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
                sendResult();
            });
        },
        treeChart: function () {
            var dialog, form,
                select_node = $('#selected-node'),
                sendResult = function () {
                    select_node.removeClass("ui-state-error");
                    var valid = true;
                    valid = valid && checkLength(select_node, $.i18n.prop('i_alertError_10'), 0, 20);
                    if (valid) {
                        datascource = {};
                        if (chart_type == "dept") {
                            $("#main_department").val(select_node.val());
                            var dept_id = select_node.data('node')[0].id;
                            $("#hidden_department").val(dept_id);
                            var index = $("#main_select_tag_color").children('option:selected').index();
                            if (index == 1 && dept_id != "") {
                                $("#main_input_tag_color").val(default_color);
                                $("#main_display_color").css("background-color", default_color);
                                deptColorArray.forEach(function (v) {
                                    if (v.c_id == dept_id) {
                                        $("#main_input_tag_color").val(colorToHex(v.color));
                                        $("#main_display_color").css("background-color", colorToHex(v.color));
                                    }
                                });
                            }
                        } else if (chart_type == "jobTitle") {
                            $("#main_jobTitle").val(select_node.val());
                            var title_id = select_node.data('node')[0].id;
                            $("#hidden_jobTitle").val(title_id);
                            var index = $("#main_select_tag_color").children('option:selected').index();
                            if (index == 2 && title_id != "") {
                                $("#main_input_tag_color").val(default_color);
                                $("#main_display_color").css("background-color", default_color);
                                titleColorArray.forEach(function (v) {
                                    if (v.c_id == title_id) {
                                        $("#main_input_tag_color").val(colorToHex(v.color));
                                        $("#main_display_color").css("background-color", colorToHex(v.color));
                                    }
                                });
                            }
                        }
                        dialog.dialog("close");
                    }
                };

            dialog = $("#dialog_tree_chart").dialog({
                autoOpen: false,
                height: 620,
                width: 600,
                modal: true,
                buttons: {
                    Confirm: sendResult,
                    Cancel: function () {
                        dialog.dialog("close");
                    }
                },
                close: function () {
                    form[0].reset();
                    select_node.removeClass("ui-state-error");
                }
            });

            form = dialog.find("form").on("submit", function (event) {
                event.preventDefault();
                sendResult();
            });
        }
    };

function createChart(type) {
    chart_type = type;
    $("#chart-container").html("");
    var requestArray = {},
        datascource = {};
    if (type == "dept") {
        requestArray = {
            "Command_Type": ["Read"],
            "Command_Name": ["GetDepartment_relation"],
            "api_token": [token]
        };
        datascource = {
            'name': 'Company',
            'id': '0',
            'color': '#929292' //top
        };
    } else if (type == "jobTitle") {
        requestArray = {
            "Command_Type": ["Read"],
            "Command_Name": ["GetJobTitle_relation"],
            "api_token": [token]
        };
        datascource = {
            'name': 'JobTitle',
            'id': '0',
            'color': '#929292' //top
        };
    } else {
        return;
    }

    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success == 1) {
                datascource.children = revObj.Value[0].Values;
            } else {
                datascource.children = null;
            }
            var oc = $('#chart-container').orgchart({
                'data': datascource,
                'chartClass': 'edit-state',
                'parentNodeSymbol': 'fa-th-large',
                'createNode': function (data) {
                    data = datascource;
                }
            });
            oc.$chartContainer.on('click', '.node', function () {
                var $this = $(this);
                $('#selected-node').val($this.find('.title').text()).data('node', $this);
            });
            oc.$chartContainer.on('click', '.orgchart', function (event) {
                if (!$(event.target).closest('.node').length) {
                    $('#selected-node').val('');
                }
            });
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function selectTagColor() {
    $("#main_input_tag_color").val(default_color);
    //先還原為預設顏色，再依據選擇代入已設定顏色
    var index = $("#main_select_tag_color").children('option:selected').index();
    switch (index) {
        case 1:
            $("#main_input_tag_color").prop("disabled", true);
            var requestJSON = JSON.stringify({
                "Command_Type": ["Read"],
                "Command_Name": ["GetDepartment_relation_list"],
                "api_token": [token]
            });
            var xmlHttp = createJsonXmlHttp('sql');
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        var revInfo = revObj.Value[0].Values;
                        var nodeArray = [];
                        for (i = 0; i < revInfo.length; i++)
                            nodeArray.push(revInfo[i]);
                        if (nodeArray.length > 0) {
                            nodeArray.forEach(function (v) {
                                if (v.c_id == $("#hidden_department").val()) {
                                    $("#main_input_tag_color").val(colorToHex(v.color));
                                }
                            });
                        }
                    }
                }
            };
            xmlHttp.send(requestJSON);
            break;
        case 2:
            $("#main_input_tag_color").prop("disabled", true);
            var requestJSON = JSON.stringify({
                "Command_Type": ["Read"],
                "Command_Name": ["GetJobTitle_relation_list"],
                "api_token": [token]
            });
            var xmlHttp = createJsonXmlHttp('sql');
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        var revInfo = revObj.Value[0].Values;
                        var nodeArray = [];
                        for (i = 0; i < revInfo.length; i++)
                            nodeArray.push(revInfo[i]);
                        if (nodeArray.length > 0) {
                            nodeArray.forEach(function (v) {
                                if (v.c_id == $("#hidden_jobTitle").val()) {
                                    $("#main_input_tag_color").val(colorToHex(v.color));
                                }
                            });
                        }
                    }
                }
            };
            xmlHttp.send(requestJSON);
            break;
        case 3:
            $("#main_input_tag_color").prop("disabled", true);
            var requestJSON = JSON.stringify({
                "Command_Type": ["Read"],
                "Command_Name": ["GetUserTypes"],
                "api_token": [token]
            });
            var xmlHttp = createJsonXmlHttp('sql');
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                        var revInfo = revObj.Value[0].Values;
                        var nodeArray = [];
                        for (i = 0; i < revInfo.length; i++)
                            nodeArray.push(revInfo[i]);
                        if (nodeArray.length > 0) {
                            nodeArray.forEach(function (v) {
                                if (v.type == $("#main_type").val()) {
                                    $("#main_input_tag_color").val(colorToHex(v.color));
                                }
                            });
                        }
                    }
                }
            };
            xmlHttp.send(requestJSON);
            break;
        case 4:
            $("#main_input_tag_color").prop("disabled", false);
            //假如已使用自訂顏色，則在導入時即顯示，此處做為變更成自訂時顏色保持預設
            break;
        default:
            $("#main_input_tag_color").prop("disabled", true);
            break;
    }
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

function combineToTagID(tid_id, user_id) {
    var tid_hex = parseInt(tid_id, 10).toString(16).toUpperCase(),
        tid_zero = "",
        user_hex = parseInt(user_id, 10).toString(16).toUpperCase(),
        user_zero = "";
    for (var i = 0; i < 8 - tid_hex.length; i++)
        tid_zero += "0";
    for (var j = 0; j < 8 - user_hex.length; j++)
        user_zero += "0";
    return tid_zero + tid_hex + user_zero + user_hex;
}

//Sort Table
function setCheckboxListeners() {
    $("#table_member_setting tbody tr").each(function (index) {
        var tr = $(this);
        tr.find('td:eq(0) label').text(index + 1);
        tr.find('td:eq(0) input').off('click').on('click', function () {
            tr.children('td:eq(0)').click();
        });
        tr.children('td:eq(0)').off('click').on('click', function () {
            if (!tr.find('td:eq(0) input').prop('checked')) {
                tr.find('td:eq(0) input').prop('checked', true);
                tr.addClass("selected");
            } else {
                tr.find('td:eq(0) input').prop('checked', false);
                tr.removeClass("selected");
            }
        });
    });
}

function sortTable(selector, targetType, compFunc) {
    var table = $('#table_member_setting');
    var mySelector = '.sortable';
    var myCompFunc = function ($td1, $td2, isAsc) {
        var v1 = "";
        var v2 = "";
        if (targetType == '') {
            v1 = $.trim($td1.text()).replace(/,|\s+|%/g, '');
            v2 = $.trim($td2.text()).replace(/,|\s+|%/g, '');
        } else {
            if ($td1.children().is(targetType)) {
                v1 = $.trim($td1.children(targetType).val()).replace(/,|\s+|%/g, '');
                v2 = $.trim($td2.children(targetType).val()).replace(/,|\s+|%/g, '');
            } else {
                v1 = $.trim($td1.text()).replace(/,|\s+|%/g, '');
                v2 = $.trim($td2.text()).replace(/,|\s+|%/g, '');
            }
        }
        var pattern = /^\d+(\.\d*)?$/;
        if (pattern.test(v1) && pattern.test(v2)) {
            v1 = parseFloat(v1);
            v2 = parseFloat(v2);
        }
        return isAsc ? v1 > v2 : v1 < v2;
    };
    var doSort = function ($tbody, index, compFunc, isAsc) {
        var $trList = $tbody.find('tr');
        var len = $trList.length;
        for (var i = 0; i < len - 1; i++) {
            for (var j = 0; j < len - i - 1; j++) {
                var $td1 = $trList.eq(j).find('td').eq(index);
                var $td2 = $trList.eq(j + 1).find('td').eq(index);
                if (compFunc($td1, $td2, isAsc)) {
                    var t = $trList.eq(j + 1);
                    $trList.eq(j).insertAfter(t);
                    $trList = $tbody.find('tr');
                }
            }
        }
    }
    var init = function () {
        var $th = table.find('thead tr:eq(0) th').filter(selector);
        $th.on('click', function () {
            var index = $(this).index();
            var asc = $(this).attr('data-asc');
            isAsc = asc === undefined ? true : (asc > 0 ? true : false);
            doSort(table.children('tbody'), index, compFunc, isAsc);
            $(this).children('i').prop('class', isAsc ? 'fas fa-caret-down' : 'fas fa-caret-up');
            $(this).siblings().children('i').prop('class', 'fas fa-sort');
            $(this).attr('data-asc', 1 - (isAsc ? 1 : 0));
            setCheckboxListeners();
        });
        $th.css({
                'cursor': 'pointer',
                'padding-top': '5px'
            })
            .attr('title', 'Sort')
            .append('&nbsp;<i class="fas fa-sort" style="color:#66ccff;float:right;margin-top:2px;" aria-hidden="true"></i>');
    };
    selector = selector || mySelector;
    compFunc = compFunc || myCompFunc;
    targetType = targetType || '';
    init();
}