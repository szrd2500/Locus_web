var isStart = false;

function searchNetworkCards() {
    var xmlHttp = createJsonXmlHttp("Command");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText),
                cookie = typeof (Cookies.get("local_ip")) == 'undefined' ? "" : Cookies.get("local_ip");
            if (checkTokenAlive(token, revObj)) {
                var revInfo = revObj.Value[0];
                document.getElementById("local_ip").value = revInfo[0].ip;
                var html = "";
                for (var i = 0; i < revInfo.length; i++) {
                    if (revInfo[i].ip == cookie) {
                        html += "<option value=\"" + revInfo[i].ip + "\" selected>" +
                            revInfo[i].net_interface_id + "</option>";
                        document.getElementById("local_ip").value = revInfo[i].ip;
                    } else {
                        html += "<option value=\"" + revInfo[i].ip + "\">" + revInfo[i].net_interface_id +
                            "</option>";
                    }
                }
                document.getElementById("interface_card").innerHTML = html;
                $(function () {
                    $("#interface_card").change(function () {
                        $("#local_ip").val($(this).children('option:selected').val());
                        Cookies.set("local_ip", $("#local_ip").val());
                    });
                });
            }
        }
    }
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["Search_net"],
        "api_token": [token]
    }));
}

function searchDevices() {
    var xmlHttp = createJsonXmlHttp("Command");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            if (!this.responseText) {
                alert("Search devices failed!");
                return;
            }
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(token, revObj)) {
                var revInfo = revObj.Value ? revObj.Value[0] : [];
                $("#sel_device_ip").empty();
                ipPortList = {};
                if (revInfo && revInfo.length > 0) {
                    revInfo.sort(function (a, b) {
                        var a_str = a.IP_address.substring(a.IP_address.lastIndexOf(".") + 1),
                            b_str = b.IP_address.substring(b.IP_address.lastIndexOf(".") + 1);
                        return a_str - b_str;
                    });
                    revInfo.forEach(function (element) {
                        ipPortList[element.IP_address] = element.TCP_Serve_Port;
                        $("#sel_device_ip").append("<option value=\"" + element.IP_address + "\">" +
                            element.IP_address + "</option>")
                    });
                }
            }
        }
    }
    xmlHttp.send(JSON.stringify({
        "Command_Type": ["Read"],
        "Command_Name": ["Search"],
        "Value": {
            "net_interface_id": [$("#interface_card").children('option:selected').text()],
            "ip": [$("#local_ip").val()]
        },
        "api_token": [token]
    }));
}

function StartClick() {
    if (!isStart) {
        isStart = true;
        sendLaunchCmd("Start");
        document.getElementById("btn_start").title = $.i18n.prop('i_stopPositioning');
        document.getElementById("btn_start").innerHTML = "<i class=\"fas fa-pause\"></i>" +
            "<span>" + $.i18n.prop('i_stopPositioning') + "</span>";
    } else {
        isStart = false;
        sendLaunchCmd("Stop");
        document.getElementById("btn_start").title = $.i18n.prop('i_startPositioning');
        document.getElementById("btn_start").innerHTML = "<i class=\"fas fa-play\"></i>" +
            "<span>" + $.i18n.prop('i_startPositioning') + "</span>";
    }
}

function sendLaunchCmd(switch_type) {
    var request = {
        "Command_Type": ["Write"],
        "Command_Name": ["Launch"],
        "Value": switch_type,
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("test2");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (checkTokenAlive(revObj) && revObj.Value) {
                if (revObj.Value[0].Status == "Start") {
                    alert("Start positioning successfully!");
                } else {
                    alert("Stop positioning successfully!");
                }
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
}

function restartLaunch() {
    isStart = false;
    var request = {
        "Command_Type": ["Write"],
        "Command_Name": ["Launch"],
        "Value": "Stop",
        "api_token": [token]
    };
    var xmlHttp = createJsonXmlHttp("test2");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            if (checkTokenAlive(token, JSON.parse(this.responseText))) {
                isStart = true;
                sendLaunchCmd("Start");
            }
        }
    };
    xmlHttp.send(JSON.stringify(request));
    document.getElementById("btn_start").title = $.i18n.prop('i_startPositioning');
    document.getElementById("btn_start").innerHTML = "<i class=\"fas fa-play\"></i>" +
        "<span>" + $.i18n.prop('i_startPositioning') + "</span>";
}