var leftSide_isOpen = false;
var rightSide_isOpen = false;
var dropdown_isOpen = false;

function alarmSidebarMove() {
    //側邊欄由左向右滑動
    if (!leftSide_isOpen) {
        $('#content').addClass('left_open');
        $('.sideBar').animate({
            left: '50px'
        }, 370); //0
    } else {
        //側邊欄由右向左滑動
        $('#content').removeClass('left_open');
        $('.sideBar').animate({
            left: '-330px'
        }, 310); //-330
    }
    leftSide_isOpen = !leftSide_isOpen;
}

function memberSidebarMove() {
    var $aside = $('#page_rightSide > aside');
    if (!rightSide_isOpen) {
        $('#content').addClass('right_open');
        $aside.stop(true).animate({
            right: '-80px'
        }, 370);
    } else {
        $('#content').removeClass('right_open');
        $aside.stop(true).animate({
            right: '-400px'
        }, 310);
    }
    rightSide_isOpen = !rightSide_isOpen;
}

function displayDropdown() {
    if (!dropdown_isOpen) {
        $('.menu-left ul.dropdown-menu').show();
        $('.input_map a').css('background', 'rgb(43, 207, 219)');
    } else {
        $('.menu-left ul.dropdown-menu').hide();
        $('.input_map a').css('background', 'transparent');
    }
    dropdown_isOpen = !dropdown_isOpen;
}

$(function () {
    //多階下拉清單按鈕
    /* $('#').click(function (e) {
         $('.dropdown ul').toggle();
     });*/
    /*$('.dropdown ul').mouseover(function (e){
        $(this).show();
    });*/
    var dropdown = $('.menu-left ul.dropdown-menu');
    /*$('.input_map').mouseleave(function (e) {
        $('.menu-left ul.dropdown-menu').hide();
    });*/
    $('.input_map').hover(function () {
        dropdown.show();
        $('.input_map a').css('background', 'rgb(104, 198, 226)');
    }, function () {
        dropdown.hide();
        $('.input_map a').css('background', 'transparent');
    });
    dropdown.hover(function () {
        dropdown.show();
        $('.input_map a').css('background', 'rgb(104, 198, 226)');
    }, function () {
        dropdown.hide();
        $('.input_map a').css('background', 'transparent');
    });
});