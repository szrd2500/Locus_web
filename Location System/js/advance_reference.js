'use strict';
var isStartRef = false,
    pageTimer = 0,
    countDatas = 0;


$(function () {
    var h = document.documentElement.clientHeight;
    $(".table_block").css({
        "max-height": h - 80 + "px",
        "height": h - 80 + "px"
    });


    /* Check this page's permission and load navbar */
    loadUserData();
    checkPermissionOfPage("Reference");
    setNavBar("Reference", "Reference");

    loadAnchorList();

    $("#select_source_type").on('change', function () {
        if ($(this).val() == "tag") {
            $("#select_source_id").hide();
            $("#input_source_id").show();
        } else {
            $("#input_source_id").hide();
            $("#select_source_id").show();
        }
    });

    //---------------- Kalman Filter DOM -------------------

    var slider_arr = ["predict_1", "predict_2", "predict_3", "predict_4", "convergence"];
    slider_arr.forEach(function (element) {
        if (element == "convergence")
            document.getElementById("slider_" + element).value = "8";
        else
            document.getElementById("slider_" + element).value = "0.8";
        document.getElementById("slider_" + element).oninput = function () {
            document.getElementById("text_" + element).innerText = this.value;
        }
    });
});

function sendKalmanParams() {
    if (!confirm("在送出Kalman Filter設定值前請先停止定位，確定定位已停止?")) {
        return;
    }
    var requestArray = {
        "Command_Type": ["Write"],
        "Command_Name": ["SetPredict"],
        "Value": {
            "predict1": document.getElementById("slider_predict_1").value,
            "predict2": document.getElementById("slider_predict_2").value,
            "predict3": document.getElementById("slider_predict_3").value,
            "predict4": document.getElementById("slider_predict_4").value,
            "convergence": document.getElementById("slider_convergence").value
        },
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj)) {
                if (revObj.Value[0].success) {
                    alert("Set kalman filter parameter successful!");
                    if (confirm("修改Kalman Filter參數後必須重啟定位才會使用設定值，請問是否自動重啟定位?")) {
                        if (!isStart) {
                            isStart = true;
                            sendLaunchCmd("Start");
                            document.getElementById("btn_start").title = $.i18n.prop('i_stopPositioning');
                            document.getElementById("btn_start").innerHTML = "<i class=\"fas fa-pause\"></i>" +
                                "<span>" + $.i18n.prop('i_stopPositioning') + "</span>";
                        } else {
                            restartLaunch();
                        }
                    }
                } else {
                    alert("Set Kalman filter parameter failed!");
                }
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function loadAnchorList() {
    var requestArray = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetAnchors"],
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                $("#select_source_id").empty();
                $("#select_anchor_id").empty();
                revObj.Value[0].Values.forEach(function (element) {
                    if (element.anchor_type == "main") {
                        $("#select_source_id").append("<option" +
                            " value=\"" + element.anchor_id + "\">" +
                            element.anchor_id + "</option>");
                    } else {
                        $("#select_anchor_id").append("<option" +
                            " value=\"" + element.anchor_id + "\">" +
                            element.anchor_id + "</option>");
                    }
                });
            } else {
                alert($.i18n.prop('i_mapAlert_25'));
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function startRefence() {
    var condition = {
        source_type: $("#select_source_type").val(),
        source_id: $("#select_source_id").val(),
        anchor_id: $("#select_anchor_id").val()
    }
    if (condition.source_type == "Tag")
        condition.source_id = $("#input_source_id").val();
    if (isStartRef) {
        isStartRef = false;
        $("#btn_send").text("Start");
        clearInterval(pageTimer);
        var requestArray = {
            "Command_Type": ["Read"],
            "Command_Name": ["stopreference"],
            "api_token": [token]
        };
        var xmlHttp = createJsonXmlHttp("reference");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    alert("Stop reference successfully!");
                } else {
                    alert("Stop reference failed!");
                }
            }
        };
        xmlHttp.send(JSON.stringify(requestArray));
    } else {
        isStartRef = true;
        $("#btn_send").text("Stop");
        var requestArray = {
            "Command_Type": ["Read"],
            "Command_Name": ["startreference"],
            "Value": {
                "tagflag": condition.source_type,
                "sourceid": condition.source_id,
                "targetid": condition.anchor_id
            },
            "api_token": [token]
        };
        var xmlHttp = createJsonXmlHttp("reference");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    var revInfo = revObj.Value[0].Value ? revObj.Value[0].Value : [];
                    revInfo.forEach(function (element, i) {
                        $("#table_reference_tags tbody").append("<tr>" +
                            "<td>" + (i + 1) + "</td>" +
                            "<td>" + element.Source_ID + "</td>" +
                            "<td>" + element.Anchor_ID + "</td>" +
                            "<td>" + element.Signal + "</td>" +
                            "<td>" + element.count + "</td></tr>");
                    });
                    countDatas = 0;
                    $("#table_reference_tags tbody").empty();
                    pageTimer = setInterval(function () {
                        getResult();
                    }, 100);
                    alert("Start reference successfully!");
                } else {
                    alert("Start reference failed!");
                }
            }
        };
        xmlHttp.send(JSON.stringify(requestArray));
    }

    function getResult() {
        var requestArray = {
            "Command_Type": ["Read"],
            "Command_Name": ["getreferencerecord"],
            "api_token": [token]
        };
        var xmlHttp = createJsonXmlHttp("reference");
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                var revObj = JSON.parse(this.responseText);
                if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                    var revInfo = revObj.Value[0].Value ? revObj.Value[0].Value : [];
                    revInfo.forEach(function (element) {
                        countDatas++;
                        $("#table_reference_tags tbody").append("<tr>" +
                            "<td>" + countDatas + "</td>" +
                            "<td>" + parseInt(element.Source_ID, 16) + "</td>" +
                            "<td>" + parseInt(element.Anchor_ID, 16) + "</td>" +
                            "<td>" + element.Signal + "</td>" +
                            "<td>" + element.count + "</td></tr>");
                    });
                    if ($("#chk_latest_items").prop("checked")) {
                        var div = document.getElementById("reference_block");
                        div.scrollTop = div.scrollHeight;
                    }
                }
            }
        };
        xmlHttp.send(JSON.stringify(requestArray));
    }
}