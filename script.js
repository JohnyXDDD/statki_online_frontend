const socket = io("https://statki-online-server.onrender.com");
setTimeout(()=>{
    if(!socket.connected){
        alert('Serwer startuje. Proszę chwilę poczekać i odświeżyć.')
    }
},5000)
let hitted_ships ={
    single:[],
    double:[],
    triple:[],
    fourfold:[], 
    fivefold:[],
    sixfold:[]
}
let ships={
    single:[0],
    double:[0,1],
    triple:[0,-1,1],
    fourfold:[0,-1,1,2],
    fivefold:[0,-10,1,-1,10],
    sixfold:[0,-10,1,2,-1,10]
}
let ships_rotators={
    double:{
        is_rotated:false,
        rotator:[0,9]
    },
    triple:{
        is_rotated:false,
        rotator:[0,-9,9]
    },
    fourfold:{
        is_rotated:false,
        rotator:[0,-9,9,18]
    },
    sixfold:{
        is_rotated:false,
        rotator:[0,0,0,18,0,0]
    }
}
let active_ship="single";
const letters=["A","B","C","D","E","F","G","H","I","J"];
socket.on('get-ready', ()=>{ //Dodanie przycisku gotowości po dołączeniu drugiego gracza
    const btn=document.createElement('button');
    btn.id='ready';
    btn.innerHTML="GOTOWY";
    $(btn).on('click',user_ready);
    document.querySelector('.game_area').appendChild(btn);
    document.querySelector('.waiting').remove();
})
socket.on('generate-code',code =>{ // Pobranie kodu pokoju z serwera
    document.getElementById('room_id').value=code;
})
socket.on('lets_play_game', ()=>{ // początek walki
    document.getElementById('ready').remove();
    socket.emit('check_board');
})
socket.on('correct_board', (my_ships)=>{ // pobranie najnowszej wersji rozmieszczenie statków użytkownika z serwera, dodanie planszy przeciwnika, kolejność
    const blocks_array=Array.from(document.querySelectorAll('.block'));
    blocks_array.forEach(block =>{
        block.className="block";
    })
    for(const key in my_ships){
        my_ships[key].forEach(id=>{
            document.getElementById(id).classList.add('ship',key)
        })
    }
    let id_counter=1;
    const board=document.createElement('div');
    board.classList.add('board');
    for(let i=0;i<11;i++){
        for(let j=0;j<11;j++){
            const div=document.createElement('div');
            if(i==0)
            {
                div.classList.add('info');
                if(j!=0){
                    div.innerHTML=letters[j-1]; 
                }
            }
            else{
                if(j==0){
                    div.classList.add('info');
                    div.innerHTML=i;
                }
                else{
                    div.classList.add('block');
                    div.id=`enemy${id_counter}`;
                    $(div).on('click',function(){
                        let str=(div.id).replace("enemy","");
                        shot(str);
                    });
                    id_counter++;
                }
            }
            board.appendChild(div);
        }
    }
    document.querySelector('.info_header').innerHTML="GRA W TOKU";
    document.querySelector('.center_div').classList.add('two_boards_inside');
    const user_header=document.createElement('h2');
    user_header.classList.add('info-h2');
    user_header.innerHTML="Twoja plansza";
    document.querySelector('.user').prepend(user_header);
    const enemy=document.createElement('div');
    enemy.classList.add('enemy');
    const enemy_header=document.createElement('h2');
    enemy_header.classList.add('info-h2');
    enemy_header.innerHTML="Plansza przeciwnika";
    enemy.appendChild(enemy_header);
    enemy.appendChild(board);
    document.querySelector('.center_div').appendChild(enemy);
    const turn=document.createElement('h2');
    turn.classList.add('turn');
    turn.innerHTML='Oczekiwanie na strzał przeciwnika';
    document.querySelector('.game_area').appendChild(turn);
    socket.emit('is_my_turn');
})
socket.on('change_turn', flag=>{ //zmiana wyświetlania kolejności
    const turn=document.querySelector('.turn');
    if(flag){
        turn.style.color="#B4E602";
        turn.innerHTML="Oddaj strzał";
    }
    else{
        turn.style.color=null;
        turn.innerHTML="Oczekiwanie na strzał przeciwnika";
    }
})
const shot=function(block){//Oddanie strzału
    socket.emit('fire_to_enemy',block);
}
socket.on('update_enemy_board',(result,destroyed,block)=>{//zaaktualizowanie planszy przeciwnka u użytkownika
    $(`#enemy${block}`).off('click');
    popup_function(result,destroyed,block,"Strzelasz");
    if(result){
        document.getElementById(`enemy${block}`).classList.add('hitted');
        hitted_ships[result].push(block);
    }
    else{
        document.getElementById(`enemy${block}`).classList.add('empty');
    }
    if(destroyed){
        const array=hitted_ships[result];
        setTimeout(()=>{
            array.forEach(element=>{
                document.getElementById(`enemy${element}`).classList.add("destroyed");
            })
        },100)
    }
})
socket.on('update_user_board',(result,destroyed,block)=>{ //zaakutalizowanie planszy użytkownika po strzale swoim lub przeciwnika
    popup_function(result,destroyed,block,"Przeciwnik strzela");
    if(result){
        document.getElementById(block).classList.add("we_got_hit");
    }
    else{
        document.getElementById(block).classList.add("clear");
    }
    if(destroyed){
        const blocks_to_remove=Array.from(document.querySelectorAll(`.${result}`));
        blocks_to_remove.forEach(block=>{
            block.classList.add('destroyed');
        })
    }
})
function popup_function(result,destroyed,block,who){ //przygotowanie treści popupa
    const letter_number=(block-1)%10;
    const letter=letters[letter_number];
    const number=Math.ceil(block/10);
    let pop_text=`${who} na ${letter+number}`;
    if(result){
        pop_text +=', trafiony';
        if(destroyed){
            pop_text +=', zatopiony';
        }
    }
    else{
        pop_text +=', pudło';
    }
    show_popup(pop_text);
}
function show_popup(text){ //wyświetlenie popupa po strzale użytkownika lub przeciwnika
    const pop_div=document.createElement('div');
    pop_div.classList.add('popup_text');
    pop_div.innerHTML=text;
    document.querySelector('.popup').appendChild(pop_div);
    setTimeout(() =>{
        pop_div.remove();
    },2500)
}
socket.on('client_popup',text=>{ // przyjęcie wiadomości od serwera i przekierowanie do wyświetlenia popupa
    show_popup(text);
})
socket.on('winner',()=>{ //Jeśli użytkowink wygrał
    const header=document.querySelector('.info_header');
    header.innerHTML='Wygrałeś';
    header.style.color='#52b752';
    after_game();
})
socket.on('loser',(enemy_board)=>{ // Jeśli użytkownik przegrał, wyświetli mu plansze przeciwnika
    const header=document.querySelector('.info_header');
    header.innerHTML='Przegrałeś';
    header.style.color='#d54646';
    for(const key in enemy_board){
        const single_ship=enemy_board[key];
        for(const small_key in single_ship){
            const value=single_ship[small_key];
            document.getElementById(`enemy${value}`).classList.add('ship');
        }
    }
    after_game();
})
function after_game(){//usunięcie clicków z planszy
    document.querySelector('.turn').remove();
    const blocks=Array.from(document.querySelectorAll('.block'));
    blocks.forEach(block =>{
        $(block).off('click');
    })
}
const user_ready=()=>{ //pobranie ustawionych statków i wyslanie ich na serwer, jeśli będzie ich mniej niż 21 serwer nie przyjmie
    let blocks={};
    for(const key in ships){
        const single_ship=Array.from(document.querySelectorAll(`.${key}`));
        let id_array=[];
        for(const block of single_ship){
            id_array.push(Number(block.id));
        }
        blocks[key]=id_array;
    }
    socket.emit('send-board',blocks);
}

$("#play").on('click',function(){ // onclick batona, dołączenie do pokoju, zmiana wyglądu
    const room=document.getElementById('room_id').value;
    if(room.length!=0){
        document.querySelector('.start-box').style.display="none";
        document.querySelector('.game_area').style.display="flex";
        const span=document.createElement('span');
        span.classList.add('game_code');
        document.querySelector('body').appendChild(span);
        span.innerHTML=`${room}`
        socket.emit('start-game',room);
        generate_blocks();
    }
    else{
        show_popup('Kod pokoju nie może być pusty')
    }
})
socket.on('game_can_not_be_finished',(text)=>{//przeładowanie strony i wyświetlenie komunikatu gdy przecwinik sie rozłączy
    console.log('s');
    alert(text);
    window.location.reload();
})
socket.on('you_shall_not_pass',text=>{//wyświetlenie komunikatu i przeładowanie strony gdy użytkownik będzie próbował dołączyć do pełnego pokoju
    alert(text);
    window.location.reload();
})
socket.on('disable_ready_btn',()=>{ // wyłączenie przycisku gotowości po zgłoszeniu
    disable_blocks_clicks();
    const btn=document.getElementById('ready');
    $(btn).off('click',user_ready);
    btn.innerHTML="Oczekiwanie na gotowość przeciwnika";
    btn.style.color="rgb(223, 84, 84)";
    btn.style.backgroundColor="#0b0c10";
    btn.style.cursor='default';
    btn.style.marginTop="20px";
    btn.disabled = true;
    document.querySelector('.change-ships').remove();
    document.querySelector('.rotate_box').remove();
})
function disable_blocks_clicks(){//usunięcie clicków z planszy po kliknięciu gotowości
    const blocks_array=Array.from(document.querySelectorAll('.block'));
    blocks_array.forEach(block =>{
        $(block).off('click');
        $(block).off('mouseover');
        block.style.cursor="default";
    })
}
const generate_blocks=() =>{ //wygenerowanie planszy
    let id_counter=1;
    for(let i=0;i<11;i++){
        for(let j=0;j<11;j++){
            const div=document.createElement('div');
            if(i==0)
            {
                div.classList.add('info');
                if(j!=0){
                    div.innerHTML=letters[j-1]; 
                }
            }
            else{
                if(j==0){
                    div.classList.add('info');
                    div.innerHTML=i;
                }
                else{
                    div.classList.add('block');
                    div.id=id_counter;
                    $(div).on('click',function(){
                        clicked(div.id)
                    });
                    $(div).on('mouseover',function(){
                        preview(div.id)
                    });
                    id_counter++;
                }
            }
            document.querySelector('.board').appendChild(div);
        }
    }
    const ships_fields=Array.from(document.querySelectorAll('.ship'));
}
const clicked = function(id){ //ustawianie statków
    id=Number(id);
    const error=check_blocks(id);
    if(!error){
        if(document.querySelector('.active')){
            document.querySelector('.active').classList.remove("active");
        }
        delete_same_ship(active_ship);
        document.getElementById(id).classList.add("ship",active_ship);
        $(`#${id}`).on('click',function(){
            delete_ship(id)
        });
        for(const move of ships[active_ship]){
            const step=Number(move);
            if(step){
                let next=step+id;
                document.getElementById(next).classList.add("ship",active_ship);
                $(`#${next}`).on('click',function(){
                    delete_ship(id);
                });
            }
        }
        clear(id);
        document.getElementById(active_ship).style.color="rgb(223, 84, 84)";
        active_ship=null;
    }
}
const preview= function(id){//wyświetlenie podglądu statku na planszy
    id=Number(id);
    const error=check_blocks(id);
    if(!error)
    {
        document.getElementById(id).classList.add("preview");
        for(const move of ships[active_ship]){
            const step=Number(move);
            if(step){
                let next=step+id;
                document.getElementById(next).classList.add("preview");
            }
        }
        document.getElementById(id).addEventListener("mouseout",function(){
            clear(id);
        },{once:true});
    }
}
const delete_same_ship=function(ship_to_delete){ //usunięcie statku z planszy, jeśli będziemy chcieli postawić jeszcze raz ten sam
    const same_ship_array=Array.from(document.querySelectorAll(`.${ship_to_delete}`));
    for(const ship of same_ship_array){
        ship.classList.remove(`ship`,ship_to_delete);
    }
}
const delete_ship = function(id){//usunięcie statku z planszy
    active_ship=null;
    if(document.querySelector('.active')){
        document.querySelector('.active').classList.remove("active");
    }
    for(const key in ships)
    {
        if(document.getElementById(id).classList.contains(key)){
            const blocks=Array.from(document.querySelectorAll(`.${key}`));
            for(const block of blocks){
                block.classList.remove("ship",key);
                $(block).off('click');
                $(block).on('click',function(){
                    clicked(block.id)
                });
            }
            document.getElementById(key).style.color=null;
            break
        }
    }
}
const check_blocks=function(id){ //sprawdzenie czy dane miejsce spełnia zasady
    let error=false;
    if(active_ship){
        for(const move of ships[active_ship]){
            const step=Number(move);
            if(((id%10==0 || id%10==9) && (step+id)%10==1) || ((id%10==1 || id%10==2) && (step+id)%10==0)){
                error=true;
            }
            if((step+id)<1 || (step+id)>100){
                error=true;
            }
            else{
                if(document.getElementById(id).classList.contains("ship") || document.getElementById(step+id).classList.contains("ship") )
                {
                    error=true;
                }
                let check_blocks_array=[-11,-10,-9,-1,1,9,10,11];
                for(const check_block of check_blocks_array)
                {
                    let normal_check=true;
                    if((step+id)%10==1 && (step+id+check_block)%10==0)
                    {
                        normal_check=false;
                    }
                    else if((step+id)%10==0 && (step+id+check_block)%10==1)
                    {
                        normal_check=false;
                    }
                    if(normal_check){
                        const block_to_check=id+step+check_block;
                        if(block_to_check>=1 && block_to_check<=100){           
                            if(document.getElementById(block_to_check).classList.contains("ship")){
                                error=true;
                            }
                        }
                    }
                }
            }
        }
    }
    else{
        error=true;
    }
    return error;
}
const clear = function(id){//usunięcie podglądu statku z planszy
    if(active_ship){
        document.getElementById(id).classList.remove("preview");
        for(const move of ships[active_ship]){
            const step=Number(move);
            let next=step+id;
            document.getElementById(next).classList.remove("preview");
        }
    }
}
const change_ship = function(){ // zmiana aktywnego statku
    if(document.querySelector('.active')){
        document.querySelector('.active').classList.remove("active");
    }
    this.classList.add('active');
    const clicked_id=this.id;
    active_ship=clicked_id;
}
document.getElementById('rotate').addEventListener('click',rotate_current_ship);
function rotate_current_ship(){ // obracanie staków
    if(active_ship && ships_rotators[active_ship]){
        let rotate_info=ships_rotators[active_ship];
        const rotator=rotate_info.rotator;
        let ship_array=ships[active_ship];
        const len=ships[active_ship].length;
        if(!rotate_info.is_rotated){
            for(let i=0; i<len; i++){
                ship_array[i]+=rotator[i];
            }
            rotate_info.is_rotated=true;
        }
        else{
            for(let i=0; i<len; i++){
                ship_array[i]-=rotator[i];
            }
            rotate_info.is_rotated=false;
        }
    }
}
$('.change-ship').on('click',change_ship);
document.getElementById('open_info').addEventListener('click',()=>{
    const inst_box=document.querySelector('.instruction');
    if(!inst_box.classList.contains('visible')){
        inst_box.style.transform=null;
        inst_box.classList.add('visible');
        gsap.from('.instruction',{duration:1,y:'-200%', ease: "back.out(1.7)"});
    }
});
document.getElementById('close_instruction').addEventListener('click',()=>{
    const inst_box=document.querySelector('.instruction');
    if(inst_box.classList.contains('visible')){
        gsap.to('.instruction',{duration:1,y:'-200%', ease: "back.out(1.7)"});
        setTimeout(()=>{
            inst_box.classList.remove('visible');
        },1000);
    }
});