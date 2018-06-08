var xjs = require('xjs');
var RunLoop;
var prevTrackStr = '';
var titleStr = '';
var subtitleStr = '';
var coverArt = '';

var musicJsonPath = "E:\\Development\\Xsplit\\unp_now_playing.json";
var onScreenTimeout = 10000;
var albumArtPath = "E:/Development/Xsplit/unp_album_art.jpg";
var debug = false;
var unitHeight = 50;

class NotificationTray {
    constructor(){
        this.list = [];
        this.offset = 0;
    }
    append(notification, timeout){
        this.list.push(notification);
        var id = this.list.length - 1;
        this.list[id].move(this.offset);
        console.log(notification);
        console.log(this.list[id]);
        // this.list[id].container.style.transform = "translateY(" + str(this.offset) +"px)";
        this.offset = this.offset + this.list[id].size;
        this.list[id].render();
        if (timeout != 0) {
            this.remove(id, timeout);
        }
    }
    remove(id, timeout){
        setTimeout(function(){
            this.list[id].toggle();
            this.offset = this.offset - this.list[id].size;
            for (let i = 0; i < this.list.length; i++) {
                setTimeout(function(){
                    if (i > id){
                        const el = this.list[i];
                        el.move(-this.list[id].size);
                    }
                }.bind(this), 500);
            }
            setTimeout(function(){
                this.list[id].del();
                delete this.list[id];
                this.list.splice(id, 1);
            }.bind(this), 2000);
        }.bind(this), timeout);
    }
}

class Notification {
    constructor(size, base64icon, text, subText, backgroundTint){
        this.size = size;
        this.offset = 0;

        this.container = document.createElement('div');
        this.container.id = 'message-container';

        this.background = document.createElement('canvas');
        this.background.id = 'message-background';

        this.icon = document.createElement('canvas');
        this.icon.id = 'message-img';

        this.title = document.createElement('div');
        this.title.id = 'message-title';

        this.subTitle = document.createElement('div');
        this.subTitle.id = 'message-subtitle';

        var image = new Image();
        image.src = "data:image/jpeg;base64," + base64icon;

        var ctx = this.icon.getContext("2d");
        ctx.drawImage(image, 0, 0, this.icon.width, this.icon.height);
        if (backgroundTint) {
            var ctx = this.background.getContext("2d");
            ctx.drawImage(image, 0, 0, this.background.width, this.background.width);
        } else {
            this.background.style.background = "linear-gradient(to bottom, rgba(230, 230, 230, 1) 0%,rgba(225,225,225,1) 5%,rgba(220,220,220,1) 100%);";
        }
        this.title.innerText = text;
        this.subTitle.innerText = subText;

        this.isPresent = true;
        // this.render();
    }
    render(){
        document.body.appendChild(this.container);
        this.container.appendChild(this.background);
        this.container.appendChild(this.icon);
        this.container.appendChild(this.title);
        this.container.appendChild(this.subTitle);
        this.reveal();
    }
    move(units){
        this.offset += units;
        this.container.style.transform = "translateY("+ String(this.offset * unitHeight) +"px)";
        this.background.style.transform = "translateY("+ String(this.offset * unitHeight) +"px)";
    }
    del(){
        this.subTitle.remove();
        this.title.remove();
        this.icon.remove();
        this.background.remove();
        this.container.remove();
    }
    reveal(){
        this.container.style.transitionDuration = "0s";
        this.toggle();
        setTimeout(function(){this.container.style.transitionDuration = "1s";}.bind(this), 100);
        setTimeout(this.toggle.bind(this), 110);
    }
    toggle(){
        if (this.isPresent){
            this.container.classList.add('hide');
            this.isPresent = false;
        } else {
            this.container.classList.remove('hide');
            this.isPresent = true;
        }
    }
}

xjs.ready().then(setTimeout(function(){
    var container = document.getElementById('message-container');
    var background = document.getElementById('message-background');
    var title = document.getElementById('message-title');
    var subTitle = document.getElementById('message-subtitle');
    var icon = document.getElementById('message-img');
    var isPresent = true;
    showTrack()

    function toggle(){
        if (!debug){
            if (isPresent){
                container.classList.add('hide');
                isPresent = false;
            } else {
                container.classList.remove('hide');
                isPresent = true;
            }
        }
    }

    function readJSON(path){
        return xjs.IO.getFileContent(path).then(function(base64Content) {
            var actualContent = decodeURIComponent(escape(window.atob(base64Content)));
            var songJson = JSON.parse(actualContent);
            return songJson;
        });
    }

    function readCoverArt(path){
        return xjs.IO.getFileContent(path).then(function(base64Content){
            var image = new Image();
            image.src = "data:image/jpeg;base64," + base64Content;
            // coverArt = base64Content;
            return image;
        });
    }

    function setCoverArt(image){
        var ctx = icon.getContext("2d");
        ctx.drawImage(image, 0, 0, icon.width, icon.height);
        var ctx = background.getContext("2d");
        ctx.drawImage(image, 0, 0, background.width, background.width);
        // console.log(background.style.backgroundImage);
    }

    function showTrack(){
        readJSON(musicJsonPath).then(function(json){
            if (json["nowPlaying"] != prevTrackStr){
                readCoverArt(albumArtPath).then(function(image){
                    if (coverArt != image.src) {
                        console.log(coverArt);
                        console.log(image.src);
                        titleStr = json["trackName"];
                        subtitleStr = json["artistName"] + " - " + json["albumName"];
                        prevTrackStr = json["nowPlaying"];
                        title.innerText = titleStr;
                        subTitle.innerText = subtitleStr;
                        setCoverArt(image);
                        setTimeout(toggle, 1000);
                        setTimeout(toggle, onScreenTimeout);
                        coverArt = image.src;
                    }
                })
            }
        });
    }

    function initialHide(){
        container.style.transitionDuration = "1s";
    }

    function loop(){
        showTrack();
        console.log("loop cycle");
    }

    container.style.transitionDuration = "0s";
    toggle();
    setTimeout(initialHide, 1000);
    setTimeout(toggle, 1000);
    setTimeout(toggle, onScreenTimeout);

    RunLoop = window.setInterval(loop, 3000);

}), 1000);