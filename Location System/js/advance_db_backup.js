 'use strict';

 var BackupFile = {},
     timeDelay = {
         "dialog": null
     },
     AlarmDialog = {
         show: function (text) {
             document.getElementById("waiting_for").innerText = text || "進行中";
             document.getElementById("progress_block").style.display = 'block';
             timeDelay["dialog"] = setTimeout(function () {
                 AlarmDialog.hide();
                 alert("動作失敗，請稍候再試一次");
             }, 300000);
         },
         hide: function () {
             document.getElementById("progress_block").style.display = 'none';
             clearTimeout(timeDelay["dialog"]);
         }
     },
     BD_FileArr = [],
     fileArray = [];


 $(function () {
     var h = document.documentElement.clientHeight;
     $("#database_files_list").css("max-height", h - 432 + "px");

     /* Check this page's permission and load navbar */
     loadUserData();
     checkPermissionOfPage("Reference");
     setNavBar("Reference", "DB_Backup");
     $("#sel_db_file_name").val("");
     $("#sel_local_file").val("");
     getFileList();
     var dialog = $("#filedata_dialog").dialog({
         autoOpen: false,
         height: 500,
         width: 500,
         modal: true,
         buttons: {
             Cancel: function () {
                 dialog.dialog("close");
             }
         }
     });
 });


 function getFileList() {
     var requestArray = {
             "Command_Type": ["Write"],
             "Command_Name": ["CheckList"],
             "api_token": [token]
         },
         xmlHttp = createJsonXmlHttp("sql");
     xmlHttp.onreadystatechange = function () {
         if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
             var revObj = JSON.parse(this.responseText);
             if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                 BD_FileArr = revObj.Value[0].FileName ? revObj.Value[0].FileName.slice(0) : [];
                 $("#database_files_list").empty();
                 BD_FileArr.sort();
                 BD_FileArr.forEach(function (element, i) {
                     var id = "files_" + i;
                     $("#database_files_list").append("<button class=\"btn file-img-name\" id=\"" + id + "\"" +
                         " name=\"files\" onclick=\"setSelected(\'" + id + "\',\'" + element + "\')\"" +
                         " ondblclick=\"viewDB_file()\">" +
                         "<img src=\"../image/sql.png\"><br>" +
                         "<label>" + element + "</label></button>");
                 });
             } else {
                 alert($.i18n.prop('i_getFileListFailed'));
             }
         }
     };
     xmlHttp.send(JSON.stringify(requestArray));
     clearTempDatas();
 }

 function clearTempDatas() {
     BackupFile = {};
     $("#filedata_name").text("");
     $("#table_filedata_dialog tbody").empty();
 }

 function setSelected(btn_id, file_name) {
     $("#sel_db_file_name").val(file_name);
     $("[name='files']").removeClass("onselected");
     $("#" + btn_id).addClass("onselected");
 }

 function backupDB() {
     if (!confirm("即將開始把資料庫內容建立.sql檔放置到下方資料夾內(會清除原本的備份內容)，請確認已將重要檔案下載到本地。"))
         return;
     return alert("請先不要進行備份作業!"); //完成單檔下載不中斷測試並確認檔案都已備份到本地後，請將這一行程式碼刪除
     AlarmDialog.show("資料庫備份中");
     var requestArray = {
             "Command_Type": ["Write"],
             "Command_Name": ["BackupDatabase"],
             "api_token": [token]
         },
         xmlHttp = createJsonXmlHttp("sql");
     xmlHttp.onreadystatechange = function () {
         if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
             var revObj = JSON.parse(this.responseText);
             if (checkTokenAlive(revObj)) {
                 if (revObj.Value[0].success > 0) {
                     alert("備份成功");
                     AlarmDialog.hide();
                 } else {
                     switch (revObj.Value[0].status) {
                         case "mkdir fail":
                             alert("建立資料夾失敗");
                             break;
                         case "open file fail":
                             alert("建檔失敗");
                             break;
                         case "mysql error":
                             alert("資料庫操作失敗");
                             break;
                         default:
                             break;
                     }
                 }

             }
         }
     };
     xmlHttp.send(JSON.stringify(requestArray));
 }

 function restoreDB() {
     if (!confirm("請確定已將資料庫清空，否則資料庫還原將失敗!"))
         return;
     AlarmDialog.show("資料庫還原中");
     var requestArray = {
             "Command_Type": ["Write"],
             "Command_Name": ["RevertDatabase"],
             "api_token": [token]
         },
         xmlHttp = createJsonXmlHttp("sql");
     xmlHttp.onreadystatechange = function () {
         if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
             var revObj = JSON.parse(this.responseText);
             if (checkTokenAlive(revObj)) {
                 if (revObj.Value[0].success > 0) {
                     alert("資料庫還原成功!");
                 } else {
                     alert("資料庫還原失敗，再使用還元指令前須先將資料庫清空");
                 }
                 console.log(revObj.Value[0].status);
                 AlarmDialog.hide();
             }
         }
     };
     xmlHttp.send(JSON.stringify(requestArray));
 }

 function clearDB() {
     AlarmDialog.show("資料庫清空中");
     var requestArray = {
             "Command_Type": ["Write"],
             "Command_Name": ["DropTable"],
             "Value": [{
                 "null": "null"
             }],
             "api_token": [token]
         },
         xmlHttp = createJsonXmlHttp("sql");
     xmlHttp.onreadystatechange = function () {
         if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
             var revObj = JSON.parse(this.responseText);
             if (checkTokenAlive(revObj)) {
                 if (revObj.Value[0].success > 0) {
                     alert("清空資料庫成功!");
                 } else {
                     alert("清空資料庫失敗!");
                 }
                 console.log(revObj.Value[0].status);
                 AlarmDialog.hide();
             }
         }
     };
     xmlHttp.send(JSON.stringify(requestArray));
 }

 //-------Backup DB File---------

 function viewDB_file() {
     if ($("#sel_db_file_name").val() == "")
         alert("請先點選一個備份檔!");
     else if ($("#sel_db_file_name").val() == $("#filedata_name").text())
         $("#filedata_dialog").dialog("open");
     else
         downloadDB_file("view");
 }

 function downloadDB_file(handle_type) {
     if ($("#sel_db_file_name").val().length > 0) {
         if (handle_type == "view")
             AlarmDialog.show("開啟備份檔中");
         else
             AlarmDialog.show("下載備份檔中");
         var requestArray = {
                 "Command_Type": ["Write"],
                 "Command_Name": ["DownloadAndUploadMysql"],
                 "Value": [{
                     "File_Name": $("#sel_db_file_name").val(),
                     "flag": "download"
                 }],
                 "api_token": [token]
             },
             xmlHttp = createJsonXmlHttp("sql");
         xmlHttp.onreadystatechange = function () {
             if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                 var revObj = JSON.parse(this.responseText);
                 if (checkTokenAlive(revObj) && revObj.Value[0].success > 0) {
                     BackupFile = revObj.Value[0];
                     BackupFile["File_Name"] = requestArray.Value[0].File_Name;
                     if (handle_type == "view") {
                         $("#table_filedata_dialog tbody").empty();
                         $("#filedata_name").text(BackupFile.File_Name);
                         BackupFile.File_Data.forEach(function (element, i) {
                             $("#table_filedata_dialog tbody").append("<tr>" +
                                 "<td>" + (i + 1) + "</td>" +
                                 "<td>" + element + "</td></tr>");
                         });
                         $("#filedata_dialog").dialog("open");
                     } else {
                         var str = "";
                         BackupFile.File_Data.forEach(function (element, i, arr) {
                             if (i < arr.length - 1)
                                 str += element + "\n";
                             else
                                 str += element;
                         });
                         console.log(str);
                         downloadFile(str, BackupFile.File_Name, 'text/plain');
                     }
                     AlarmDialog.hide();
                 }
             }
         };
         xmlHttp.send(JSON.stringify(requestArray));
     } else {
         return alert("請先點選一個備份檔!");
     }
 }

 // Function to download data to a file
 function downloadFile(data, filename, type) {
     data = typeof (data) === 'object' ? data : [data];
     var file = new Blob(data, {
         type: type
     });
     if (window.navigator.msSaveOrOpenBlob) // IE10+
         window.navigator.msSaveOrOpenBlob(file, filename);
     else { // Others
         var a = document.createElement("a"),
             url = URL.createObjectURL(file);
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         setTimeout(function () {
             document.body.removeChild(a);
             window.URL.revokeObjectURL(url);
         }, 0);
     }
     alert("下載成功");
 }

 //-------Local DB File-------

 function openFile_SQL(files) {
     var file = files[0];
     var fileExt = (file.name.substring(file.name.lastIndexOf('.'))).toLowerCase();
     if (fileExt == ".sql") {
         var src = document.getElementById('btn_open_file').value;
         document.getElementById('sel_local_file').value = src;
         if (window.File && window.FileReader && window.FileList && window.Blob) {
             var fr = new FileReader();
             fr.onloadend = function (e) {
                 var result = e.target.result;
                 fileArray = result.split("\n");
                 console.log(fileArray);
             };
             fr.readAsText(file);
         } else {
             alert($.i18n.prop('i_browserNotSupport'));
         }
     } else {
         document.getElementById('file_form').reset();
         alert($.i18n.prop('i_firmwareFileExt'));
     }
 }

 function uploadDB_file() {
     var local_file = $("#sel_local_file").val();
     if (local_file.length > 0 && fileArray.length > 0) {
         var file_name = local_file.substring(local_file.lastIndexOf('\\') + 1);
         if (BD_FileArr.indexOf(file_name) > -1) {
             if (!confirm("此備份檔已存在，上傳檔的內容將直接新增進檔案內，確認繼續執行?")) {
                 return;
             }
         }
         var requestArray = {
                 "Command_Type": ["Write"],
                 "Command_Name": ["DownloadAndUploadMysql"],
                 "Value": [{
                     "File_Name": file_name,
                     "flag": "upload",
                     "File_Data_len": fileArray.length,
                     "File_Data": fileArray
                 }],
                 "api_token": [token]
             },
             xmlHttp = createJsonXmlHttp("sql");
         xmlHttp.onreadystatechange = function () {
             if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                 var revObj = JSON.parse(this.responseText);
                 if (checkTokenAlive(revObj)) {
                     if (revObj.Value[0].success > 0) {
                         if (revObj.Value[0].Status == "Upload OK")
                             alert("上傳到備份檔成功!");
                     } else {
                         alert("上傳到備份檔失敗!");
                     }
                     console.log(revObj.Value[0].Status);
                     getFileList();
                 }
             }
         };
         xmlHttp.send(JSON.stringify(requestArray));
     } else {
         alert("請先開啟本地的.sql檔!");
     }
 }

 function deleteDB_file() {
     if (!confirm($.i18n.prop('i_confirmDeleteFile')))
         return;
     if ($("#sel_db_file_name").val().length > 0) {
         var requestArray = {
                 "Command_Type": ["Write"],
                 "Command_Name": ["DownloadAndUploadMysql"],
                 "Value": [{
                     "File_Name": $("#sel_db_file_name").val(),
                     "flag": "delete",
                     "File_Data_len": 1
                 }],
                 "api_token": [token]
             },
             xmlHttp = createJsonXmlHttp("sql");
         xmlHttp.onreadystatechange = function () {
             if (xmlHttp.readyState == 4 || xmlHttp.readyState == "complete") {
                 var revObj = JSON.parse(this.responseText);
                 if (checkTokenAlive(revObj)) {
                     if (revObj.Value[0].success > 0) {
                         alert("刪除備份檔 : " + $("#sel_db_file_name").val() + " 成功");
                     } else {
                         alert("刪除備份檔 : " + $("#sel_db_file_name").val() + " 失敗");
                     }
                     getFileList();
                 }
             }
         };
         xmlHttp.send(JSON.stringify(requestArray));
     } else {
         alert("請先選擇已備份的資料庫檔案");
     }
 }