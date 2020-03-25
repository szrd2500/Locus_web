function drawAnchor(dctx, id, type, x, y, size, zoom) {
    // zoom = 1 / Zoom //size:10
    var length = size * zoom;
    if (type == "main")
        dctx.fillStyle = "red";
    else
        dctx.fillStyle = "blue";
    dctx.font = 13 * zoom + 'px serif';
    dctx.fillText(id, x - 5 * zoom, y - 7 * zoom); //anchorID
    dctx.fillRect(x - 5 * zoom, y - 5 * zoom, length, length);
}

function drawInvisiblePoints(dctx, id, x, y, size, zoom) {
    var radius = size * zoom; //半徑 //size:10
    dctx.beginPath();
    dctx.lineWidth = 2 * zoom;
    dctx.arc(x, y - radius * 2, radius, Math.PI * (1 / 6), Math.PI * (5 / 6), true);
    //circle(x座標,y座標,半徑,開始弧度,結束弧度,順t/逆f時針)
    dctx.lineTo(x, y);
    dctx.fillStyle = 'orange';
    dctx.fill(); //填滿圓形
    dctx.closePath();
}

function drawTags(dctx, id, x, y, color, size, zoom) {
    var radius = size * zoom; //半徑, 預設size:10
    dctx.beginPath();
    dctx.lineWidth = 2 * zoom;
    dctx.arc(x, y - radius * 2, radius, Math.PI * (1 / 6), Math.PI * (5 / 6), true);
    //circle(x座標,y座標,半徑,開始弧度,結束弧度,順t/逆f時針)
    dctx.lineTo(x, y);
    dctx.closePath();
    dctx.strokeStyle = '#000000';
    dctx.stroke();
    dctx.fillStyle = color != "" ? color : '#2eb82e';
    dctx.fill();
    dctx.beginPath();
    dctx.arc(x, y - radius * 2, radius / 2.5, 0, Math.PI * 2, true);
    dctx.closePath();
    dctx.fillStyle = '#ffffff';
    dctx.fill();
}

var alarmTypeColor = {
    low_power: {
        fill: '#72ac1b',
        mark: '#496e11'
    },
    help: {
        fill: '#ff3333',
        mark: '#e60000'
    },
    still: {
        fill: '#FF6600',
        mark: '#cc5200'
    },
    active: {
        fill: '#FF6600',
        mark: '#cc5200'
    },
    Fence: {
        fill: '#ffe600',
        mark: '#e7a81f'
    },
    stay: {
        fill: '#1a53ff',
        mark: '#0033ca'
    },
    hidden: {
        fill: '#5151dd',
        mark: '#2f2f83'
    }
};

function drawAlarmTags(dctx, id, x, y, type, size, zoom) { //zoom = 1/Zoom
    var radius = size * zoom; //半徑, 預設size:14
    var fillColor = alarmTypeColor[type].fill || '#72ac1b'; //倒水滴形底色
    var markColor = alarmTypeColor[type].mark || '#72ac1b'; //驚嘆號顏色
    //畫倒水滴形
    dctx.beginPath();
    dctx.lineWidth = 2 * zoom; //線條粗細以2為標準
    //先順時針畫出一個開口在下的2/3個圓
    dctx.arc(x, y - radius * 2, radius, Math.PI * (1 / 6), Math.PI * (5 / 6), true);
    dctx.lineTo(x, y);
    dctx.closePath();
    dctx.strokeStyle = '#000000';
    dctx.stroke();
    dctx.fillStyle = fillColor;
    dctx.fill();
    //畫中心白色圓形
    dctx.beginPath();
    dctx.arc(x, y - radius * 2, radius * 2 / 3, 0, Math.PI * 2, true);
    dctx.closePath();
    dctx.fillStyle = '#ffffff';
    dctx.fill();
    //畫驚嘆號
    dctx.fillStyle = markColor;
    dctx.beginPath();
    dctx.arc(x, y - radius * 2.3, radius * 0.2, 0, Math.PI, true);
    dctx.arc(x, y - radius * 1.9, radius * 0.1, Math.PI, 0, true);
    dctx.closePath();
    dctx.fill();
    //畫驚嘆號的圓點
    dctx.beginPath();
    dctx.arc(x, y - radius * 1.6, radius * 0.1, 0, Math.PI * 2, true);
    dctx.closePath();
    dctx.fill();
}

function drawFocusMark(dctx, x, y, zoom) {
    var radius = 7 * zoom;
    var height = 40 * zoom;
    dctx.beginPath();
    dctx.arc(x, y - height, radius, 0, Math.PI * 2, true);
    dctx.closePath();
    dctx.strokeStyle = 'magenta'; //'#ffdf2b';
    //dctx.lineWidth = 2 * zoom;
    dctx.stroke();
    var R = [{
        x: 0,
        y: 2 / 3 * radius
    }, {
        x: 2 / 3 * radius,
        y: 0
    }, {
        x: 0,
        y: -2 / 3 * radius
    }, {
        x: -2 / 3 * radius,
        y: 0
    }];
    for (i = 0; i < 4; i++) {
        dctx.beginPath();
        dctx.moveTo(x + R[i].x, y + R[i].y - height);
        dctx.lineTo(x + 2 * R[i].x, y + 2 * R[i].y - height);
        dctx.closePath();
        dctx.strokeStyle = 'magenta'; //'#ffae00';
        //dctx.lineWidth = 2 * zoom;
        dctx.stroke();
    }
}

function drawFocusFrame(dctx, x, y, size, zoom) {
    var radius = parseInt(size, 10); //預設size:10
    dctx.strokeStyle = 'rgb(0, 106, 255)'; //'#446ca3d5';
    dctx.lineWidth = 2 * zoom;
    dctx.strokeRect(
        x - (radius + 5) * zoom,
        y - (3 * radius + 5) * zoom,
        (2 * radius + 10) * zoom,
        (3 * radius + 10) * zoom);
}

function drawAlarmFocusFrame(dctx, x, y, size, zoom) {
    var radius = parseInt(size, 10); //預設size:14
    dctx.strokeStyle = 'red'; //'#446ca3d5';
    dctx.lineWidth = 2 * zoom;
    dctx.strokeRect(
        x - (radius + 5) * zoom,
        y - (3 * radius + 5) * zoom,
        (2 * radius + 10) * zoom,
        (3 * radius + 10) * zoom);
}

function Fence(dctx, zoom) {
    var fence_dot_array = [];
    this.setFenceDot = function (fence_name, x, y) {
        fence_dot_array.push({
            fence_name: fence_name,
            x: x,
            y: y
        });
    };
    this.drawFence = function () {
        var len = fence_dot_array.length;
        dctx.beginPath();
        fence_dot_array.forEach(function (v, i, arr) {
            dctx.lineTo(v.x, v.y);
            if (i == len - 1)
                dctx.lineTo(arr[0].x, arr[0].y);
        })
        dctx.strokeStyle = "rgb(0, 153, 51)";
        dctx.stroke();
        dctx.fillStyle = "rgba(0, 153, 51, 0.61)";
        dctx.fill();
        //在圍籬中間畫出群組名稱
        dctx.fillStyle = "blue";
        dctx.font = 26 * zoom + 'px serif';
        var arr = fence_dot_array;
        var displace_x = (arr[2].x - arr[0].x) / 2;
        var displace_y = (arr[2].y - arr[0].y) / 2;
        dctx.fillText(arr[0].fence_name, arr[0].x + displace_x - 15, arr[0].y + displace_y - 6);
        dctx.closePath();
    };
}