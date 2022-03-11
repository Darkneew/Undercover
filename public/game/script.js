window.onload = () => { // On window load 
    // Constants
    var timeout;
    var voting = [false, undefined];
    const SCROLLLIMIT = 0;
    const usrnm = document.cookie.match(new RegExp('(^| )name=([^;]+)'));
    let avatar = document.cookie.match(new RegExp('(^| )avatar=([^;]+)'));
    if (!avatar || avatar.length <= 1) avatar = null
    else avatar = parseInt(avatar[2]);
    if (!usrnm) location.href = "/lobby/0";
    const username = decodeURIComponent(usrnm[2]);
    username.split(">").join("&gt").split("<").join("&lt").split("\\n").join("");
    const socket = io();
    const gameId = location.href.split("/games/")[1];
    socket.emit("joining", [gameId, username, avatar]);
    const INPUT = document.getElementById("input");
    let lpseudo = document.getElementsByClassName("pseudo");
    for (let i = 0; i < lpseudo.length; i++) {
        lpseudo[i].innerHTML += username;
    };

    const getMessage = (msg, author) => {
        let mmm = document.createElement("div");
        mmm.classList.add("message");
        if (author == "Undercover") mmm.classList.add("server-message")
        else mmm.classList.add("other-message");
        mmm.classList.add("other-message");
        mmm.classList.add("float-right");
        mmm.innerHTML = msg;
        let mdn = document.createElement("span");
        mdn.classList.add("message-data-name");
        mdn.innerHTML = author;
        let md = document.createElement("div");
        md.classList.add("message-data");
        md.classList.add("align-right");
        md.appendChild(mdn);
        let li = document.createElement("li");
        li.classList.add("clearfix");
        li.appendChild(md);
        li.appendChild(mmm);
        if (document.getElementsByClassName("chat-history")[0].scrollTop + document.getElementsByClassName("chat-history")[0].clientHeight - document.getElementById("messages").clientHeight > SCROLLLIMIT){
          document.getElementById("messages").appendChild(li);
          document.getElementsByClassName("chat-history")[0].scrollTop = (document.getElementsByClassName("chat-history")[0].clientHeight + document.getElementById("messages").clientHeight + 100)*2;;
          return li;
        };
        document.getElementById("messages").appendChild(li);
        return li
    };

    // Managing the input
    document.getElementById("inputform").addEventListener("submit", (e)=> {
        e.preventDefault();        
        getMessage("Your turn just ended", "Undercover")
        socket.emit("wordinput",INPUT.value);
        INPUT.value = "";
        INPUT.style.display = "none";
        INPUT.style.cursor = "not-allowed";
    });

    // function to create a player ingame
    const CreatePlayerCard = (name) => {
        let players =  document.getElementById("players"), num;
        if (players.childNodes.length > 0) num = parseInt(players.childNodes[players.childNodes.length - 1].id.split("").splice(1).join("")) + 1
        else num = 0;
        let card = document.createElement("div");
        card.className = "player";
        card.style.position = "absolute";
        card.style.top = `${Math.floor(num/5)*27}vh`;
        card.style.left = `${11*(num%5)}vw`;
        card.id = `p${num}`;
        let img = document.createElement("img");
        img.alt = "avatar";
        img.className = "avatar";
        img.src = `/avatars/${name[1]}.png`;
        card.appendChild(img);
        card.appendChild(document.createElement("br"))
        let sp = document.createElement("span");
        sp.className = "name";
        sp.innerHTML = name[0].trim();
        card.appendChild(sp);
        card.onclick = (e) => {
            let el = e.target;
            while (el.className != "player") el = el.parentNode;
            if (!voting[0]) return;
            // on vote
            let ppl = document.getElementsByClassName("player");
            if (voting[1]) {
                for(var i=0;i < ppl.length;i++){
                    if (ppl[i].childNodes[2].innerHTML == voting[1]) {
                        if (voting[1] == username) {ppl[i].childNodes[0].style.boxShadow = "0px 0px 29px 1px rgba(0, 90, 254, 0.61)";}
                        else ppl[i].childNodes[0].style.boxShadow = "none";
                    };
                };
            };
            voting[1] = el.childNodes[2].innerHTML;
            el.childNodes[0].style.boxShadow = "0px 0px 29px 1px rgba(255, 34, 0, 0.61)";
        };
        players.appendChild(card);
    };

    // On refused connection
    socket.on("refused", (reason)=> {
        location.href = "/lobby/" + reason;
    })

    // When sending a message
    document.getElementById("chatform").addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = document.getElementById("message-to-send");
        if (inp.value == "") return;
        let str = JSON.stringify(inp.value).split(">").join("&gt").split("<").join("&lt").split("\\n").join("<br/>");
        let mmm = document.createElement("div");
        mmm.classList.add("message");
        mmm.classList.add("my-message");
        inp.value = "";
        mmm.innerHTML = str.substring(1, str.length-1);
        let mdn = document.createElement("span");
        mdn.classList.add("message-data-name");
        mdn.innerHTML = username;
        let md = document.createElement("div");
        md.classList.add("message-data");
        md.appendChild(mdn);
        let li = document.createElement("li");
        li.appendChild(md);
        li.appendChild(mmm);
        document.getElementById("messages").appendChild(li);
        document.getElementsByClassName("chat-history")[0].scrollTop = (document.getElementsByClassName("chat-history")[0].clientHeight + document.getElementById("messages").clientHeight + 100)*2;;
        socket.emit("newMessage", str);
    });

    // Receiving message
    socket.on("newMessage", (data)=> {
        getMessage(data[1].substring(1, data[1].length-1), data[0]);
        if (data[0] == "Undercover" && data[1].startsWith("\"Welcome")) {
            document.getElementById("loading").style.animation ="fadeOut ease 2s";
            setTimeout(()=>{document.getElementById("loading").style.display ="none"}, 1900 );
        };        
    });

    // When new players arrive
    socket.on("addPlayer", (name) => {
        if (document.getElementById("waititle").innerHTML.endsWith("No one")) document.getElementById("waititle").innerHTML = "Waiting:";
        let li = document.createElement("li");
        li.innerHTML = name[0];
        li.className = `avatar${name[2] || 1}`;
        document.getElementById("waitingList").appendChild(li);
        if (name[1] > 0) {
            document.getElementById("waitcontnum").style.display = "block";
            let el = document.getElementById("waitcontnum");
            if (!el.childNodes.length) {
                let sp = document.createElement("span");
                sp.id = "waitnum";
                sp.innerHTML = name[1]
                el.innerHTML = "Waiting for ";
                el.appendChild(sp);
                el.innerHTML += " more person";
            } else {
                document.getElementById("waitnum").innerHTML = name[1]
            }
        } else {
            let el = document.getElementById("waitcontnum");
            if (el.childNodes.length) {
                el.childNodes.forEach((child) => {
                    el.removeChild(child);
                });
            };
            el.innerHTML = "Ready to launch the game !";
        }
    });
    // When players quit
    socket.on("removePlayer", (name) => {
        const list = document.getElementById("waitingList");
        list.childNodes.forEach((child) => {
            if (child.innerHTML.startsWith(name[0])) list.removeChild(child);
        });
        if (!list.childNodes.length) {
            document.getElementById("waititle").innerHTML = "Waiting: No one";
            document.getElementById("waitcontnum").style.display = "none";
        }
        if (name[1] <= 0) {
            let el = document.getElementById("waitcontnum");
            if (!el.childNodes.length) return;
            el.childNodes.forEach((child) => {
                el.removeChild(child);
            });
            el.innerHTML = "Ready to launch the game !";
        } else {
            if (!document.getElementById("waitnum")) {
                let el = document.getElementById("waitcontnum");
                let sp = document.createElement("span");
                sp.id = "waitnum";
                el.innerHTML = "Waiting for ";
                el.appendChild(sp);
                el.innerHTML += " more person";
            }
            document.getElementById("waitnum").innerHTML = name[1]
        }
    })

    // Ready button
    document.getElementById("ready").addEventListener("click", (event) => {
        if (event.target.innerHTML == "READY") {
            document.getElementById("ready").style.backgroundColor = "#800000";
            event.target.innerHTML = "NOT READY";
            socket.emit("not_ready");
        } else {
            document.getElementById("ready").style.backgroundColor = "#00802b";
            event.target.innerHTML = "READY";
            socket.emit("ready");
        };
    });

    // On ready / not_ready
    socket.on("ready", (name) => {
        document.getElementById("waitingList").childNodes.forEach((child) => {
            if (child.innerHTML == name) child.innerHTML += " ✓";
        });
    });
    socket.on("not_ready", (name) => {
        document.getElementById("waitingList").childNodes.forEach((child) => {
            if (child.innerHTML.startsWith(name)) child.innerHTML = name;
        });
    });

    // On launching
    socket.on("launching", () => {
        let timer = document.getElementById("timer");
        timer.style.display = "block";
        document.getElementById("Waiting").style.display = "none";
        let timing = (n) => {
            if (n < 0) return;
            timer.innerHTML = n;
            setTimeout(timing, 1000, n-1);
        }
        timeout = timing(10);
    });

    // Cancelling launching
    socket.on("cancel_launching", () => {
        if (timeout) clearTimeout();
        document.getElementById("Waiting").style.display = "block";
        document.getElementById("timer").style.display = "none";
    });

    // Begining
    socket.on("begining", (word) => {
        CreatePlayerCard([username, avatar]);
        document.getElementsByClassName("avatar")[0].style.boxShadow = "0px 0px 29px 1px rgba(0, 90, 254, 0.61)";
        document.getElementById("waitingList").childNodes.forEach((child) => {
            if (child == undefined) return;
            CreatePlayerCard([child.innerHTML.split("✓").join(""), child.className.split("avatar")[1]]);
        });
        getMessage(`The game is begining! Your word is ${word || "erreur interne"}`, "Undercover");
        document.getElementById("Waiting").style.display = "none";
        document.getElementById("timer").style.display = "none";
        document.getElementById("ready").style.display = "none";
        document.getElementById("home").style.display = "none";
        document.getElementById("ingame").style.display = "block";
    });
    
    // Turn
    socket.on("BeginTurn", () => {
        getMessage("It is your turn!", "Undercover");
        INPUT.style.display = "block";
        INPUT.style.cursor = "text";
    });
    socket.on("EndTurn", () => {
        getMessage("Your turn just ended", "Undercover")
        socket.emit("wordinput",INPUT.value);
        INPUT.value = "";
        INPUT.style.display = "none";
        INPUT.style.cursor = "not-allowed";
    });
    socket.on("BeginTurnOf", (usr) => {
        let ppl = document.getElementsByClassName("player");
        for(var i=0;i < ppl.length;i++){
            if (ppl[i].childNodes[2].innerHTML == usr) ppl[i].childNodes[0].style.boxShadow = "0px 0px 29px 1px rgba(17, 59, 8, 0.61)";
        }
    });
    socket.on("EndTurnOf", (usr) => {
        let ppl = document.getElementsByClassName("player");
        for(var i=0;i < ppl.length;i++){
            if (ppl[i].childNodes[2].innerHTML == usr) {
                if (usr == username) {ppl[i].childNodes[0].style.boxShadow = "0px 0px 29px 1px rgba(0, 90, 254, 0.61)";}
                else ppl[i].childNodes[0].style.boxShadow = "none";
            }
        }
    });

    // Receiving new word
    socket.on("newWord", (word, name) => {
        let ppl = document.getElementsByClassName("player");
        for(var i=0;i < ppl.length;i++){
            if (ppl[i].childNodes[2].innerHTML != name) continue;
            let w = document.createElement("div");
            w.className = "wordtitle";
            if (!word) {
                w.innerHTML = "no word"
                ppl[i].appendChild(w);
            } else {
            w.innerHTML = "word:"
            ppl[i].appendChild(w);
            ppl[i].innerHTML += word;
            }
        }
    });

    // Vote
    socket.on("BeginVote", () => {
        getMessage("Begining the votes","Undercover");
        voting[0] = true;
    });
    socket.on("EndVote", () => {
        voting[0] = false;
        getMessage("Ending the votes","Undercover");
        let ppl = document.getElementsByClassName("player");
        for(var i=0;i < ppl.length;i++){
            if (ppl[i].childNodes[2].innerHTML == voting[1]) {
                if (voting[1] == username) {ppl[i].childNodes[0].style.boxShadow = "0px 0px 29px 1px rgba(0, 90, 254, 0.61)";}
                else ppl[i].childNodes[0].style.boxShadow = "none";
            }
        };
        socket.emit("ivote", voting[1]);
    }); 

    // Scoring
    socket.on("results", (result) => {
        let prop = "was";
        if (!result[2]) prop += "n't";
        getMessage(`${result[0]} was ejected with ${result[1]} votes. He ${prop} the undercover`, "Undercover");
    });
};

