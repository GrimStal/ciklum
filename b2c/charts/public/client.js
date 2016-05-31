function App(configLink, pointsLink, statusHolderID) {
    this.pointsLink = pointsLink;
    this.configLink = configLink;
    this.statusId = statusHolderID;
    this.interval = null;
    this.top = null;
    this.bottom = null;
    this.pointsNumber = null;
};

App.prototype.getConfig = function () {
    var self = this;
    var def = $.Deferred();

    $.get(this.configLink).then(
            function (response) {
                var clearResponse = response.POINTS;
                if (self.checkVariables(clearResponse)) {
                    self.interval = clearResponse["UPDATE_INTERVAL"];
                    self.pointsNumber = clearResponse["QTY"];
                    self.top = clearResponse["MAX"];
                    self.bottom = clearResponse["MIN"];
                    def.resolve("Конфигурации получены");
                } else {
                    def.reject("Ошибка в данных, полученных от сервера");
                }
            },
            function (error) {
                def.reject(error["responseText"]);
            });

    return def.promise();
};

App.prototype.checkVariables = function (obj) {
    if (!obj) {
        this.changeStatus("Объект не задан");
        return false;
    } else if (!obj["UPDATE_INTERVAL"] || isNaN(obj["UPDATE_INTERVAL"])) {
        this.changeStatus("Интервал не задан");
        return false;
    } else if (!obj["QTY"] || isNaN(obj["QTY"])) {
        this.changeStatus("Количество точек не задано");
        return false;
    } else if (!obj["MAX"] || isNaN(obj["MAX"])) {
        this.changeStatus("Максимальная точка не задана");
        return false;
    } else if (!obj["MIN"] || isNaN(obj["MIN"])) {
        this.changeStatus("Минимальная точка не задана");
        return false;
    }

    return true;
};

App.prototype.getPoints = function () {
    var self = this;
    $.get(this.pointsLink).then(
            function (response) {
                self.changeStatus("Точки получены");
                self.drawLines(response);
            },
            function (error) {
                self.changeStatus(error["responseText"]);
            });
};

App.prototype.changeStatus = function(status){
    $("#" + this.statusId).text(status);
};

App.prototype.setCanvas = function () {
    var height = this.top - this.bottom;
    var width = this.pointsNumber + 20;
    var context;
    var canvas;

    this.changeStatus("Построение графика");

    if (height <= 150) {
        height = height * 2;
    }

    if (this.pointsNumber <= 150) {
        width = width * 3;
    } else if (this.pointsNumber <= 300){
        width = width * 2;
    }

    canvas = document.getElementById("graph");
    canvas.width = width;
    canvas.height = height + 20;
    context = canvas.getContext("2d");

    $("#graph").css("left", ($(document.body).width() - width) / 2 + "px");
    $("#graph").css("top", "10%");

    for (var x = 20.5; x < width; x += 20) {
        context.moveTo(x, 0);
        context.lineTo(x, height + 20);
    }

    for (var y = 20.5; y < height + 20; y += 20) {
        context.moveTo(0, y);
        context.lineTo(width, y);
    }

    context.strokeStyle = "#eee";
    context.stroke();

    context.beginPath();
    context.moveTo(40, 0);
    context.lineTo(40, height);
    context.moveTo(37, 10);
    context.lineTo(40, 0);
    context.moveTo(43, 10);
    context.lineTo(40, 0);

    context.moveTo(40, height);
    context.lineTo(width, height);
    context.moveTo(width - 10, height - 3);
    context.lineTo(width, height);
    context.moveTo(width - 10, height + 3);
    context.lineTo(width, height);

    context.moveTo(30, height / 2);
    context.lineTo(40, height / 2);

    context.strokeStyle = "#000";
    context.stroke();

    context.beginPath();
    context.moveTo(41, height / 2);
    context.lineTo(width + 20, height / 2);

    context.strokeStyle = "#ccc";
    context.stroke();

    context.font = "bold 12px sans-serif";
    context.fillText(this.bottom, 5, height);
    context.fillText(this.top, 5, 10);
    context.fillText(String((this.bottom + this.top)/2), 15, height/2); 
    context.fillText(new Date().toLocaleString("ru", {hour:"numeric", minute:"numeric",second:"numeric"}), width/2 - 15, height +15);
};

App.prototype.drawLines = function (array) {
    if (!Array.isArray(array)) {
        this.changeStatus("Данные получены с ошибкой");
        return false;
    }

    this.setCanvas();
    var yIncreaser = ((this.top - this.bottom) <= 150) ? 2 : 1;
    var xIncreaser = (this.pointsNumber <= 300) ? 3 : 1;
    

    var context = document.getElementById("graph").getContext("2d");
    context.beginPath();
    context.moveTo(50, array[0]);

    for (var i = 1; i < array.length; i++) {
        context.lineTo((50 + (i*xIncreaser)), (this.top - array[i])*yIncreaser);
    }

    context.strokeStyle = "green";
    context.stroke();
    
    this.changeStatus("Актуальный график");
};


var app = new App("/api/v1/config", "/api/v1/points", "status");

app.getConfig().then(
        function () {
            setInterval(function(){app.getPoints();},app.interval);
        },
        function (error) {
            app.changeStatus(error);
        })
