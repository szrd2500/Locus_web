'use strict';
var command_name = "",
    command_map = {},
    ipPortList = {};

$(function () {
    var h = document.documentElement.clientHeight;
    $(".table_block").css("max-height", h - 80 + "px");

    /* Check this page's permission and load navbar */
    loadUserData();
    checkPermissionOfPage("Reference");
    setNavBar("Reference", "Advance_cmd");

    $("#cmd_read").on("change", function () {
        if (command_name != "")
            $("#send_cmd").val(command_map[command_name].Read);
    });

    $("#cmd_write").on("change", function () {
        if (command_name != "")
            $("#send_cmd").val(command_map[command_name].Write);
    });

    //Load Command List
    $.getJSON("../json/advance_cmd.json", function (result) {
        if (result && result["Cmd Name"]) {
            command_map = result["Cmd Name"];
            $("#table_advance_cmd tbody").empty();
            var item = 0;
            for (var i in command_map) {
                item++;
                $("#table_advance_cmd tbody").append("<tr>" +
                    "<td>" + item + "</td>" +
                    "<td>" + i + "</td>" +
                    "<td>" + command_map[i].Description + "</td></tr>"
                );
            }
            $("#table_advance_cmd tbody tr").each(function (i) {
                $(this).on("click", function () {
                    $("#table_advance_cmd tbody tr").removeClass("checked");
                    $(this).addClass("checked");
                    command_name = Object.keys(command_map)[i];
                    switch (command_name) {
                        case "Read Version":
                            $("#cmd_read").prop({
                                "disabled": false,
                                "checked": true
                            });
                            $("#cmd_write").prop("disabled", true);
                            $("#send_cmd").val(command_map[command_name]
                                .Read);
                            break;
                        case "Reset Chip":
                            $("#cmd_write").prop({
                                "disabled": false,
                                "checked": true
                            });
                            $("#cmd_read").prop("disabled", true);
                            $("#send_cmd").val(command_map[command_name]
                                .Write);
                            break;
                        default:
                            $("#cmd_write").prop("disabled", false);
                            $("#cmd_read").prop("disabled", false);
                            if ($("[name='cmd_type']:checked").val() == "read")
                                $("#send_cmd").val(command_map[command_name]
                                    .Read);
                            else
                                $("#send_cmd").val(command_map[command_name]
                                    .Write);
                            break;
                    }
                });
            });
        } else {
            alert("載入指令列表失敗");
        }
    });

    searchNetworkCards();

});

function submitCommand() {
    var target_ip = $("#sel_device_ip").val();
    if (!target_ip || target_ip == "" || $("#send_cmd").val() == "") {
        alert("Please search and select one device, click the command in left list or input the command!");
        return;
    }
    var xmlHttp = createJsonXmlHttp('advancecmd');
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0]) {
                var revInfo = revObj.Value[0][0][0];
                if (revInfo.Command_status == 1 && revInfo.TARGET_IP == target_ip)
                    $("#receive_cmd").val(revInfo.Command_Ack.toUpperCase());
            } else {
                alert("Submit the command failed!");
            }
        }
    };
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["command"],
        "Value": {
            "IP_address": [target_ip],
            "function": [$("#send_cmd").val()],
            "IP_port": [ipPortList[target_ip]]
        },
        "api_token": [token]
    }));
}