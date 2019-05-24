var thumb_width = parseFloat($("#new_map_block").css("width"));
var thumb_height = parseFloat($("#new_map_block").css("height"));
var mapArray = [];

window.addEventListener("load", loadMap, false);

function loadMap() {
    var requestArray = {
        "Command_Type": ["Read"],
        "Command_Name": ["GetMaps"]
    };
    var xmlHttp = createJsonXmlHttp("sql");
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
            var revObj = JSON.parse(this.responseText);
            if (revObj.success > 0) {
                mapArray = [];
                mapArray = revObj.Values.slice(0); //利用抽離全部陣列完成陣列拷貝;
                for (i = 0; i < mapArray.length; i++) {
                    var map = "map_id_" + mapArray[i].map_id;
                    var src = "data:image/" + mapArray[i].map_file_ext + ";base64," + mapArray[i].map_file;
                    var img_size = adjustImageSize(src);
                    $("#maps_gallery").append("<div class=\"thumbnail\">" +
                        "<div class=\"image_block\">" +
                        "<a href=\"" + src + "\" target=\"_blank\">" +
                        "<img src=\"" + src + "\"" +
                        " width=\"" + img_size.width + "\" height=\"" + img_size.height + "\">" +
                        "</a></div>" +
                        "<div class=\"caption\"><table style='width:200px;'><tr>" +
                        "<th>Map Name:</th>" +
                        "<th><span name=\"" + map + "\">" + mapArray[i].map_name + "</span></th>" +
                        "<th><button class='btn btn-primary' onclick=\"setMapById(\'" + mapArray[i].map_id + "\')\">設定</button></th>" +
                        "</tr></table></div>" +
                        "</div>");
                }
            }
        }
    };
    xmlHttp.send(JSON.stringify(requestArray));
}

function setMapById(id) { //點擊設定:開啟設定視窗
    setOperate("change");
    var index = mapArray.findIndex(function (info) {
        return info.map_id == id;
    });
    if (index > -1) {
        var urlData = "data:image/" + mapArray[index].map_file_ext + ";base64," + mapArray[index].map_file;
        var scale = mapArray[index].map_scale;
        $("#map_info_id").val(mapArray[index].map_id);
        $("#map_info_name").val(mapArray[index].map_name);
        $("#map_info_scale").val(scale);
        setMap(urlData, scale);
        //在設定好地圖後，導入Anchors
        getAnchors();
        $("#dialog_map_setting").dialog("open");
    } else {
        return;
    }
}

function newMap() {
    setOperate("new");
    $("#map_info_id").val(""); //清空Map Information
    $("#map_info_name").val("");
    $("#map_info_scale").val("");
    clearAnchorList();
    clearGroupList();
    clearAnchorGroup();
    $("#table_map_group tbody").empty();
    resetCanvas_Anchor();
    $("#dialog_map_setting").dialog("open");
}

function setNewMap(map_id) { //新增地圖
    var map = "map_id_" + map_id;
    var src = $("menu_load_map").files[0];
    var img_size = adjustImageSize(src);
    $("#maps_gallery").append("<div class=\"thumbnail\">" +
        "<div class=\"image_block\">" +
        "<a href=\"" + src + "\" target=\"_blank\">" +
        "<img src=\"" + src + "\"" +
        " width=\"" + img_size.width + "\" height=\"" + img_size.height + "\">" +
        "</a></div>" +
        "<div class=\"caption\"><table style='width:200px;'><tr>" +
        "<th>Map Name:</th>" +
        "<th><span name=\"" + map + "\">" + $("#map_info_name").val() + "</span></th>" +
        "<th><button class='btn btn-primary' onclick=\"setMapById(\'" + map_id + "\')\">設定</button></th>" +
        "</tr></table></div>" +
        "</div>");
}

function adjustImageSize(src) {
    var img = new Image();
    var width = thumb_width,
        height = thumb_height;
    img.src = src;
    img.onload = function () {
        var imgSize = img.width / img.height;
        var thumbSize = thumb_width / thumb_height;
        if (imgSize > thumbSize) { //原圖比例寬邊較長
            width = thumb_width;
            height = imgSize.height * (thumb_width / imgSize.width);
        } else {
            width = img.width * (thumb_height / imgSize.height);
            height = thumb_height;
        }
    }
    return {
        width: width,
        height: height
    };
}

function transBase64(file) {
    //file transform base64
    if (file) {
        var FR = new FileReader();
        FR.readAsDataURL(file);
        FR.onloadend = function (e) {
            var base64data = e.target.result;
            loadImage(base64data);
        };
    }
}

function checkExt(fileName) {
    var validExts = new Array(".png", ".jpg", ".jpeg"); // 可接受的副檔名
    var fileExt = fileName.substring(fileName.lastIndexOf('.'));
    if (validExts.indexOf(fileExt) < 0) {
        alert("檔案類型錯誤，可接受的副檔名有：" + validExts.toString());
        return false;
    } else
        return true;
}

function checkImageSize(file) {
    if (file.size / 1048576 > 1) {
        alert("檔案大小超過1MB，請重新選擇圖檔!");
        return false;
    } else
        return true;
}