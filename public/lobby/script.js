const NB_OF_AVATARS = 50;

window.onload = () => {
    let error = location.href.split('/lobby/');
    const IMG = document.getElementById("avatarimage");
    document.getElementById("rightarrow").addEventListener('click', () => {
      let num = parseInt(IMG.src.split("avatars/")[1].split(".")[0]);
      if (num >= NB_OF_AVATARS) num = 0;
      document.cookie = `avatar=${num+1};path=/`;
      IMG.src = `/avatars/${num+1}.png`;
    });
    document.getElementById("leftarrow").addEventListener('click', () => {
      let num = parseInt(IMG.src.split("avatars/")[1].split(".")[0]);
      if (num <= 1) num = NB_OF_AVATARS + 1;
      document.cookie = `avatar=${num-1};path=/`;
      IMG.src = `/avatars/${num-1}.png`;
    });
    let avnum = document.cookie.match(new RegExp('(^| )avatar=([^;]+)'));
    if (avnum) {IMG.src = `/avatars/${avnum[2]}.png`}
    else {
        let n = 1+Math.floor(Math.random()*NB_OF_AVATARS);
        document.cookie = `avatar=${n};path=/`;
        IMG.src = `/avatars/${n}.png`;
        };
    if (window.innerWidth < 600) {
      let w = document.getElementsByClassName("right")[0].clientWidth;
      let wprime = w*0.3;  
      let str = `
      m ${w*0.1},${w*0.25} ${w*0.7},0
      c 0,0 ${wprime*0.30},0 ${wprime*0.30},${wprime*0.35} 0,${wprime*0.35} ${wprime*-0.30},${wprime*0.35} ${wprime*-0.30},${wprime*0.35} 
      h ${-w*0.7} 
      c 0,0 ${wprime*-0.30},0 ${wprime*-0.30},${wprime*0.35} 0,${wprime*0.35} ${wprime*0.30},${wprime*0.35} ${wprime*0.30},${wprime*0.35} 
      h ${w*0.6} 
      c 0,0 ${wprime*0.20},0 ${wprime*0.20},${wprime*-0.25} 0,${wprime*-0.25} ${wprime*-0.20},${wprime*-0.25} ${wprime*-0.20},${wprime*-0.25}
      h ${-w*0.48}
      c 0,0 ${wprime*-0.20},0 ${wprime*-0.20},${wprime*0.25} 0,${wprime*0.25} ${wprime*0.20},${wprime*0.25} ${wprime*0.20},${wprime*0.25}
      h ${w*0.48}
      `
      document.getElementById("animationpath").setAttribute("d",str);
    };
    document.getElementById("form").addEventListener("submit", (e)=> {
        document.getElementById("loading").style.display = "block";
        document.getElementById("loading").style.animation = "fadeIn ease 0.25s";
        setTimeout(() => {
            document.getElementById("loading").style.top = "0vh";
        }, 135);
    });
    if (!error[1]) return;
    let errmsg;
    switch (error[1]) {
        case "0":
            errmsg = "Please enter your pseudo.";
            break;
        case "1":
            errmsg = "Non existing game."
            break;
        case "2":
            errmsg = "Game full."
            break;
        case "3":
            errmsg = "Pseudo is already used."
            break;
        case "4":
            errmsg = "Game has already started."
            break;
        case "5":
            errmsg = "Player already in game."
            break;
        default:
            errmsg = "Unknown error."
            break;
    }
    let er = document.createElement("div");
    er.id = "errormsg";
    let iel = document.createElement("i");
    iel.className = "fa fa-times-circle";
    er.appendChild(iel);
    er.innerHTML += errmsg;
    document.getElementsByClassName("page")[0].appendChild(er);
    setTimeout(()=>{
      document.getElementsByClassName("page")[0].removeChild(er);
    }, 10000);
};
var current = null;
if (window.innerWidth < 600) { //pour les petits écrans
    document.querySelector('#name').addEventListener('focus', function(e) {
        if (current) current.pause();
        let w = document.getElementsByClassName("right")[0].clientWidth;    
        let wprime = w*2.9;  
        current = anime({
            targets: 'path',
            strokeDashoffset: {
            value: 0,
            duration: 700,
            easing: 'easeOutQuart'
            },
            strokeDasharray: {
            value: `${wprime*0.240} ${wprime*1.368}`,
            duration: 700,
            easing: 'easeOutQuart'
            }
        });
    });
    document.querySelector('#id').addEventListener('focus', function(e) {
        if (current) current.pause();
        let w = document.getElementsByClassName("right")[0].clientWidth;    
        let wprime = w*2.9;  
        current = anime({
            targets: 'path',
            strokeDashoffset: {
            value: wprime*-0.350,
            duration: 700,
            easing: 'easeOutQuart'
            },
            strokeDasharray: {
            value: `${wprime*0.240} ${wprime*1.368}`,
            duration: 700,
            easing: 'easeOutQuart'
            }
        });
    });
    document.querySelector('#submit').addEventListener('focus', function(e) {
        if (current) current.pause();
        let w = document.getElementsByClassName("right")[0].clientWidth;    
        let wprime = w*3;  
        current = anime({
            targets: 'path',
            strokeDashoffset: {
            value: w*-2.6,
            duration: 700,
            easing: 'easeOutQuart'
            },
            strokeDasharray: {
            value: `${wprime*0.530} ${wprime*1386}`,
            duration: 700,
            easing: 'easeOutQuart'
            }
        });
    });
} else {
    document.querySelector('#name').addEventListener('focus', function(e) {
        if (current) current.pause();
        current = anime({
            targets: 'path',
            strokeDashoffset: {
            value: 0,
            duration: 700,
            easing: 'easeOutQuart'
            },
            strokeDasharray: {
            value: '240 1386',
            duration: 700,
            easing: 'easeOutQuart'
            }
        });
    });
    document.querySelector('#id').addEventListener('focus', function(e) {
        if (current) current.pause();
        current = anime({
            targets: 'path',
            strokeDashoffset: {
            value: -336,
            duration: 700,
            easing: 'easeOutQuart'
            },
            strokeDasharray: {
            value: '240 1386',
            duration: 700,
            easing: 'easeOutQuart'
            }
        });
    });
    document.querySelector('#submit').addEventListener('focus', function(e) {
        if (current) current.pause();
        current = anime({
            targets: 'path',
            strokeDashoffset: {
            value: -730,
            duration: 700,
            easing: 'easeOutQuart'
            },
            strokeDasharray: {
            value: '530 1386',
            duration: 700,
            easing: 'easeOutQuart'
            }
        });
    });
}