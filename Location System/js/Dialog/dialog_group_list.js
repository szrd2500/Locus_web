var count_grouplist = 0;
var mainAnchorArray = [];
var allGroupsArray = [];

function clearGroupList() {
    $("#table_group_list tbody").empty(); //重置表格
    count_grouplist = 0;
}

function inputGroupList(mainAnchorIDArr) {
    var requestArray = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetGroups"]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            var groupList = revObj.Values;
            if (revObj.success > 0) {
                mainAnchorArray = [];
                mainAnchorIDArr.forEach(element => {
                    mainAnchorArray.push(element);
                });
                clearGroupList();
                groupList.forEach(info => {
                    info.group_name = typeof (info.group_name) != 'undefined' ? info.group_name : "";
                    count_grouplist++;
                    var tr_id = "tr_group_list_" + count_grouplist;
                    $("#table_group_list tbody").append("<tr id=\"" + tr_id + "\"><td>" +
                        "<input type=\"checkbox\" name=\"chkbox_group_list\" value=\"" + count_grouplist + "\"" +
                        " onchange=\"selectColumn(\'" + tr_id + "\')\" />  " + count_grouplist +
                        //"</td><td>" +
                        //"<label name=\"grouplist_id\">" + info.group_id + "</label>" +
                        "</td><td>" +
                        "<input type=\"text\" name=\"grouplist_name\" value=\"" + info.group_name +
                        "\" style=\"max-width:80px;\" readonly/>" +
                        "</td><td>" +
                        "<input type=\"text\" name=\"grouplist_main_anchor\" value=\"" + info.main_anchor_id +
                        "\" style=\"max-width:80px;\" readonly/>" +
                        "</td></tr>");
                });
                draw();
            } else {
                alert("獲取GroupList失敗，請再試一次!");
                return;
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function catchMainAnchorList() {
    var main_anc_ids = document.getElementsByName("list_main_anchor_id");
    mainAnchorArray = [];
    main_anc_ids.forEach(element => {
        mainAnchorArray.push(element.value);
    });
}

function resetMainAncSelect() {
    catchMainAnchorList();
    var main_anc_select = $("[name=grouplist_main_anchor]");
    for (i = 0; i < main_anc_select.length; i++) {
        var temp = main_anc_select.eq(i).val();
        main_anc_select.eq(i).html(makeOptions(mainAnchorArray, temp));
    }
}

$(function () {
    $("#btn_add_group").on('click', function () {
        catchMainAnchorList();
        $("#add_grouplist_main_anchor").html(makeOptions(mainAnchorArray, mainAnchorArray[0]));
        dialog.dialog("open");
    });
    $("#btn_delete_group").on('click', function () {
        removeGroupList();
    });
    $("#add_grouplist_id").on('change', function () {
        if ($(this).val().length > 0) {
            var repeat = allGroupsArray.indexOf($(this).val());
            if (repeat > -1)
                $("#add_group_id_alert").text("已存在").css('color', 'red');
            else
                $("#add_group_id_alert").text("可新增").css('color', 'green');
        } else {
            $("#add_group_id_alert").empty();
        }
    });


    var dialog, form,
        add_grouplist_id = $("#add_grouplist_id"),
        add_grouplist_name = $("#add_grouplist_name"),
        add_main_anchor = $("#add_grouplist_main_anchor"),
        allFields = $([]).add(add_grouplist_id).add(add_grouplist_name);

    function addGrouplist() {
        var valid = true;

        allFields.removeClass("ui-state-error");

        valid = valid && checkLength(add_grouplist_id, "GroupList", 1, 5);
        allGroupsArray.forEach(element => { //驗證Group ID是否重複
            if (element == add_grouplist_id.val()) {
                valid = false;
                add_grouplist_id.addClass("ui-state-error");
                alert("Group ID已存在，請更換!");
            }
        });
        valid = valid && checkLength(add_main_anchor, "GroupList", 1, 5);

        if (valid) {
            var request = {
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
            var xmlHttp = createJsonXmlHttp("sql");
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                    var revObj = JSON.parse(this.responseText);
                    if (revObj.success > 0) {
                        getAnchors();
                        dialog.dialog("close");
                    }
                }
            };
            xmlHttp.send(JSON.stringify(request));
            dialog.dialog("close");
        }
        return valid;
    }

    function removeGroupList() {
        var checkboxs = document.getElementsByName("chkbox_group_list");
        var arr = [];
        for (j in checkboxs) {
            if (checkboxs[j].checked)
                arr.push(checkboxs[j].value);
        }
        arr.forEach(function (v) {
            $("#tr_group_list_" + v).remove();
        });
    }

    dialog = $("#dialog_add_group_list").dialog({
        autoOpen: false,
        height: 340,
        width: 340,
        modal: true,
        buttons: {
            Cancel: function () {
                dialog.dialog("close");
            },
            "Confirm": addGrouplist
        },
        close: function () {
            form[0].reset();
            allFields.removeClass("ui-state-error");
        }
    });

    form = dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        addGrouplist();
    });
});