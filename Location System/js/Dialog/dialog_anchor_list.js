var count_main_anchor_list = 0;
var count_anchor_list = 0;
var allAnchorArray = [];
var allGroupsArray = [];

function clearAnchorList() {
    $("#table_main_anchor_list tbody").empty(); //重置表格
    $("#table_anchor_list tbody").empty();
    count_main_anchor_list = 0;
    count_anchor_list = 0;
}

function inputAnchorList(anchorList) {
    clearAnchorList();
    allAnchorArray = [];
    for (var i = 0; i < anchorList.length; i++) {
        if (anchorList[i].anchor_type == "main") {
            count_main_anchor_list++;
            var tr_id = "tr_main_anchor_list_" + count_main_anchor_list;
            $("#table_main_anchor_list tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                "<input type=\"checkbox\" name=\"chkbox_main_anchor\" value=\"" + tr_id + "\"" +
                " onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + count_main_anchor_list +
                "</td><td>" +
                "<input type=\"text\" name=\"list_main_anchor_id\" value=\"" + anchorList[i].anchor_id + "\" style=\"max-width:100px;\" onchange=\"catchAnchors()\" />" +
                "</td><td>" +
                "<input type=\"text\" name=\"list_main_anchor_x\" value=\"" + anchorList[i].set_x + "\" style=\"max-width:60px;\" onchange=\"catchAnchors()\" />" +
                "</td><td>" +
                "<input type=\"text\" name=\"list_main_anchor_y\" value=\"" + anchorList[i].set_y + "\" style=\"max-width:60px;\" onchange=\"catchAnchors()\" />" +
                "</td></tr>");
        } else {
            count_anchor_list++;
            var tr_id = "tr_anchor_list_" + count_anchor_list;
            $("#table_anchor_list tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                "<input type=\"checkbox\" name=\"chkbox_anchor\" value=\"" + tr_id + "\"" +
                " onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + count_anchor_list +
                "</td><td>" +
                "<input type=\"text\" name=\"list_anchor_id\" value=\"" + anchorList[i].anchor_id + "\" style=\"max-width:100px;\" onchange=\"catchAnchors()\" />" +
                "</td><td>" +
                "<input type=\"text\" name=\"list_anchor_x\" value=\"" + anchorList[i].set_x + "\" style=\"max-width:60px;\" onchange=\"catchAnchors()\" />" +
                "</td><td>" +
                "<input type=\"text\" name=\"list_anchor_y\" value=\"" + anchorList[i].set_y + "\" style=\"max-width:60px;\" onchange=\"catchAnchors()\" />" +
                "</td></tr>");
        }
        allAnchorArray.push(anchorList[i].anchor_id);
    }
}

function DeleteAnchorList() {
    var deleteArray = [];
    var chk_main_anchor = document.getElementsByName("chkbox_main_anchor");
    var chk_anchor = document.getElementsByName("chkbox_anchor");
    for (i in chk_main_anchor) {
        if (chk_main_anchor[i].checked)
            deleteArray.push(chk_main_anchor[i].value);
    }
    for (j in chk_anchor) {
        if (chk_anchor[j].checked)
            deleteArray.push(chk_anchor[j].value);
    }
    if (deleteArray.length == 0) {
        alert("請至少勾選一個anchor，才能進行刪除!");
        return;
    }
    /*deleteArray.forEach(v => {
        $("#" + v).remove();
    });
    catchAnchors(); //遍歷AnchorList每一格，放入Array中，再畫點
    */
    var request = {
        "Command_Type": ["Write"],
        "Command_Name": ["AddListAnchor"],
        "Value": [{
            "anchor_type": anchor_type.val(),
            "anchor_id": anchor_id.val(),
            "set_x": anchor_x.val(),
            "set_y": anchor_y.val()
        }]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (revObj.success > 0) {

            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}


function setDropdown_Group() {
    //set dropdownlist of the map's groups
    var requestArray = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps_Groups"]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            var groups_arr = [];
            allGroupsArray = [];
            if (revObj.success > 0) {
                var map_id = $("#map_info_id").val();
                revObj.Values.forEach(element => {
                    if (element.map_id == map_id) {
                        groups_arr.push(element.group_id);
                    }
                    allGroupsArray.push(element.group_id);
                });
                $("#anchor_select_group_id").empty();
                $("#anchor_select_group_id").append(makeOptions(groups_arr, groups_arr[0]));
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

$(function () {
    //預設anchor_type為anchor
    $("#anchor_input_group").hide();
    $("#anchor_select_group").show();
    $("#anchor_type").on('change', function () {
        if ($(this).val() == "main") {
            $("#anchor_select_group").hide();
            $("#anchor_input_group").show();
        } else {
            $("#anchor_input_group").hide();
            $("#anchor_select_group").show();
        }
    });
    $("#anchor_id").on('change', function () {
        if ($(this).val().length > 0) {
            var repeat = allAnchorArray.indexOf($(this).val());
            if (repeat > -1)
                $("#anchor_id_alert").text("已存在").css('color', 'red');
            else
                $("#anchor_id_alert").text("可新增").css('color', 'green');
        } else {
            $("#anchor_id_alert").empty();
        }
    });


    $("#anchor_input_group_id").on('change', function () {
        if ($(this).val().length > 0) {
            var repeat = allGroupsArray.indexOf($(this).val());
            if (repeat > -1)
                $("#group_id_alert").text("已存在").css('color', 'red');
            else
                $("#group_id_alert").text("可新增").css('color', 'green');
        } else {
            $("#group_id_alert").empty();
        }
    });


    var dialog, form,
        anchor_type = $("#anchor_type"),
        anchor_id = $("#anchor_id"),
        anchor_x = $("#anchor_x"),
        anchor_y = $("#anchor_y"),
        input_group_id = $("#anchor_input_group_id"),
        input_group_name = $("#anchor_input_group_name"),
        select_group = $("#anchor_select_group_id"),
        allFields = $([]).add(anchor_id).add(anchor_x).add(anchor_y)
        .add(input_group_id).add(input_group_name).add(select_group);

    function addAnchor() {
        var valid = true;
        allFields.removeClass("ui-state-error");
        valid = valid && checkLength(anchor_id, "Min number:1, Max number:65535", 1, 5);
        allAnchorArray.forEach(element => { //驗證Anchor ID是否重複
            if (element == anchor_id.val()) {
                valid = false;
                anchor_id.addClass("ui-state-error");
                alert("Anchor ID已存在，請更換!");
            }
        });
        valid = valid && checkLength(anchor_x, "Not null", 1, 10);
        valid = valid && checkLength(anchor_y, "Not null", 1, 10);
        if (anchor_type.val() == "main") {
            valid = valid && checkLength(input_group_id, "Not null", 1, 5);
            allGroupsArray.forEach(element => { //驗證Group ID是否重複
                if (element == input_group_id.val()) {
                    valid = false;
                    input_group_id.addClass("ui-state-error");
                    alert("Group ID已存在，請更換!");
                }
            });
            valid = valid && checkLength(input_group_name, "Not null", 1, 50);
        } else {
            if (!select_group.children().is("option"))
                alert("請先增加至少一個Group(可以新增MainAnchor時綁定，也可以到GroupList新增)");
            valid = valid && checkLength(select_group, "Not null", 1, 5);
        }

        if (valid) {
            var request = {
                "Command_Type": ["Write"],
                "Command_Name": ["AddListAnchor"],
                "Value": [{
                    "anchor_type": anchor_type.val(),
                    "anchor_id": anchor_id.val(),
                    "set_x": anchor_x.val(),
                    "set_y": anchor_y.val()
                }]
            };
            var xmlHttp = createJsonXmlHttp("sql");
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (revObj.success > 0) {
                        var addRequest = {};
                        if (anchor_type.val() == "main") {
                            addRequest = { //GroupList
                                "Command_Type": ["Write"],
                                "Command_Name": ["AddListGroup"],
                                "Value": [{
                                    "group_id": input_group_id.val(),
                                    "group_name": input_group_name.val(),
                                    "main_anchor_id": anchor_id.val(),
                                    "mode": "normal",
                                    "mode_value": "0",
                                    "fence": "0"
                                }]
                            };
                        } else {
                            addRequest = { //AnchorGroup
                                "Command_Type": ["Write"],
                                "Command_Name": ["AddListGroup_Anchor"],
                                "Value": [{
                                    "anchor_id": anchor_id.val(),
                                    "group_id": select_group.val(),
                                }]
                            };
                        }
                        var addXmlHttp = createJsonXmlHttp("sql");
                        addXmlHttp.onreadystatechange = function () {
                            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                                var revObj = JSON.parse(this.responseText);
                                if (revObj.success > 0) {
                                    getAnchors();
                                    dialog.dialog("close");
                                }
                            }
                        };
                        addXmlHttp.send(JSON.stringify(addRequest));
                    }
                }
            };
            xmlHttp.send(JSON.stringify(request));
        }
        return valid;
    }

    dialog = $("#dialog_add_new_anchor").dialog({
        autoOpen: false,
        height: 450,
        width: 340,
        modal: true,
        buttons: {
            "Confirm": addAnchor,
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
        addAnchor();
    });

    $("#btn_add_anchor").click(function () { //按下Add anchor
        anchor_type.val("");
        anchor_id.val("");
        anchor_x.val("");
        anchor_y.val("");
        setDropdown_Group();
        dialog.dialog("open");
    });

    $("#btn_delete_anchor").click(function () { //按下Delete anchor
        DeleteAnchorList();
    });
});